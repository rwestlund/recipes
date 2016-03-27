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
        "home",
        []string{ "GET", "HEAD" },
        "/",
        home,
    },
    Route {
        "recipe",
        []string{ "GET", "HEAD" },
        "/recipes/{id:[0-9]+}",
        recipe,
    },
}
