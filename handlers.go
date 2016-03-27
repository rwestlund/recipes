package main

import (
    "log"
    "net/http"
    "database/sql"
    "encoding/json"
    "github.com/gorilla/mux"
)

/*
 * Request a specific recipe.
 * GET /recipes/3
 */
func recipe(res http.ResponseWriter, req *http.Request) {
    vars := mux.Vars(req)

    res.Header().Set("Content-Type", "application/json; charset=UTF-8")

    var r Recipe
    /* JSON fields will need special handling. */
    var ingredients, directions string

    /* Read recipe from database. */
    err := DB.QueryRow(`SELECT id, revision, amount, author_id, directions,
                ingredients, notes, oven, source, summary,
                time, title
            FROM recipes
            WHERE id = $1`,
            vars["id"]).
        Scan(&r.Id, &r.Revision, &r.Amount, &r.Author_id, &directions,
                &ingredients, &r.Notes, &r.Oven, &r.Source, &r.Summary,
                &r.Time, &r.Title)
    if err == sql.ErrNoRows {
        res.WriteHeader(404)
        return
    } else if err != nil {
        res.WriteHeader(500)
        return
    }

    /* Unpack JSON fields. */
    e := json.Unmarshal([]byte(directions), &r.Directions)
    if e != nil {
        log.Fatal(e)
    }
    e = json.Unmarshal([]byte(ingredients), &r.Ingredients)
    if e != nil {
        log.Fatal(e)
    }
    j, e := json.Marshal(r)
    if e != nil {
        res.WriteHeader(500)
        return
    }

    /* Send good response. */
    res.Write(j)
}

/*
 * Load the home page and main app.
 * GET /
 */
func home(res http.ResponseWriter, req *http.Request) {
}
