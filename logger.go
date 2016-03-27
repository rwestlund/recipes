package main

import (
    "log"
    "net/http"
    "time"
)

/* Add logging functionality to HTTP requests. */
func Logger(inner http.Handler, name string) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        /* Mark time at which reuest was received. */
        var start time.Time = time.Now()
        /* Handle request. */
        inner.ServeHTTP(w, r)

        /* Log request with time elapsed. */
        log.Printf(
            "%s\t%s\t%s\t%s",
            r.Method,
            r.RequestURI,
            name,
            time.Since(start),
        )
    })
}
