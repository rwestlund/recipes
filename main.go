package main

import (
    "log"
    "net/http"
    "db"
    "router"
)

func main() {

    db.Init()

    /* Create router from routes.go. */
    my_router := router.NewRouter()
    log.Println("server running")
    http.ListenAndServe(":3000", my_router)
}
