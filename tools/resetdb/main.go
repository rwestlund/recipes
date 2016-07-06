/*
 * Drop and recreate database objects. Used for testing and creating a new
 * deployment. Must be run after createdb/main.go. Also serves as table
 * documentation.
 */
package main

import (
    "log"
    "database/sql"
    _ "github.com/lib/pq"
)

func main() {
    db, err := sql.Open("postgres", "user=recipes dbname=recipes sslmode=disable")
    if err != nil {
        log.Println(err)
        log.Fatal("ERROR: connection params are invalid")
    }
    err = db.Ping()
    if err != nil {
        log.Println(err)
        log.Fatal("ERROR: failed to connect to the DB")
    }

    log.Println("dropping old objects")
    wrap_sql(db, "DROP TABLE IF EXISTS linked_recipes")
    wrap_sql(db, "DROP TABLE IF EXISTS tags CASCADE")
    wrap_sql(db, "DROP TABLE IF EXISTS recipes CASCADE")
    wrap_sql(db, "DROP TABLE IF EXISTS users")

    log.Println("creating new objects")

    wrap_sql(db, `CREATE TABLE users (
        id              serial PRIMARY KEY,
        email           text NOT NULL,
        name            text,
        role            text NOT NULL,
        token           text,
        creation_date   timestamp WITH TIME ZONE NOT NULL
                            DEFAULT CURRENT_TIMESTAMP,
        lastlog         timestamp WITH TIME ZONE
    )`)
    wrap_sql(db, `CREATE TABLE recipes (
        id          serial PRIMARY KEY,
        revision    integer NOT NULL DEFAULT 0,
        amount      text,
        author_id   integer NOT NULL REFERENCES users(id),
        directions  jsonb,
        ingredients jsonb,
        notes       text,
        oven        text,
        source      text,
        summary     text,
        time        text,
        title       text
    )`)
    wrap_sql(db, `CREATE TABLE tags (
        recipe_id       integer NOT NULL REFERENCES recipes(id),
        tag             text NOT NULL,
        UNIQUE(recipe_id, tag)
    )`)
    wrap_sql(db, `CREATE TABLE linked_recipes (
        src     integer REFERENCES recipes(id) NOT NULL,
        dest    integer REFERENCES recipes(id) NOT NULL,
        CONSTRAINT must_be_different CHECK ( src != dest ),
        UNIQUE (src, dest)
    )`)

    log.Println("complete")
}

func wrap_sql(db *sql.DB, s string) {
    _, err := db.Query(s)
    if err != nil {
        log.Println("error during:", s)
        log.Println(err)
        log.Fatal()
    }
}
