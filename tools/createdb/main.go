package main

import (
    "log"
    "database/sql"
    _ "github.com/lib/pq"
)

func main() {
    db, err := sql.Open("postgres", "user=pgsql dbname=postgres sslmode=disable")
    if err != nil {
        log.Println(err)
        log.Fatal("ERROR: connection params are invalid")
    }
    err = db.Ping()
    if err != nil {
        log.Println(err)
        log.Fatal("ERROR: failed to connect to the DB")
    }

    log.Println("removing old database")
    wrap_sql(db, "DROP DATABASE IF EXISTS recipes")
    wrap_sql(db, "DROP USER IF EXISTS recipes")
    log.Println("creating new database")
    wrap_sql(db, "CREATE USER recipes WITH LOGIN")
    wrap_sql(db, "CREATE DATABASE recipes WITH OWNER recipes")
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
