/*
 * Copyright (c) 2016-2017, Randy Westlund. All rights reserved.
 * This code is under the BSD-2-Clause license.
 *
 * This file contains HTTP handlers for the application.
 */

package router

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/rwestlund/recipes/db"
	"github.com/rwestlund/recipes/defs"
)

// buildItemFilter takes a url.URL object (from req.URL) and fills an ItemFilter.
func buildItemFilter(url *url.URL) defs.ItemFilter {
	// We can ignore the error because count=0 means disabled.
	var bigcount, _ = strconv.ParseUint(url.Query().Get("count"), 10, 32)
	var bigskip, _ = strconv.ParseUint(url.Query().Get("skip"), 10, 32)
	// Build ItemFilter from query params.
	var filter = defs.ItemFilter{
		Query: url.Query().Get("query"),
		Count: uint32(bigcount),
		Skip:  uint32(bigskip),
	}
	return filter
}

// handleRecipes handles a request for a list of recipes.
// GET /recipes
func handleRecipes(res http.ResponseWriter, req *http.Request) {
	res.Header().Set("Content-Type", "application/json; charset=UTF-8")
	var filter = buildItemFilter(req.URL)
	var recipes, err = db.FetchRecipes(filter)
	if err != nil {
		log.Println(err)
		res.WriteHeader(500)
		return
	}
	j, e := json.Marshal(recipes)
	if e != nil {
		log.Println(e)
		res.WriteHeader(500)
		return
	}
	res.Write(j)
}

// handlePutOrPostRecipe creates a new recipe or updates an existing one.
// POST /recipes, PUT /recipes/4
func handlePutOrPostRecipe(res http.ResponseWriter, req *http.Request) {
	// Access control.
	var usr *defs.User
	var err error
	usr, err = checkAuth(res, req)
	if err != nil {
		log.Println(err)
		res.WriteHeader(500)
		return
	}
	if usr == nil {
		res.WriteHeader(401)
		return
	}
	if usr.Role != "Admin" && usr.Role != "Moderator" && usr.Role != "User" {
		res.WriteHeader(403)
		return
	}

	res.Header().Set("Content-Type", "application/json; charset=UTF-8")

	// Decode body.
	var recipe defs.Recipe
	err = json.NewDecoder(req.Body).Decode(&recipe)
	if err != nil {
		log.Println(err)
		res.WriteHeader(400)
		return
	}

	var newRecipe *defs.Recipe

	// Update it.
	if req.Method == "PUT" {
		// Bypass the author check if the user has sufficient privileges.
		var force bool
		force = usr.Role == "Admin" || usr.Role == "Moderator"
		newRecipe, err = db.SaveRecipe(&recipe, usr.ID, force)
		if err == sql.ErrNoRows {
			res.WriteHeader(403)
			return
		}
	} else {
		// Create it with the currently logged-in user as the author.
		recipe.AuthorID = usr.ID
		newRecipe, err = db.CreateRecipe(&recipe)
	}
	if err != nil {
		log.Println(err)
		res.WriteHeader(400)
		return
	}

	// Send it back.
	j, e := json.Marshal(newRecipe)
	if e != nil {
		log.Println(e)
		res.WriteHeader(500)
		return
	}
	res.Write(j)
}

// handleRecipe handles a request for a specific recipe.
// GET /recipes/3
func handleRecipe(res http.ResponseWriter, req *http.Request) {
	res.Header().Set("Content-Type", "application/json; charset=UTF-8")

	// Get id parameter.
	var params map[string]string = mux.Vars(req)
	var id, err = strconv.ParseUint(params["id"], 10, 32)
	if err != nil {
		log.Println(err)
		res.WriteHeader(400)
		return
	}

	var recipe *defs.Recipe
	recipe, err = db.FetchRecipe(uint32(id))
	if err == sql.ErrNoRows {
		res.WriteHeader(404)
		return
	} else if err != nil {
		res.WriteHeader(500)
		log.Println(err)
		return
	}
	j, e := json.Marshal(recipe)
	if e != nil {
		log.Println(err)
		res.WriteHeader(500)
		return
	}
	res.Write(j)
}

