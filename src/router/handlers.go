package router

import (
    "strconv"
    "log"
    "net/url"
    "net/http"
    "encoding/json"
    "database/sql"
    "defs"
    "db"
    "github.com/gorilla/mux"
)

/*
 * Take a url.URL object (from req.URL) and fill an ItemFilter.
 */
func build_item_filter(url *url.URL) *defs.ItemFilter {
    /* We can ignore the error because count=0 means disabled. */
    var bigcount uint64
    bigcount, _ = strconv.ParseUint(url.Query().Get("count"), 10, 32)
    var bigskip uint64
    bigskip, _ = strconv.ParseUint(url.Query().Get("skip"), 10, 32)
    /* Build ItemFilter from query params. */
    var filter defs.ItemFilter = defs.ItemFilter{
        Query: url.Query().Get("query"),
        Count: uint32(bigcount),
        Skip: uint32(bigskip),
    }
    return &filter
}

/*
 * Request a list of recipes.
 * GET /recipes
 */
func handle_recipes(res http.ResponseWriter, req *http.Request) {
    res.Header().Set("Content-Type", "application/json; charset=UTF-8")

    var filter = build_item_filter(req.URL);

    var recipes *[]defs.Recipe
    var err error
    recipes, err = db.FetchRecipes(filter)
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
 * Create a new recipe or update an existing one.
 * POST /recipes, PUT /recipes/4
 */
func handle_put_or_post_recipe(res http.ResponseWriter, req *http.Request) {
    /* Access control. */
    var usr *defs.User
    var err error
    usr, err = check_auth(res, req)
    if err != nil {
        res.WriteHeader(500)
        return
    }
    if usr == nil {
        res.WriteHeader(401)
        return
    }
    if usr.Role != "Admin" && usr.Role != "Moderator" && usr.Role != "User" {
        res.WriteHeader(403)
        return
    }

    res.Header().Set("Content-Type", "application/json; charset=UTF-8")

    /* Decode body. */
    var recipe defs.Recipe
    err = json.NewDecoder(req.Body).Decode(&recipe)
    if err != nil {
        log.Println(err)
        res.WriteHeader(400)
        return
    }

    var new_recipe *defs.Recipe

    /* Update it. */
    if req.Method == "PUT" {
        /* Bypass the author check if the user has sufficient privileges. */
        var force bool
        force = usr.Role == "Admin" || usr.Role == "Moderator"
        new_recipe, err = db.SaveRecipe(&recipe, usr.Id, force)
        if err == sql.ErrNoRows {
            res.WriteHeader(403)
            return
        }
    /* Create it. */
    } else {
        /* Fill in the currently logged-in user as the author. */
        recipe.AuthorId = usr.Id
        new_recipe, err = db.CreateRecipe(&recipe)
    }

    if err != nil {
        log.Println(err)
        res.WriteHeader(400)
        return
    }

    /* Send it back. */
    j, e := json.Marshal(new_recipe)
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
    var params map[string]string = mux.Vars(req)
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
 * Delete a recipe by id.
 * DELETE /recipes/4
 */
func handle_delete_recipe(res http.ResponseWriter, req *http.Request) {
    /* Access control. */
    var usr *defs.User
    var err error
    usr, err = check_auth(res, req)
    if err != nil {
        res.WriteHeader(500)
        return
    }
    if usr == nil {
        res.WriteHeader(401)
        return
    }
    if usr.Role != "Admin" && usr.Role != "Moderator" && usr.Role != "User" {
        res.WriteHeader(403)
        return
    }

    res.Header().Set("Content-Type", "application/json; charset=UTF-8")

    /* Get id parameter. */
    var params map[string]string = mux.Vars(req)
    var bigid uint64
    bigid, err = strconv.ParseUint(params["id"], 10, 32)
    if err != nil {
        log.Println(err)
        res.WriteHeader(400)
        return
    }
    var recipe_id uint32 = uint32(bigid)

    /* Bypass the author check if the user has sufficient privileges. */
    var force bool
    force = usr.Role == "Admin" || usr.Role == "Moderator"
    err = db.DeleteRecipe(recipe_id, usr.Id, force)
    if err == sql.ErrNoRows {
        res.WriteHeader(403)
        return
    }
    if err != nil {
        log.Println(err)
        res.WriteHeader(400)
        return
    }
    /* If we made it here, send good response. */
    res.WriteHeader(200)
}

/*
 * Request a list of users.
 * GET /users
 */
func handle_users(res http.ResponseWriter, req *http.Request) {
    /* Access control. */
    var usr *defs.User
    var err error
    usr, err = check_auth(res, req)
    if err != nil {
        res.WriteHeader(500)
        return
    }
    if usr == nil {
        res.WriteHeader(401)
        return
    }
    if usr.Role != "Admin" {
        res.WriteHeader(403)
        return
    }

    res.Header().Set("Content-Type", "application/json; charset=UTF-8")

    var filter = build_item_filter(req.URL);

    var users *[]defs.User
    users, err = db.FetchUsers(filter)
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
 * POST /users or PUT /users/4
 * Example: { email: ..., role: ... }
 */
func handle_post_or_put_user(res http.ResponseWriter, req *http.Request) {
    /* Access control. */
    var usr *defs.User
    var err error
    usr, err = check_auth(res, req)
    if err != nil {
        res.WriteHeader(500)
        return
    }
    if usr == nil {
        res.WriteHeader(401)
        return
    }
    if usr.Role != "Admin" {
        res.WriteHeader(403)
        return
    }

    res.Header().Set("Content-Type", "application/json; charset=UTF-8")

    /* Decode body. */
    var user defs.User
    err = json.NewDecoder(req.Body).Decode(&user)
    if err != nil {
        log.Println(err)
        res.WriteHeader(400)
        return
    }

    var new_user *defs.User
    /* Update a user in the database. */
    if req.Method == "PUT" {
        /* Get id parameter. */
        var params map[string]string = mux.Vars(req)
        bigid, err := strconv.ParseUint(params["id"], 10, 32)
        if err != nil {
            log.Println(err)
            res.WriteHeader(400)
            return
        }
        var id uint32 = uint32(bigid)

        new_user, err = db.UpdateUser(id, &user)
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
    /* Access control. */
    var usr *defs.User
    var err error
    usr, err = check_auth(res, req)
    if err != nil {
        res.WriteHeader(500)
        return
    }
    if usr == nil {
        res.WriteHeader(401)
        return
    }
    if usr.Role != "Admin" {
        res.WriteHeader(403)
        return
    }

    res.Header().Set("Content-Type", "application/json; charset=UTF-8")

    /* Get id parameter. */
    var params map[string]string = mux.Vars(req)
    var bigid uint64
    bigid, err = strconv.ParseUint(params["id"], 10, 32)
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

func handle_get_tags(res http.ResponseWriter, req *http.Request) {
    var tags *[]byte
    var err error
    tags, err = db.FetchTags()
    if err != nil {
        log.Println(err)
        res.WriteHeader(500)
        return
    }
    res.Write(*tags)
}

func handle_get_recipe_titles(res http.ResponseWriter, req *http.Request) {
    var titles *[]byte
    var err error
    titles, err = db.FetchRecipeTitles()
    if err != nil {
        log.Println(err)
        res.WriteHeader(500)
        return
    }
    res.Write(*titles)
}
