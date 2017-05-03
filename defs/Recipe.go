/*
 * Copyright (c) 2016-2017, Randy Westlund. All rights reserved.
 * This code is under the BSD-2-Clause license.
 */

package defs

// Recipe represents a recipe from the DB.
type Recipe struct {
	ID          uint32   `json:"id"`
	Revision    uint32   `json:"revision"`
	Amount      string   `json:"amount"`
	AuthorID    uint32   `json:"author_id"`
	Directions  []string `json:"directions"`
	Ingredients []string `json:"ingredients"`
	Notes       string   `json:"notes"`
	Oven        string   `json:"oven"`
	Source      string   `json:"source"`
	Summary     string   `json:"summary"`
	Time        string   `json:"time"`
	Title       string   `json:"title"`
	/* Fields from other tables. */
	Tags          []string       `json:"tags"`
	AuthorName    string         `json:"author_name"`
	LinkedRecipes []LinkedRecipe `json:"linked_recipes"`
}

// LinkedRecipe is a reference from one recipe to another.
type LinkedRecipe struct {
	ID    uint32 `json:"id"`
	Title string `json:"title"`
}
