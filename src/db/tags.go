/*
 * Copyright (c) 2016, Randy Westlund. All rights reserved.
 * This code is under the BSD-2-Clause license.
 *
 * This file exposes the database interface for tags.
 */

package db

import (
    "database/sql"
)

/* Get a list of all tags in the database. */
func FetchTags() (*[]byte, error) {
    var rows *sql.Rows
    var err error
    /* Return them all in one row. */
    rows, err = DB.Query("SELECT json_agg(DISTINCT tag ORDER BY tag) FROM tags")
    if (err != nil) {
        return nil, err
    }
    var tags []byte

    /* In this case, we just want an empty list if nothing was returned. */
    if !rows.Next() {
        return &tags, nil
    }

    /* This is alredy JSON, so just leave it as a []byte. */
    err = rows.Scan(&tags)
    if err != nil {
        return nil, err
    }
    return &tags, nil
}
