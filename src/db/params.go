/*
 * Copyright (c) 2016, Randy Westlund. All rights reserved.
 * This code is under the BSD-2-Clause license.
 *
 * This file connects to the database and exposes the handle to the other DB
 * files.
 */
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
    DB, err = sql.Open("postgres", "user=" + config.DatabaseUserName +
            " dbname=" + config.DatabaseName + " sslmode=disable")
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
