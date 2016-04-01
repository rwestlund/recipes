package main

import (
    "net/http"
)

/* Routes are a list of these structs. */
type Route struct {
    name    string
    methods []string
    pattern string
    handler http.HandlerFunc
}
type Routes []Route

/* Define the actual routes here. */
var routes = Routes {
    Route {
        "recipe",
        []string{ "GET", "HEAD" },
        "/recipes/{id:[0-9]+}",
        handle_recipe,
    },
    Route {
        "recipes",
        []string{ "GET", "HEAD" },
        "/recipes",
        handle_recipes,
    },
    Route {
        "users",
        []string{ "GET", "HEAD" },
        "/users",
        handle_users,
    },
    Route {
        "users",
        []string{ "POST", "PUT" },
        "/users",
        handle_post_or_put_user,
    },
    Route {
        "users",
        []string{ "DELETE" },
        "/users/{id:[0-9]+}",
        handle_delete_user,
    },
}
