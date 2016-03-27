package db

import (
    "database/sql"
    "encoding/json"
    "github.com/rwestlund/recipes/defs"
)

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
