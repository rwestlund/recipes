package main

import (
    "strconv"
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
func recipes(res http.ResponseWriter, req *http.Request) {
    res.Header().Set("Content-Type", "application/json; charset=UTF-8")

    var recipes []defs.Recipe
    var err error
    recipes, err = db.FetchRecipes()
    if err != nil {
        res.WriteHeader(500)
        return
    }
    j, e := json.Marshal(recipes)
    if e != nil {
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
func recipe(res http.ResponseWriter, req *http.Request) {
    /* Get id parameter. */
    params := mux.Vars(req)
    bigid, err := strconv.ParseUint(params["id"], 10, 32)
    var id uint32 = uint32(bigid)

    res.Header().Set("Content-Type", "application/json; charset=UTF-8")

    var recipe *defs.Recipe
    recipe, err = db.FetchRecipe(id)
    if err != nil {
        res.WriteHeader(500)
        return
    } else if recipe == nil {
        res.WriteHeader(404)
        return
    }

    j, e := json.Marshal(recipe)
    if e != nil {
        res.WriteHeader(500)
        return
    }

    /* If we made it here, send good response. */
    res.Write(j)
}

/*
 * Load the home page and main app.
 * GET /
 */
func home(res http.ResponseWriter, req *http.Request) {
    http.ServeFile(res, req, "app/home.html")
}
