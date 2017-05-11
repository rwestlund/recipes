/*
 * Copyright (c) 2016-2017, Randy Westlund. All rights reserved.
 * This code is under the BSD-2-Clause license.
 *
 * This file exposes the database interface for recipes.
 */

package db

import (
	"database/sql"
	"encoding/json"
	"strconv"
	"strings"

	"github.com/rwestlund/recipes/defs"
)

// SQL to select recipes.
var queryRows = `SELECT recipes.id, recipes.revision,
            recipes.amount, recipes.author_id, recipes.directions,
            recipes.ingredients, recipes.notes, recipes.oven,
            recipes.source, recipes.summary, recipes.time, recipes.title,
            COALESCE(json_agg(tags.tag) FILTER (WHERE tags.tag IS NOT NULL),
                    '[]'::json)
                AS tags,
            users.name,
            COALESCE((SELECT json_agg(json_build_object(
                        'id', linked_recipes.dest,
                        'title', lr.title))
                    FROM linked_recipes, recipes lr
                    WHERE recipes.id = linked_recipes.src
                        AND linked_recipes.dest = lr.id),
                '[]'::json)
                AS linked_recipes
        FROM recipes
        JOIN users
            ON recipes.author_id = users.id
        LEFT JOIN tags
            ON recipes.id = tags.recipe_id `

// scanRecipe is a helper function to read Recipe out of a sql.Rows object.
func scanRecipe(row *sql.Rows) (*defs.Recipe, error) {
	// JSON fields need special handling.
	var ingredients, directions, tags string
	var linkedRecipes []byte
	var r defs.Recipe
	err := row.Scan(&r.ID, &r.Revision, &r.Amount, &r.AuthorID, &directions,
		&ingredients, &r.Notes, &r.Oven, &r.Source, &r.Summary,
		&r.Time, &r.Title, &tags, &r.AuthorName, &linkedRecipes)
	if err != nil {
		return nil, err
	}
	// Unpack JSON fields.
	e := json.Unmarshal([]byte(directions), &r.Directions)
	if e != nil {
		return nil, e
	}
	e = json.Unmarshal([]byte(ingredients), &r.Ingredients)
	if e != nil {
		return nil, e
	}
	e = json.Unmarshal([]byte(tags), &r.Tags)
	if e != nil {
		return nil, e
	}
	e = json.Unmarshal(linkedRecipes, &r.LinkedRecipes)
	if e != nil {
		return nil, e
	}
	return &r, nil
}

