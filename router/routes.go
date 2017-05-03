/*
 * Copyright (c) 2016-2017, Randy Westlund. All rights reserved.
 * This code is under the BSD-2-Clause license.
 *
 * This file defines the application's routes, mapping them to handlers.
 */

package router

import (
	"net/http"
)

// Routes are a list of these structs.
type route struct {
	name    string
	methods []string
	pattern string
	handler http.HandlerFunc
}
type routelist []route

// Define the actual routes here.
var routes = routelist{
	route{
		"auth",
		[]string{"GET"},
		"/auth/google/login",
		oauthRedirect,
	},
	route{
		"auth",
		[]string{"GET"},
		"/oauth2callback",
		handleOauthCallback,
	},
	route{
		"logout",
		[]string{"GET"},
		"/logout",
		handleLogout,
	},
	route{
		"recipe",
		[]string{"GET", "HEAD"},
		"/recipes/{id:[0-9]+}",
		handleRecipe,
	},
	route{
		"recipes",
		[]string{"GET", "HEAD"},
		"/recipes",
		handleRecipes,
	},
	route{
		"recipe_titles",
		[]string{"GET", "HEAD"},
		"/recipes/titles",
		handleGetRecipeTitles,
	},
	route{
		"users",
		[]string{"GET", "HEAD"},
		"/users",
		handleUsers,
	},
	route{
		"recipes",
		[]string{"POST", "PUT"},
		"/recipes",
		handlePutOrPostRecipe,
	},
	route{
		"recipes",
		[]string{"POST", "PUT"},
		"/recipes/{id:[0-9]+}",
		handlePutOrPostRecipe,
	},
	route{
		"recipes",
		[]string{"DELETE"},
		"/recipes/{id:[0-9]+}",
		handleDeleteRecipe,
	},
	route{
		"users",
		[]string{"POST"},
		"/users",
		handlePutOrPostUser,
	},
	route{
		"users",
		[]string{"POST"},
		"/users",
		handlePutOrPostUser,
	},
	route{
		"users",
		[]string{"PUT"},
		"/users/{id:[0-9]+}",
		handlePutOrPostUser,
	},
	route{
		"users",
		[]string{"DELETE"},
		"/users/{id:[0-9]+}",
		handleDeleteUser,
	},
	route{
		"tags",
		[]string{"GET", "HEAD"},
		"/tags",
		handleGetTags,
	},
}
