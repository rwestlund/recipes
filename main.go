/*
 * Copyright (c) 2016, Randy Westlund. All rights reserved.
 * This code is under the BSD-2-Clause license.
 *
 * This is the main file. Run it to launch the application.
 */

package main

import (
	"github.com/rwestlund/recipes/config"
	"github.com/rwestlund/recipes/db"
	"github.com/rwestlund/recipes/router"
	"log"
	"net/http"
)

func main() {
	db.Init()
	/* Create router from routes.go. */
	my_router := router.NewRouter()
	log.Println("starting server on " + config.ListenAddress)
	http.ListenAndServe(config.ListenAddress, my_router)
}
