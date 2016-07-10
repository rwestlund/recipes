package router

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
        "auth",
        []string{ "GET" },
        "/auth/google/login",
        oauth_redirect,
    },
    Route {
        "auth",
        []string{ "GET" },
        "/oauth2callback",
        handle_oauth_callback,
    },
    Route {
        "logout",
        []string{ "GET" },
        "/logout",
        handle_logout,
    },
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
        "recipes",
        []string{ "POST", "PUT" },
        "/recipes/{id:[0-9]+?}",
        handle_put_or_post_recipe,
    },
    Route {
        "users",
        []string{ "POST" },
        "/users",
        handle_post_or_put_user,
    },
    Route {
        "users",
        []string{ "PUT" },
        "/users/{id:[0-9]+?}",
        handle_post_or_put_user,
    },
    Route {
        "users",
        []string{ "DELETE" },
        "/users/{id:[0-9]+}",
        handle_delete_user,
    },
    Route {
        "tags",
        []string{ "GET", "HEAD" },
        "/tags",
        handle_get_tags,
    },
}
