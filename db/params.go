/*
 * Copyright (c) 2016-2017, Randy Westlund. All rights reserved.
 * This code is under the BSD-2-Clause license.
 *
 * This file connects to the database and exposes the handle to the other DB
 * files.
 */

package db

import (
	"database/sql"

	// Import the PostgreSQL driver.
	_ "github.com/lib/pq"
)

// DB is the database handle for other files in this package.
var DB *sql.DB

// Init connects to the database.
func Init(dbname, dbuser string) error {
	var err error
	DB, err = sql.Open("postgres",
		"user="+dbuser+" dbname="+dbname+" sslmode=disable")
	if err != nil {
		return err
	}
	return DB.Ping()
}
