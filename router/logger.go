/*
 * Copyright (c) 2016-2017, Randy Westlund. All rights reserved.
 * This code is under the BSD-2-Clause license.
 *
 * This file wraps the HTTP handlers with a logging function.
 */

package router

import (
	"log"
	"net/http"
	"time"
)

// Add logging functionality to HTTP requests.
func logger(inner http.Handler, name string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var start = time.Now()
		// Handle request.
		inner.ServeHTTP(w, r)
		// Log request with time elapsed.
		log.Printf(
			"%s\t%s\t%s\t%s",
			r.Method,
			r.RequestURI,
			name,
			time.Since(start),
		)
	})
}
