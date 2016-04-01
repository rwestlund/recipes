package db

import (
    "log"
    "database/sql"
    "github.com/lib/pq"
    "github.com/rwestlund/recipes/defs"
)

/* SQL to select users. */
var users_query string = `SELECT users.id, users.email, users.name,
            users.role, users.lastlog, users.date_created,
            COUNT(recipes.id) AS recipes_authored
        FROM users
        LEFT JOIN recipes
            ON users.id = recipes.author_id `

func scan_user(rows *sql.Rows) (*defs.User, error) {
    var u defs.User
    /* Because lastlog may be null, read into NullTime first. The User object
     * holds a pointer to a time.Time rather than a time.Time directly because
     * this is the only way to make json.Marshal() encode a null when the time
     * is not valid. */
    var lastlog pq.NullTime
    /* Name may be null, but we've fine converting that to an empty string. */
    var name sql.NullString
    var err error = rows.Scan(&u.Id, &u.Email, &name, &u.Role, &lastlog,
            &u.DateCreated, &u.RecipesAuthored)
    if err != nil {
        return nil, err
    }
    if lastlog.Valid {
        u.Lastlog = &lastlog.Time
    }
    u.Name = name.String
    return &u, nil
}

/* Fetch all users in the database. */
func FetchUsers(name_or_email string) (*[]defs.User, error) {
    _ = log.Println//DEBUG

    var where_text string
    var params []interface{};

    if name_or_email != "" {
        params = append(params, name_or_email)
        where_text = ` WHERE (users.name ILIKE '%' || $1 || '%'
                        OR users.email ILIKE '%' || $1 || '%') `
    }

    /* Run the query. */
    var rows *sql.Rows
    var err error
    rows, err = DB.Query(users_query + where_text +
            " GROUP BY users.id ORDER BY lastlog DESC NULLS LAST",
            params...)
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

/* Take a reference to a User and create it in the database, returning fields
 * in the passed object. Only User.Email and User.Role are read.
 */
func CreateUser(user *defs.User) (*defs.User, error) {
    var rows *sql.Rows
    var err error
    //TODO some input validation on would be nice
    rows, err = DB.Query(`INSERT INTO users (email, role) VALUES ($1, $2)
                RETURNING id, email, name, role, lastlog, date_created,
                    0 AS recipes_authored`,
                user.Email, user.Role)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    /* Make sure we have a row returned. */
    if !rows.Next() {
        return nil, sql.ErrNoRows
    }
    /* Scan it in. */
    user, err = scan_user(rows)
    if err != nil {
        return nil, err
    }
    return user, nil
}


/* Take a reference to a User and update it in the database, returning fields
 * in the passed object. Only User.Id, User.Email, and User.Role are read.
 */
func UpdateUser(user *defs.User) (*defs.User, error) {
    var rows *sql.Rows
    var err error
    //TODO some input validation on would be nice
    rows, err = DB.Query(`UPDATE users SET (email, role) = ($1, $2)
                WHERE id = $3
                RETURNING id, email, name, role, lastlog, date_created,
                    0 AS recipes_authored`,
                user.Email, user.Role, user.Id)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    /* Make sure we have a row returned. */
    if !rows.Next() {
        return nil, sql.ErrNoRows
    }
    /* Scan it in. */
    user, err = scan_user(rows)
    if err != nil {
        return nil, err
    }
    return user, nil
}

/* Delete a User by id.  */
func DeleteUser(id uint32) error {
    var rows *sql.Rows
    var err error
    rows, err = DB.Query(`DELETE FROM USERS
                WHERE id = $1`, id)
    if err != nil {
        return err
    }
    defer rows.Close()
    return nil
}
