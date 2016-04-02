package main

import (
    "log"
    "net/http"
    "github.com/rwestlund/recipes/db"
)

func main() {

    db.Init()

    /* Create router from routes.go. */
    router := NewRouter()
    log.Println("server running")
    http.ListenAndServe(":3000", router)
}
