package db

import (
    "log"
    "strconv"
    "database/sql"
    "encoding/json"
    "github.com/rwestlund/recipes/defs"
)

func scan_recipe(row *sql.Rows) (*defs.Recipe, error) {
    /* JSON fields will need special handling. */
    var ingredients, directions, tags string
    /* The recipe we're going to read in. */
    var r defs.Recipe

    err := row.Scan(&r.Id, &r.Revision, &r.Amount, &r.Author_id, &directions,
            &ingredients, &r.Notes, &r.Oven, &r.Source, &r.Summary,
            &r.Time, &r.Title, &tags)
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

/* SQL to select recipes. */
var query_rows string = `SELECT recipes.id, recipes.revision,
            recipes.amount, recipes.author_id, recipes.directions,
            recipes.ingredients, recipes.notes, recipes.oven,
            recipes.source, recipes.summary, recipes.time, recipes.title,
            json_agg(tags.tag)
        FROM recipes
        LEFT JOIN tags
            ON recipes.id = tags.recipe_id `

/* Fetch all recipes from the database. */
func FetchRecipes(filter *defs.RecipeFilter) ([]defs.Recipe, error) {
    _ = log.Println//DEBUG

    /* Build where_text. */
    var where_text string
    var params []interface{};

    if filter.Title != "" {
        params = append(params, filter.Title)
        where_text += " title ILIKE '%' || $" +
                strconv.Itoa(len(params)) + " || '%'"
    }

    var query_text string
    /* Apply where_text. */
    if where_text != "" {
        query_text += " WHERE " + where_text
    }
    query_text += " GROUP BY recipes.id ORDER BY title "

    /* Apply count. */
    if filter.Count != 0 {
        params = append(params, filter.Count)
        query_text += " LIMIT $" + strconv.Itoa(len(params))
    }
    /* Apply skip. */
    if filter.Skip != 0 {
        params = append(params, filter.Count * filter.Skip)
        query_text += " OFFSET $" + strconv.Itoa(len(params))
    }
    /* Run the actual query. */
    rows, err := DB.Query(query_rows + query_text, params...)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    /* The array we're going to fill. The append() builtin will approximately
     * double the capacity when it needs to reallocate, but we can save some
     * copying by starting at a decent number. */
    var recipes  = make([]defs.Recipe, 0, 200)
    /* Iterate over rows, reading in each recipes as we go. */
    for rows.Next() {
        var r *defs.Recipe
        r, err = scan_recipe(rows)
        if err != nil {
            return nil, err
        }
        /* Add it to our list. */
        recipes = append(recipes, *r)
    }
    return recipes, nil
}


/* Fetch one recipe by id. */
func FetchRecipe (id uint32) (*defs.Recipe, error) {
    /* Read recipe from database. */
    var rows *sql.Rows
    var err error
    rows, err = DB.Query(query_rows + " WHERE id = $1 GROUP BY recipes.id", id)
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
