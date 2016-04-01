package main

import (
    "strconv"
    "log"
    "net/http"
    "encoding/json"
    "github.com/rwestlund/recipes/defs"
    "github.com/rwestlund/recipes/db"
    "github.com/gorilla/mux"
)

/*
 * Request a list of recipes
 * GET /recipes
 */
func handle_recipes(res http.ResponseWriter, req *http.Request) {
    res.Header().Set("Content-Type", "application/json; charset=UTF-8")

    /* We can ignore the error because count=0 means disabled. */
    var bigcount uint64
    bigcount, _ = strconv.ParseUint(req.URL.Query().Get("count"), 10, 32)
    var bigskip uint64
    bigskip, _ = strconv.ParseUint(req.URL.Query().Get("skip"), 10, 32)
    /* Build RecipeFilter from query params. */
    var filter defs.RecipeFilter = defs.RecipeFilter{
        Title: req.URL.Query().Get("title"),
        Count: uint32(bigcount),
        Skip: uint32(bigskip),
    }

    var recipes *[]defs.Recipe
    var err error
    recipes, err = db.FetchRecipes(&filter)
    if err != nil {
        log.Println(err)
        res.WriteHeader(500)
        return
    }
    j, e := json.Marshal(recipes)
    if e != nil {
        log.Println(e)
        res.WriteHeader(500)
        return
    }
    /* If we made it here, send good response. */
    res.Write(j)
}


/*
 * Request a specific recipe.
 * GET /recipes/3
 */
func handle_recipe(res http.ResponseWriter, req *http.Request) {
    res.Header().Set("Content-Type", "application/json; charset=UTF-8")

    /* Get id parameter. */
    params := mux.Vars(req)
    bigid, err := strconv.ParseUint(params["id"], 10, 32)
    if err != nil {
        log.Println(err)
        res.WriteHeader(400)
        return
    }
    var id uint32 = uint32(bigid)

    var recipe *defs.Recipe
    recipe, err = db.FetchRecipe(id)
    if err != nil {
        res.WriteHeader(500)
        log.Println(err)
        return
    } else if recipe == nil {
        res.WriteHeader(404)
        return
    }

    j, e := json.Marshal(recipe)
    if e != nil {
        log.Println(err)
        res.WriteHeader(500)
        return
    }

    /* If we made it here, send good response. */
    res.Write(j)
}

/*
 * Request a list of users.
 * GET /users
 */
func handle_users(res http.ResponseWriter, req *http.Request) {
    res.Header().Set("Content-Type", "application/json; charset=UTF-8")

    var users *[]defs.User
    var err error
    users, err = db.FetchUsers(req.URL.Query().Get("name_or_email"))
    if err != nil {
        log.Println(err)
        res.WriteHeader(500)
        return
    }
    j, e := json.Marshal(users)
    if e != nil {
        log.Println(e)
        res.WriteHeader(500)
        return
    }
    /* If we made it here, send good response. */
    res.Write(j)
}


/*
 * Receive a new user to create.
 * POST /users or PUT /users
 * Example: { email: ..., role: ... }
 */
func handle_post_or_put_user(res http.ResponseWriter, req *http.Request) {
    res.Header().Set("Content-Type", "application/json; charset=UTF-8")

    /* Decode body. */
    var user defs.User
    var err error = json.NewDecoder(req.Body).Decode(&user)
    if err != nil {
        log.Println(err)
        res.WriteHeader(400)
        return
    }

    var new_user *defs.User
    /* Update a user in the database. */
    if req.Method == "PUT" {
        new_user, err = db.UpdateUser(&user)
    /* Create new user in DB. */
    } else {
        new_user, err = db.CreateUser(&user)
    }

    if err != nil {
        log.Println(err)
        res.WriteHeader(400)
        return
    }

    /* Send it back. */
    j, e := json.Marshal(new_user)
    if e != nil {
        log.Println(e)
        res.WriteHeader(500)
        return
    }
    /* If we made it here, send good response. */
    res.Write(j)
}


/*
 * Delete a user by id.
 * DELETE /users/4
 */
func handle_delete_user(res http.ResponseWriter, req *http.Request) {
    res.Header().Set("Content-Type", "application/json; charset=UTF-8")

    /* Get id parameter. */
    params := mux.Vars(req)
    bigid, err := strconv.ParseUint(params["id"], 10, 32)
    if err != nil {
        log.Println(err)
        res.WriteHeader(400)
        return
    }
    var id uint32 = uint32(bigid)

    err = db.DeleteUser(id)

    if err != nil {
        log.Println(err)
        res.WriteHeader(400)
        return
    }

    /* If we made it here, send good response. */
    res.WriteHeader(200)
}


