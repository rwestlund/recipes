package main

import (
    "log"
    "net/http"
    "db"
    "router"
    "config"
)

func main() {
    db.Init()

    /* Create router from routes.go. */
    my_router := router.NewRouter()
    log.Println("server running")
    http.ListenAndServe(config.Config.ListenAddress, my_router)
}
