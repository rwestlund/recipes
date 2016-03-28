package db

import (
    "database/sql"
    "encoding/json"
    "github.com/rwestlund/recipes/defs"
)

/* Fetch all recipes from the database. */
func FetchRecipes () ([]defs.Recipe, error) {
    /* Read recipes from database. */
    rows, err := DB.Query(`SELECT id, revision, amount, author_id, directions,
                ingredients, notes, oven, source, summary,
                time, title
            FROM recipes`)
    defer rows.Close()
    if err != nil {
        return nil, err
    }

    /* The array we're going to fill. The append() builtin will approximately
     * double the capacity when it needs to reallocate, but we can save some
     * copying by starting at a decent number. */
    var recipes  = make([]defs.Recipe, 0, 200)
    /* JSON fields will need special handling. */
    var ingredients, directions string

    /* Iterate over rows, reading in each recipes as we go. */
    for rows.Next() {
        /* The recipe we're going to read in. */
        var r defs.Recipe

        err := rows.Scan(&r.Id, &r.Revision, &r.Amount, &r.Author_id, &directions,
                &ingredients, &r.Notes, &r.Oven, &r.Source, &r.Summary,
                &r.Time, &r.Title)
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
        /* Add it to our list. */
        recipes = append(recipes, r)
    }

    return recipes, nil
}


/* Fetch one recipe by id. */
func FetchRecipe (id uint32) (*defs.Recipe, error) {
    var r defs.Recipe
    /* JSON fields will need special handling. */
    var ingredients, directions string

    /* Read recipe from database. */
    err := DB.QueryRow(`SELECT id, revision, amount, author_id, directions,
                ingredients, notes, oven, source, summary,
                time, title
            FROM recipes
            WHERE id = $1`,
            id).
        Scan(&r.Id, &r.Revision, &r.Amount, &r.Author_id, &directions,
                &ingredients, &r.Notes, &r.Oven, &r.Source, &r.Summary,
                &r.Time, &r.Title)
    if err == sql.ErrNoRows {
        return nil, nil
    } else if err != nil {
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

    return &r, nil
}
