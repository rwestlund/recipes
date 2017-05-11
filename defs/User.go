/*
 * Copyright (c) 2016-2017, Randy Westlund. All rights reserved.
 * This code is under the BSD-2-Clause license.
 */

package defs

import (
	"time"

	null "gopkg.in/guregu/null.v3"
)

// User represents a User from the database.
type User struct {
	ID           int       `json:"id"`
	Email        string    `json:"email"`
	Name         string    `json:"name"`
	Role         string    `json:"role"`
	Lastlog      null.Time `json:"lastlog"`
	CreationDate time.Time `json:"creation_date"`
	// Fields from other tables.
	RecipesAuthored int `json:"recipes_authored"`
}
