package db

import (
    "log"
    "database/sql"
    "github.com/lib/pq"
    "github.com/rwestlund/recipes/defs"
)

/* SQL to select users. */
var users_query string = `SELECT id, email, name, role, lastlog, date_created
        FROM users `

func scan_user(rows *sql.Rows) (*defs.User, error) {
    var u defs.User
    var lastlog pq.NullTime
    _ = pq.Open//DEBUG
    var err error = rows.Scan(&u.Id, &u.Email, &u.Name, &u.Role, &lastlog,
            &u.DateCreated)
    if err != nil {
        return nil, err
    }
    if lastlog.Valid {
        u.Lastlog = lastlog.Time
    }
    return &u, nil
}

/* Fetch all users in the database. */
func FetchUsers() (*[]defs.User, error) {
    _ = log.Println//DEBUG

    /* Run the query. */
    var rows *sql.Rows
    var err error
    rows, err = DB.Query(users_query + " ORDER BY email")
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    /* The array we're going to fill. The append() builtin will approximately
     * double the capacity when it needs to reallocate, but we can save some
     * copying by starting at a decent number. */
    var users = make([]defs.User, 0, 20)
    var user *defs.User
    /* Iterate over rows, reading in each User as we go. */
    for rows.Next() {
        user, err = scan_user(rows)
        if err != nil {
            return nil, err
        }
        /* Add it to our list. */
        users = append(users, *user)
    }
    return &users, nil
}
