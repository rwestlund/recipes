/* The database interface for users. */

package db

import (
    "log"
    "strconv"
    "strings"
    "database/sql"
    "github.com/lib/pq"
    "github.com/rwestlund/recipes/defs"
)

/* SQL to select users. */
var users_query string = `SELECT users.id, users.email, users.name,
            users.role, users.lastlog, users.creation_date,
            COUNT(recipes.id) AS recipes_authored
        FROM users
        LEFT JOIN recipes
            ON users.id = recipes.author_id `

func scan_user(rows *sql.Rows) (*defs.User, error) {
    var u defs.User
    /*
     * Because lastlog may be null, read into NullTime first. The User object
     * holds a pointer to a time.Time rather than a time.Time directly because
     * this is the only way to make json.Marshal() encode a null when the time
     * is not valid.
     */
    var lastlog pq.NullTime
    /* Name may be null, but we've fine converting that to an empty string. */
    var name sql.NullString
    var err error = rows.Scan(&u.Id, &u.Email, &name, &u.Role, &lastlog,
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

/*
 * Fetch all users in the database that match the given filter. The query in
 * the filter can match either the name, email, or role.
 */
func FetchUsers(filter *defs.ItemFilter) (*[]defs.User, error) {
    _ = log.Println//DEBUG

    /* Hold the dynamically generated portion of our SQL. */
    var query_text string
    /* Hold all the parameters for our query. */
    var params []interface{};

    /* Tokenize search string on spaces. Each term must be matched in the
     * name or email for a user to be returned.
     */
    var terms []string = strings.Split(filter.Query, " ")
    /* Build and apply having_text. */
    for i, term := range terms {
        /* Ignore blank terms (comes from leading/trailing spaces). */
        if term == "" { continue }

        if i == 0 {
            query_text += "\n\t WHERE (name ILIKE $"
        } else {
            query_text += " AND (name ILIKE $"
        }
        params = append(params, "%" + term + "%")
        query_text += strconv.Itoa(len(params)) +
            "\n\t\t OR email ILIKE $" +
            strconv.Itoa(len(params)) +
            "\n\t\t OR role ILIKE $" +
            strconv.Itoa(len(params)) + ") "
    }
    query_text += "\n\t GROUP BY users.id "
    query_text += "\n\t ORDER BY lastlog DESC NULLS LAST "

    /* Apply count. */
    if filter.Count != 0 {
        params = append(params, filter.Count)
        query_text += "\n\t LIMIT $" + strconv.Itoa(len(params))
    }
    /* Apply skip. */
    if filter.Skip != 0 {
        params = append(params, filter.Count * filter.Skip)
        query_text += "\n\t OFFSET $" + strconv.Itoa(len(params))
    }

    /* Run the actual query. */
    var rows *sql.Rows
    var err error
    rows, err = DB.Query(users_query + query_text, params...)
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
                RETURNING id, email, name, role, lastlog, creation_date,
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
func UpdateUser(id uint32, user *defs.User) (*defs.User, error) {
    var rows *sql.Rows
    var err error
    //TODO some input validation on would be nice
    /* Run one wuery to update the value. */
    rows, err = DB.Query(`UPDATE users SET (email, role) = ($1, $2)
                WHERE id = $3`,
                user.Email, user.Role, user.Id)
    if err != nil {
        return nil, err
    }
    rows.Close();
    /* Run a second query to read it back with the join. */
    rows, err = DB.Query(users_query +
            `WHERE users.id = $1 GROUP BY users.id`, user.Id)
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
    rows, err = DB.Query(`DELETE FROM USERS WHERE id = $1`, id)
    if err != nil {
        return err
    }
    defer rows.Close()
    return nil
}
