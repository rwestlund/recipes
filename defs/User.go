package defs

import (
    "time"
)

type User struct {
    Id          uint32      `json:"id"`
    Email       string      `json:"email"`
    Name        string      `json:"name"`
    Role        string      `json:"role"`
    Lastlog     time.Time   `json:"lastlog"`
    DateCreated time.Time   `json:"date_created"`
}
