/*
 * Copyright (c) 2016-2017, Randy Westlund. All rights reserved.
 * This code is under the BSD-2-Clause license.
 *
 * This file builds the actual router from the list of routes.
 */

package router

import (
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

// NewRouter builds a router by iterating over all routes.
func NewRouter() *mux.Router {
	router := mux.NewRouter()
	apiRouter := router.PathPrefix("/api/").Subrouter()
	for _, route := range routes {
		apiRouter.
			Methods(route.methods...).
			Path(route.pattern).
			Handler(logger(route.handler))
	}
	return router
}

// Add logging functionality to HTTP requests.
func logger(inner http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var start = time.Now()
		// Handle request.
		inner.ServeHTTP(w, r)
		// Log request with time elapsed.
		log.Printf("%s\t%s\t%s", r.Method, r.RequestURI, time.Since(start))
	})
}
