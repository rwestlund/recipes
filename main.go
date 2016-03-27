package main

import (
    "log"
    "net/http"
    "database/sql"
    _ "github.com/lib/pq"
)

/* Make db handle global. */
var DB *sql.DB

func main() {
    /* Connect to database. */
    var err error
    DB, err = sql.Open("postgres", "user=recipes dbname=recipes sslmode=disable")
    if err != nil {
        log.Println(err)
        log.Fatal("ERROR: connection params are invalid")
    }
    err = DB.Ping()
    if err != nil {
        log.Println(err)
        log.Fatal("ERROR: failed to connect to the DB")
    }

    /* Create router from routes.go. */
    router := NewRouter()
    log.Println("server running")
    http.ListenAndServe(":3000", router)
}
