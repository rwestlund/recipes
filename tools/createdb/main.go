/*
 * Copyright (c) 2016, Randy Westlund. All rights reserved.
 * This code is under the BSD-2-Clause license.
 *
 * Drop and recreate database and users. This should only be run once per
 * deployment, just to initialize things. Run tools/resetdb/main.go next.
 */

package main

import (
    "log"
    "database/sql"
    _ "github.com/lib/pq"
    "config"
)

func main() {
    var db *sql.DB
    var err error
    /* This should be the superuser. It's pgsql on FreeBSD. */
    db, err = sql.Open("postgres", "user=pgsql dbname=postgres sslmode=disable")
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
    wrap_sql(db, "DROP DATABASE IF EXISTS " + config.DatabaseName)
    wrap_sql(db, "DROP USER IF EXISTS " + config.DatabaseUserName)
    log.Println("creating new database")
    wrap_sql(db, "CREATE USER " + config.DatabaseUserName + " WITH LOGIN")
    wrap_sql(db, "CREATE DATABASE " + config.DatabaseName + " WITH OWNER recipes")
    log.Println("complete")
}

func wrap_sql(db *sql.DB, s string) {
    _, err := db.Exec(s)
    if err != nil {
        log.Println("error during:", s)
        log.Println(err)
        log.Fatal()
    }
}
