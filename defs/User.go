package defs
/* This defines the User struct, which represents a user from the DB */

import (
    "time"
)

type User struct {
    Id          uint32      `json:"id"`
    Email       string      `json:"email"`
    Name        string      `json:"name"`
    Role        string      `json:"role"`
    /* See the comment in db/users.go:scan_user() for why this is a pointer. */
    Lastlog    *time.Time   `json:"lastlog"`
    CreationDate    time.Time   `json:"creation_date"`
    /* Fields from other tables. */
    RecipesAuthored uint32  `json:"recipes_authored"`
}
