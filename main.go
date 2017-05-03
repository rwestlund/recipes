/*
 * Copyright (c) 2016-2017, Randy Westlund. All rights reserved.
 * This code is under the BSD-2-Clause license.
 *
 * This is the main file. Run it to launch the application.
 */

package main

import (
	"log"
	"net/http"

	"github.com/rwestlund/recipes/config"
	"github.com/rwestlund/recipes/db"
	"github.com/rwestlund/recipes/router"
)

func main() {
	var err = db.Init()
	if err != nil {
		log.Fatal(err)
	}
	// Create router from routes.go.
	myRouter := router.NewRouter()
	log.Println("starting server on " + config.ListenAddress)
	http.ListenAndServe(config.ListenAddress, myRouter)
}
