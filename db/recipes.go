package db

import (
    "log"
    "strconv"
    "strings"
    "database/sql"
    "encoding/json"
    "github.com/rwestlund/recipes/defs"
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

/* Fetch all recipes from the database. */
func FetchRecipes(filter *defs.RecipeFilter) (*[]defs.Recipe, error) {
    _ = log.Println//DEBUG

    /* Hold the dynamically generated portion of our SQL. */
    var query_text string
    /* Hold all the parameters for our query. */
    var params []interface{};

    /* Tokenize search string on spaces. Each term must be matched in the title
     * or tags for a recipe to be returned. */
    var terms []string = strings.Split(filter.TitleOrTag, " ")
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
    rows, err := DB.Query(query_rows +
            "\n\t GROUP BY recipes.id, users.name " +
            query_text , params...)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    /* The array we're going to fill. The append() builtin will approximately
     * double the capacity when it needs to reallocate, but we can save some
     * copying by starting at a decent number. */
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
