/*
 * Copyright (c) 2016-2017, Randy Westlund. All rights reserved.
 * This code is under the BSD-2-Clause license.
 *
 * This file exposes the database interface for users.
 */

package db

import (
	"database/sql"
	"strconv"
	"strings"

	"github.com/lib/pq"
	"github.com/rwestlund/recipes/defs"
)

// SQL to select users.
var usersQuery = `SELECT users.id, users.email, users.name,
            users.role, users.lastlog, users.creation_date,
            COUNT(recipes.id) AS recipes_authored
        FROM users
        LEFT JOIN recipes
            ON users.id = recipes.author_id `

// scanUser takes a row set and scans the result into a User struct.
func scanUser(rows *sql.Rows) (*defs.User, error) {
	var u defs.User
	// Because lastlog may be null, read into NullTime first. The User object
	// holds a pointer to a time.Time rather than a time.Time directly because
	// this is the only way to make json.Marshal() encode a null when the time
	// is not valid.
	var lastlog pq.NullTime
	// Name may be null, but we've fine converting that to an empty string.
	var name sql.NullString
	var err = rows.Scan(&u.ID, &u.Email, &name, &u.Role, &lastlog,
		&u.CreationDate, &u.RecipesAuthored)
	if err != nil {
		return nil, err
	}
	if lastlog.Valid {
		u.Lastlog = &lastlog.Time
	}
	u.Name = name.String
	return &u, nil
}

// FetchUsers returns all users in the database that match the given filter.
// The query in the filter can match either the name, email, or role.
func FetchUsers(filter defs.ItemFilter) ([]defs.User, error) {
	// Hold the dynamically generated portion of our SQL.
	var queryText string
	// Hold all the parameters for our query.
	var params []interface{}

	// Tokenize search string on spaces. Each term must be matched in the
	// name or email for a user to be returned.
	var terms = strings.Split(filter.Query, " ")
	for i, term := range terms {
		// Ignore blank terms (comes from leading/trailing spaces).
		if term == "" {
			continue
		}

		if i == 0 {
			queryText += "\n\t WHERE (name ILIKE $"
		} else {
			queryText += " AND (name ILIKE $"
		}
		params = append(params, "%"+term+"%")
		queryText += strconv.Itoa(len(params)) +
			"\n\t\t OR email ILIKE $" +
			strconv.Itoa(len(params)) +
			"\n\t\t OR role ILIKE $" +
			strconv.Itoa(len(params)) + ") "
	}
	queryText += "\n\t GROUP BY users.id "
	queryText += "\n\t ORDER BY lastlog DESC NULLS LAST "

	if filter.Count != 0 {
		params = append(params, filter.Count)
		queryText += "\n\t LIMIT $" + strconv.Itoa(len(params))
	}
	if filter.Skip != 0 {
		params = append(params, filter.Count*filter.Skip)
		queryText += "\n\t OFFSET $" + strconv.Itoa(len(params))
	}

	// Run the actual query.
	var rows, err = DB.Query(usersQuery+queryText, params...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// The array we're going to fill. The append() builtin will approximately
	// double the capacity when it needs to reallocate, but we can save some
	// copying by starting at a decent number. */
	var users = make([]defs.User, 0, 20)
	var user *defs.User
	// Iterate over rows, reading in each User as we go.
	for rows.Next() {
		user, err = scanUser(rows)
		if err != nil {
			return nil, err
		}
		users = append(users, *user)
	}
	return users, rows.Err()
}

// CreateUser creates a new User in the database, returning fields in the
// passed object. Only User.Email and User.Role are read.
func CreateUser(user *defs.User) (*defs.User, error) {
	//TODO some input validation on would be nice
	var rows, err = DB.Query(`INSERT INTO users (email, role) VALUES ($1, $2)
                RETURNING id, email, name, role, lastlog, creation_date,
                    0 AS recipes_authored`,
		user.Email, user.Role)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	if !rows.Next() {
		return nil, sql.ErrNoRows
	}
	return scanUser(rows)
}

// UpdateUser updates a User in the database. Only User.Id, User.Email, and
// User.Role are read.
func UpdateUser(id uint32, user *defs.User) (*defs.User, error) {
	//TODO some input validation on would be nice
	// Run one query to update the value.
	var rows, err = DB.Query(`UPDATE users SET (email, role) = ($1, $2)
                WHERE id = $3`,
		user.Email, user.Role, user.ID)
	if err != nil {
		return nil, err
	}
	rows.Close()
	// Run a second query to read it back with the join.
	rows, err = DB.Query(usersQuery+
		`WHERE users.id = $1 GROUP BY users.id`, user.ID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	if !rows.Next() {
		return nil, sql.ErrNoRows
	}
	return scanUser(rows)
}

// DeleteUser deletes a User by ID.
func DeleteUser(id uint32) error {
	var _, err = DB.Exec(`DELETE FROM users WHERE id = $1`, id)
	return err
}

// UserLogout destroys a login token.
func UserLogout(token string) error {
	var _, err = DB.Exec(`UPDATE users SET (token, lastlog) =
                (NULL, CURRENT_TIMESTAMP)
            WHERE token = $1`,
		token)
	return err
}

// GoogleLogin records a login by updating name, token, and lastlog.
func GoogleLogin(email string, name string, token string) (*defs.User, error) {
	var rows, err = DB.Query(`UPDATE users SET (token, name, lastlog) =
                ($1, $2, CURRENT_TIMESTAMP)
            WHERE email = $3
            RETURNING id, email, name, role, lastlog, creation_date,
            0 AS recipes_authored`,
		token, name, email)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	if !rows.Next() {
		return nil, sql.ErrNoRows
	}
	return scanUser(rows)
}

// FetchUserByToken returns the User that matches the given token.
func FetchUserByToken(token string) (*defs.User, error) {
	var rows, err = DB.Query(usersQuery+
		`WHERE users.token = $1 GROUP BY users.id`, token)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	if !rows.Next() {
		return nil, sql.ErrNoRows
	}
	return scanUser(rows)
}