// FetchRecipes returns all recipes from the database that match the given
// filter. The query in the filter can match either the title or the tag.
func FetchRecipes(filter defs.ItemFilter) ([]defs.Recipe, error) {
	// Hold the dynamically generated portion of our SQL.
	var queryText string
	// Hold all the parameters for our query.
	var params []interface{}

	// Tokenize search string on spaces. Each term must be matched in the title
	// or tags for a recipe to be returned.
	var terms = strings.Split(filter.Query, " ")
	for i, term := range terms {
		// Ignore blank terms (comes from leading/trailing spaces).
		if term == "" {
			continue
		}
		if i == 0 {
			queryText += "\n\t HAVING (title ILIKE $"
		} else {
			queryText += " AND (title ILIKE $"
		}
		params = append(params, "%"+term+"%")
		queryText += strconv.Itoa(len(params)) +
			"\n\t\t OR string_agg(tags.tag, ' ') ILIKE $" +
			strconv.Itoa(len(params)) + ") "
	}
	queryText += "\n\t ORDER BY title "

	if filter.Count != 0 {
		params = append(params, filter.Count)
		queryText += "\n\t LIMIT $" + strconv.Itoa(len(params))
	}
	if filter.Skip != 0 {
		params = append(params, filter.Count*filter.Skip)
		queryText += "\n\t OFFSET $" + strconv.Itoa(len(params))
	}
	// Run the actual query.
	var rows, err = DB.Query(queryRows+
		"\n\t GROUP BY recipes.id, users.name "+
		queryText, params...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// The array we're going to fill. The append() builtin will approximately
	// double the capacity when it needs to reallocate, but we can save some
	// copying by starting at a decent number.
	var recipes = make([]defs.Recipe, 0, 20)
	var r *defs.Recipe
	// Iterate over rows, reading in each Recipe as we go.
	for rows.Next() {
		r, err = scanRecipe(rows)
		if err != nil {
			return nil, err
		}
		recipes = append(recipes, *r)
	}
	return recipes, rows.Err()
}

// FetchRecipeTitles returns a JSON list of existing titles.
func FetchRecipeTitles() ([]byte, error) {
	// Return them all in one row.
	var rows, err = DB.Query(`SELECT json_agg(
            json_build_object('id', id, 'title', title) ORDER BY title)
            FROM recipes`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var titles []byte

	// In this case, we just want an empty list if nothing was returned.
	if !rows.Next() {
		return titles, nil
	}

	// This is alredy JSON, so just leave it as a []byte.
	err = rows.Scan(&titles)
	return titles, err
}

// FetchRecipe returns one Recipe by ID.
func FetchRecipe(id int) (*defs.Recipe, error) {
	var rows, err = DB.Query(queryRows+
		" WHERE recipes.id = $1 GROUP BY recipes.id, users.name", id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	if !rows.Next() {
		return nil, sql.ErrNoRows
	}
	return scanRecipe(rows)
}

// CreateRecipe creates a recipe in the database, returning fields in the
// passed object. Only Recipe.Title, Recipe.Summary, and Recipe.AuthorId are
// read.
func CreateRecipe(recipe *defs.Recipe) (*defs.Recipe, error) {
	//TODO some input validation on would be nice
	var rows, err = DB.Query(`INSERT INTO recipes (title, summary, author_id)
            VALUES ($1, $2, $3)
                RETURNING id`,
		recipe.Title, recipe.Summary, recipe.AuthorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	if !rows.Next() {
		return nil, sql.ErrNoRows
	}
	var id int
	err = rows.Scan(&id)
	if err != nil {
		return nil, err
	}
	return FetchRecipe(id)
}

// SaveRecipe takes a Recipe to save and the userID of the current user trying
// the operation. If the user does not match the AuthorID of the recipe in the
// database, this will return sql.ErrNoRows. If the force flag is set, this
// check is disabled (such as for an admin).
//
// We must do the validation here to prevent a malicious user from setting the
// AuthorID of the Recipe they're trying to save to their own.
func SaveRecipe(recipe *defs.Recipe, userID int, force bool) (*defs.Recipe, error) {
	//TODO some input validation on would be nice
	/* Build JSON from complex fields. */
	var directions, err = json.Marshal(recipe.Directions)
	if err != nil {
		return nil, err
	}
	ingredients, err := json.Marshal(recipe.Ingredients)
	if err != nil {
		return nil, err
	}
	// Hold the dynamically generated portion of our SQL.
	var queryText string
	// Hold all the parameters for our query.
	var params []interface{}

	queryText = `UPDATE recipes SET (revision, amount, directions,
                ingredients, notes, oven, source, summary, time, title) =
                (revision + 1, $1, $2, $3, $4, $5, $6, $7, $8, $9)
            WHERE id = $10 `
	params = []interface{}{recipe.Amount, directions, ingredients,
		recipe.Notes, recipe.Oven, recipe.Source, recipe.Summary,
		recipe.Time, recipe.Title, recipe.ID}
	// If force is not set, we need to make sure the author is the one making
	// this change.
	if force == false {
		queryText += "AND author_id = $11 "
		params = append(params, userID)
	}

	tx, err := DB.Begin()
	defer tx.Rollback()

	// First we update tags. If the auther check fails, this will be rolled
	// back at the end of the function. This deleting and then inserting is
	// somewhat wasteful, but it's simple to implement.

	_, err = tx.Exec("DELETE FROM tags WHERE recipe_id = $1", recipe.ID)
	if err != nil {
		return nil, err
	}
	// Insert the new tags.
	for _, tag := range recipe.Tags {
		_, err = tx.Exec(`INSERT INTO tags (recipe_id, tag)
                VALUES ($1, $2)`, recipe.ID, tag)
		if err != nil {
			return nil, err
		}
	}

	// Second, we update linked_recipes. If the auther check fails, this will
	// be rolled back at the end of the function. This deleting and then
	// inserting is somewhat wasteful, but it's simple to implement.
	_, err = tx.Exec("DELETE FROM linked_recipes WHERE src = $1", recipe.ID)
	if err != nil {
		return nil, err
	}
	// Insert the new linked_recipes.
	var lr defs.LinkedRecipe
	for _, lr = range recipe.LinkedRecipes {
		_, err = tx.Exec(`INSERT INTO linked_recipes (src, dest)
                VALUES ($1, $2)`, recipe.ID, lr.ID)
		if err != nil {
			return nil, err
		}
	}

	// Finally, run the actual query to update the Recipe fields.
	rows, err := tx.Query(queryText+"RETURNING id", params...)
	if err != nil {
		return nil, err
	}
	if !rows.Next() {
		return nil, sql.ErrNoRows
	}
	var id int
	err = rows.Scan(&id)
	if err != nil {
		return nil, err
	}
	rows.Close()
	// Everything worked, time to commit the transaction.
	err = tx.Commit()
	if err != nil {
		return nil, err
	}
	return FetchRecipe(id)
}

// DeleteRecipe takes a Recipe id to delete and the userID of the current user
// trying the operation. If the user does not match the AuthorID of the recipe
// in the database, this will return sql.ErrNoRows. If the force flag is set,
// this check is disabled (such as for an admin).
//
// We must do the validation here to prevent a malicious user from setting the
// author_id of the Recipe they're trying to save to their own.
func DeleteRecipe(recipeID int, userID int, force bool) error {
	// Hold the dynamically generated portion of our SQL.
	var queryText = "DELETE FROM recipes WHERE id = $1 "
	// Hold all the parameters for our query.
	var params []interface{}
	params = []interface{}{recipeID}

	// If force is not set, we need to make sure the author is the one making
	// this change.
	if force == false {
		queryText += "AND author_id = $2 "
		params = append(params, userID)
	}

	var rows, err = DB.Query(queryText+"RETURNING id", params...)
	if err != nil {
		return err
	}
	defer rows.Close()
	// This happens if they are not authorized.
	if !rows.Next() {
		return sql.ErrNoRows
	}
	return nil
}
