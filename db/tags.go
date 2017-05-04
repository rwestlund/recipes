/*
 * Copyright (c) 2016-2017, Randy Westlund. All rights reserved.
 * This code is under the BSD-2-Clause license.
 *
 * This file exposes the database interface for tags.
 */

package db

// FetchTags retuns a JSON list of all tags in the database.
func FetchTags() ([]byte, error) {
	var rows, err = DB.Query("SELECT json_agg(DISTINCT tag ORDER BY tag) FROM tags")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var tags []byte

	// In this case, we just want an empty list if nothing was returned.
	if !rows.Next() {
		return tags, nil
	}

	// This is alredy JSON, so just leave it as a []byte.
	err = rows.Scan(&tags)
	return tags, err
}
