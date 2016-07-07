package db

import (
    "log"
    "database/sql"
    "config"
    _ "github.com/lib/pq"
)

/* Make db handle global to this package. */
var DB *sql.DB

func Init () {
    /* Connect to database. */
    var err error
    DB, err = sql.Open("postgres", "user=" + config.Config.DatabaseUserName +
            " dbname=" + config.Config.DatabaseName + " sslmode=disable")
    if err != nil {
        log.Println(err)
        log.Fatal("ERROR: connection params are invalid")
    }
    err = DB.Ping()
    if err != nil {
        log.Println(err)
        log.Fatal("ERROR: failed to connect to the DB")
    }
}