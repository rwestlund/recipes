package main

import (
    "net/http"
    "github.com/gorilla/mux"
)

/* Build a router by iterating over all routes. */
func NewRouter() *mux.Router {
    router := mux.NewRouter()

    for _, route := range routes {
        /* Wrap handler in logger from logger.go. */
        var handler http.Handler = Logger(route.handler, route.name)

        router.
            Methods(route.methods...).
            Path(route.pattern).
            Name(route.name).
            Handler(handler)
    }
    /* Add route to handle static files. */
    router.PathPrefix("/").Handler(http.FileServer(http.Dir("./app/")))
    return router
}
