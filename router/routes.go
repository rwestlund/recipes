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
	methods []string
	pattern string
	handler http.HandlerFunc
}
type routelist []route

// Define the actual routes here.
var routes = routelist{
	route{
		[]string{"GET"},
		"/auth/google/login",
		oauthRedirect,
	},
	route{
		[]string{"GET"},
		"/auth/oauth2callback",
		handleOauthCallback,
	},
	route{
		[]string{"GET"},
		"/auth/logout",
		handleLogout,
	},
	route{
		[]string{"GET", "HEAD"},
		"/recipes/{id:[0-9]+}",
		handleRecipe,
	},
	route{
		[]string{"GET", "HEAD"},
		"/recipes",
		handleRecipes,
	},
	route{
		[]string{"GET", "HEAD"},
		"/recipes/titles",
		handleGetRecipeTitles,
	},
	route{
		[]string{"GET", "HEAD"},
		"/users",
		handleUsers,
	},
	route{
		[]string{"POST", "PUT"},
		"/recipes",
		handlePutOrPostRecipe,
	},
	route{
		[]string{"POST", "PUT"},
		"/recipes/{id:[0-9]+}",
		handlePutOrPostRecipe,
	},
	route{
		[]string{"DELETE"},
		"/recipes/{id:[0-9]+}",
		handleDeleteRecipe,
	},
	route{
		[]string{"POST"},
		"/users",
		handlePutOrPostUser,
	},
	route{
		[]string{"POST"},
		"/users",
		handlePutOrPostUser,
	},
	route{
		[]string{"PUT"},
		"/users/{id:[0-9]+}",
		handlePutOrPostUser,
	},
	route{
		[]string{"DELETE"},
		"/users/{id:[0-9]+}",
		handleDeleteUser,
	},
	route{
		[]string{"GET", "HEAD"},
		"/tags",
		handleGetTags,
	},
}