// handleDeleteRecipe deletes a recipe by id.
// DELETE /recipes/4
func handleDeleteRecipe(res http.ResponseWriter, req *http.Request) {
	// Access control.
	var usr, err = checkAuth(res, req)
	if err != nil {
		log.Println(err)
		res.WriteHeader(500)
		return
	}
	if usr == nil {
		res.WriteHeader(401)
		return
	}
	if usr.Role != "Admin" && usr.Role != "Moderator" && usr.Role != "User" {
		res.WriteHeader(403)
		return
	}

	res.Header().Set("Content-Type", "application/json; charset=UTF-8")

	// Get id parameter.
	var params map[string]string = mux.Vars(req)
	id, err := strconv.ParseUint(params["id"], 10, 32)
	if err != nil {
		log.Println(err)
		res.WriteHeader(400)
		return
	}

	// Bypass the author check if the user has sufficient privileges.
	var force = usr.Role == "Admin" || usr.Role == "Moderator"
	err = db.DeleteRecipe(uint32(id), usr.ID, force)
	if err == sql.ErrNoRows {
		res.WriteHeader(403)
		return
	}
	if err != nil {
		log.Println(err)
		res.WriteHeader(400)
		return
	}
	res.WriteHeader(200)
}

// handleUsers handles a request for a list of users.
// GET /users
func handleUsers(res http.ResponseWriter, req *http.Request) {
	// Access control.
	var usr, err = checkAuth(res, req)
	if err != nil {
		log.Println(err)
		res.WriteHeader(500)
		return
	}
	if usr == nil {
		res.WriteHeader(401)
		return
	}
	if usr.Role != "Admin" {
		res.WriteHeader(403)
		return
	}

	res.Header().Set("Content-Type", "application/json; charset=UTF-8")
	var filter = buildItemFilter(req.URL)

	users, err := db.FetchUsers(filter)
	if err != nil {
		log.Println(err)
		res.WriteHeader(500)
		return
	}
	j, e := json.Marshal(users)
	if e != nil {
		log.Println(e)
		res.WriteHeader(500)
		return
	}
	res.Write(j)
}

// handlePutOrPostUser receives a user to update or create.
// POST /users or PUT /users/4
func handlePutOrPostUser(res http.ResponseWriter, req *http.Request) {
	// Access control.
	var usr, err = checkAuth(res, req)
	if err != nil {
		log.Println(err)
		res.WriteHeader(500)
		return
	}
	if usr == nil {
		res.WriteHeader(401)
		return
	}
	if usr.Role != "Admin" {
		res.WriteHeader(403)
		return
	}
	res.Header().Set("Content-Type", "application/json; charset=UTF-8")

	// Decode body.
	var user defs.User
	err = json.NewDecoder(req.Body).Decode(&user)
	if err != nil {
		log.Println(err)
		res.WriteHeader(400)
		return
	}

	var newUser *defs.User
	// Update a user in the database.
	if req.Method == "PUT" {
		// Get id parameter.
		var params map[string]string = mux.Vars(req)
		id, err := strconv.ParseUint(params["id"], 10, 32)
		if err != nil {
			log.Println(err)
			res.WriteHeader(400)
			return
		}

		newUser, err = db.UpdateUser(uint32(id), &user)
	} else {
		// Create a new user in the DB.
		newUser, err = db.CreateUser(&user)
	}
	if err != nil {
		log.Println(err)
		res.WriteHeader(400)
		return
	}

	// Send it back.
	j, e := json.Marshal(newUser)
	if e != nil {
		log.Println(e)
		res.WriteHeader(500)
		return
	}
	res.Write(j)
}

// handleDeleteUser deletes a user by id.
// DELETE /users/4
func handleDeleteUser(res http.ResponseWriter, req *http.Request) {
	// Access control.
	var usr, err = checkAuth(res, req)
	if err != nil {
		log.Println(err)
		res.WriteHeader(500)
		return
	}
	if usr == nil {
		res.WriteHeader(401)
		return
	}
	if usr.Role != "Admin" {
		res.WriteHeader(403)
		return
	}
	res.Header().Set("Content-Type", "application/json; charset=UTF-8")

	// Get id parameter.
	var params map[string]string = mux.Vars(req)
	id, err := strconv.ParseUint(params["id"], 10, 32)
	if err != nil {
		log.Println(err)
		res.WriteHeader(400)
		return
	}
	err = db.DeleteUser(uint32(id))
	if err != nil {
		log.Println(err)
		res.WriteHeader(400)
		return
	}
	res.WriteHeader(200)
}

func handleGetTags(res http.ResponseWriter, req *http.Request) {
	var tags, err = db.FetchTags()
	if err != nil {
		log.Println(err)
		res.WriteHeader(500)
		return
	}
	res.Write(tags)
}

func handleGetRecipeTitles(res http.ResponseWriter, req *http.Request) {
	var titles, err = db.FetchRecipeTitles()
	if err != nil {
		log.Println(err)
		res.WriteHeader(500)
		return
	}
	res.Write(titles)
}
