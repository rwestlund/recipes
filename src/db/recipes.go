/* The database interface for recipes. */

package db

import (
    "log"
    "strconv"
    "strings"
    "database/sql"
    "encoding/json"
    "defs"
)

/* SQL to select recipes. */
var query_rows string = `SELECT recipes.id, recipes.revision,
            recipes.amount, recipes.author_id, recipes.directions,
            recipes.ingredients, recipes.notes, recipes.oven,
            recipes.source, recipes.summary, recipes.time, recipes.title,
            json_agg(tags.tag), users.name
        FROM recipes
        JOIN users
            ON recipes.author_id = users.id
        LEFT JOIN tags
            ON recipes.id = tags.recipe_id `

/* Helper function to read Recipe out of a sql.Rows object. */
func scan_recipe(row *sql.Rows) (*defs.Recipe, error) {
    /* JSON fields will need special handling. */
    var ingredients, directions, tags string
    /* The recipe we're going to read in. */
    var r defs.Recipe

    err := row.Scan(&r.Id, &r.Revision, &r.Amount, &r.AuthorId, &directions,
            &ingredients, &r.Notes, &r.Oven, &r.Source, &r.Summary,
            &r.Time, &r.Title, &tags, &r.AuthorName)
    if err != nil {
        return nil, err
    }
    /* Unpack JSON fields. */
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
    return &r, nil
}

/*
 * Fetch all recipes from the database that match the given filter. The query
 * in the filter can match either the title or the tag.
 */
func FetchRecipes(filter *defs.ItemFilter) (*[]defs.Recipe, error) {
    _ = log.Println//DEBUG

    /* Hold the dynamically generated portion of our SQL. */
    var query_text string
    /* Hold all the parameters for our query. */
    var params []interface{};

    /* Tokenize search string on spaces. Each term must be matched in the title
     * or tags for a recipe to be returned.
     */
    var terms []string = strings.Split(filter.Query, " ")
    /* Build and apply having_text. */
    for i, term := range terms {
        /* Ignore blank terms (comes from leading/trailing spaces). */
        if term == "" { continue }

        if i == 0 {
            query_text += "\n\t HAVING (title ILIKE $"
        } else {
            query_text += " AND (title ILIKE $"
        }
        params = append(params, "%" + term + "%")
        query_text += strconv.Itoa(len(params)) +
            "\n\t\t OR string_agg(tags.tag, ' ') ILIKE $" +
            strconv.Itoa(len(params)) + ") "
    }

    query_text += "\n\t ORDER BY title "

    /* Apply count. */
    if filter.Count != 0 {
        params = append(params, filter.Count)
        query_text += "\n\t LIMIT $" + strconv.Itoa(len(params))
    }
    /* Apply skip. */
    if filter.Skip != 0 {
        params = append(params, filter.Count * filter.Skip)
        query_text += "\n\t OFFSET $" + strconv.Itoa(len(params))
    }
    /* Run the actual query. */
    var rows *sql.Rows
    var err error
    rows, err = DB.Query(query_rows +
            "\n\t GROUP BY recipes.id, users.name " +
            query_text , params...)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    /* The array we're going to fill. The append() builtin will approximately
     * double the capacity when it needs to reallocate, but we can save some
     * copying by starting at a decent number.
     */
    var recipes  = make([]defs.Recipe, 0, 200)
    var r *defs.Recipe
    /* Iterate over rows, reading in each Recipe as we go. */
    for rows.Next() {
        r, err = scan_recipe(rows)
        if err != nil {
            return nil, err
        }
        /* Add it to our list. */
        recipes = append(recipes, *r)
    }
    return &recipes, nil
}


/* Fetch one recipe by id. */
func FetchRecipe(id uint32) (*defs.Recipe, error) {
    /* Read recipe from database. */
    var rows *sql.Rows
    var err error
    rows, err = DB.Query(query_rows +
            " WHERE recipes.id = $1 GROUP BY recipes.id, users.name", id)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    /* Make sure we have a row returned. */
    if !rows.Next() {
        return nil, nil
    }
    /* Scan it in. */
    var r *defs.Recipe
    r, err = scan_recipe(rows)
    if err != nil {
        return nil, err
    }
    return r, nil
}

/*
 * Take a reference to a Recipe and create it in the database, returning fields
 * in the passed object.  Only Recipe.Title, Recipe.Summary, and
 * Recipe.AuthorId are read.
 */
func CreateRecipe(recipe *defs.Recipe) (*defs.Recipe, error) {
    var rows *sql.Rows
    var err error
    //TODO some input validation on would be nice
    rows, err = DB.Query(`INSERT INTO recipes (title, summary, author_id)
            VALUES ($1, $2, $3)
                RETURNING id`,
                recipe.Title, recipe.Summary, recipe.AuthorId)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    /* Make sure we have a row returned. */
    if !rows.Next() {
        return nil, sql.ErrNoRows
    }
    /* Scan it in. */
    var id uint32;
    err = rows.Scan(&id)
    if err != nil {
        return nil, err
    }
    /* At this point, we just need to read back the new recipe. */
    recipe, err = FetchRecipe(id)

    return recipe, err
}

/*
 * Take a Recipe to save and the user_id of the current user trying the
 * operation. If the user does not match the author_id of the recipe in the
 * database, this will return sql.ErrNoRows. If the force flag is set, this
 * check is disabled (such as for an admin.
 *
 * We must do the validation here to prevent a malicious user from setting the
 * author_id of the Recipe they're trying to save to their own.
 */
func SaveRecipe(recipe *defs.Recipe, user_id uint32, force bool) (*defs.Recipe, error) {
    var rows *sql.Rows
    var err error
    //TODO some input validation on would be nice
    //TODO tags
    //TODO linked recipes
    /* Build JSON from complex fields. */
    var directions []byte
    var ingredients []byte
    directions, err = json.Marshal(recipe.Directions)
    if err != nil {
        return nil, err
    }
    ingredients, err = json.Marshal(recipe.Ingredients)
    if err != nil {
        return nil, err
    }
    /* Hold the dynamically generated portion of our SQL. */
    var query_text string
    /* Hold all the parameters for our query. */
    var params []interface{}

    query_text = `UPDATE recipes SET (revision, amount, directions,
                ingredients, notes, oven, source, summary, time, title) =
                (revision + 1, $1, $2, $3, $4, $5, $6, $7, $8, $9)
            WHERE id = $10 `
    params = []interface{}{ recipe.Amount, directions, ingredients,
            recipe.Notes, recipe.Oven, recipe.Source, recipe.Summary,
            recipe.Time, recipe.Title, recipe.Id }
    /*
     * If force is not set, we need to make sure the author is the one making
     * this change.
     */
    if force == false {
        query_text = "AND author_id = $11"
        params = append(params, user_id)
    }
    /* Run the actual query. */
    rows, err = DB.Query(query_text + "RETURNING id", params...)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    /* Make sure we have a row returned. */
    if !rows.Next() {
        return nil, sql.ErrNoRows
    }
    /* Scan it in. */
    var id uint32;
    err = rows.Scan(&id)
    if err != nil {
        return nil, err
    }
    /* At this point, we just need to read back the new recipe. */
    recipe, err = FetchRecipe(id)

    return recipe, err
}
