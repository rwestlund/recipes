/*
 * Copyright (c) 2016-2017, Randy Westlund. All rights reserved.
 * This code is under the BSD-2-Clause license.
 *
 * This file handles authentication workflows for the application, namely
 * OAuth2.
 */

package router

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/rwestlund/recipes/config"
	"github.com/rwestlund/recipes/db"
	"github.com/rwestlund/recipes/defs"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

// Build OAuth2 configuration.
var conf = &oauth2.Config{
	ClientID:     config.OAuthClientID,
	ClientSecret: config.OAuthClientSecret,
	RedirectURL:  "https://" + config.LocalHostName + "/oauth2callback",
	Scopes:       []string{"profile", "email"},
	Endpoint:     google.Endpoint,
}

// oauthRedirect handles the first step of the OAuth2 process; redirecting them
// to Google.
// GET /auth/google/login
func oauthRedirect(res http.ResponseWriter, req *http.Request) {
	http.Redirect(res, req, conf.AuthCodeURL("CSRF token"), 302)
}

// We'll need these structs to pull the parts we care about from Google's
// profile responses after OAuth token exchange.
type oAuthEmail struct {
	Value string `json:"value"`
	Type  string `json:"type"`
}
type oAuthProfile struct {
	Emails      []oAuthEmail `json:"emails"`
	DisplayName string       `json:"displayName"`
}

// handleOauthCallback redirects from Google by exchanging the validation code
// for a real token, fetching the user profile from Google, then recording the
// login in the local database and setting cookies.
func handleOauthCallback(res http.ResponseWriter, req *http.Request) {
	// Google provided the validation code in the URL.
	var code = req.URL.Query().Get("code")

	// Use the validation code and our client secret to get a user token.
	var token, err = conf.Exchange(oauth2.NoContext, code)
	if err != nil {
		log.Println(err)
		res.WriteHeader(400)
		return
	}
	// At this point, they have successfully proven authentication; they are
	// who they claim to be. Now we need to see who they are.
	var client = conf.Client(oauth2.NoContext, token)
	resp, err := client.Get("https://www.googleapis.com/plus/v1/people/me")
	if err != nil {
		log.Println("error fetching profile")
		log.Println(err)
		res.WriteHeader(500)
		return
	}
	// Use this commented block to print the JSON response if necessary.
	//var bytes []byte
	//bytes, err = ioutil.ReadAll(resp.Body)
	//fmt.Println(string(bytes))
	//err = json.NewDecoder(strings.NewReader(string(bytes))).Decode(&oauthProfile)

	// Decode the response from Google.
	var oauthProfile oAuthProfile
	err = json.NewDecoder(resp.Body).Decode(&oauthProfile)
	resp.Body.Close()
	if err != nil {
		log.Println("failed to decode google's response")
		log.Println(err)
		res.WriteHeader(500)
		return
	}

	// Now that we have their profile and token, record the login.
	user, err := db.GoogleLogin(oauthProfile.Emails[0].Value,
		oauthProfile.DisplayName, token.AccessToken)
	// If they don't exist in the database, then we haven't authorized them.
	if err == sql.ErrNoRows {
		log.Println("unauthorized user: " + oauthProfile.Emails[0].Value)
		res.WriteHeader(403)
		return
	}
	// Any other error is a server problem.
	if err != nil {
		log.Println(err)
		res.WriteHeader(500)
		return
	}
	// The client will send this with every request. It's HttpOnly.
	var authCookie = http.Cookie{
		Name:     "authentication",
		Value:    token.AccessToken,
		Path:     "/",
		Secure:   true,
		HttpOnly: true,
	}
	// The client uses this for visibility control.
	var roleCookie = http.Cookie{
		Name:   "role",
		Value:  user.Role,
		Secure: true,
	}
	// The client will display this.
	var nameCookie = http.Cookie{
		Name:   "username",
		Value:  user.Name,
		Secure: true,
	}
	// The client will this for visibility control.
	var userIDCookie = http.Cookie{
		Name:   "user_id",
		Value:  strconv.FormatUint(uint64(user.ID), 10),
		Secure: true,
	}
	// Set the cookies and send them home.
	http.SetCookie(res, &authCookie)
	http.SetCookie(res, &roleCookie)
	http.SetCookie(res, &nameCookie)
	http.SetCookie(res, &userIDCookie)
	http.Redirect(res, req, "/", 302)
}

// clearCookies is a utility function to clear cookies.
func clearCookies(res http.ResponseWriter) {
	var authCookie = http.Cookie{
		Name:     "authentication",
		Value:    "",
		Secure:   true,
		HttpOnly: true,
		MaxAge:   -1,
	}
	var roleCookie = http.Cookie{
		Name:   "role",
		Value:  "",
		Secure: true,
		MaxAge: -1,
	}
	var nameCookie = http.Cookie{
		Name:   "username",
		Value:  "",
		Secure: true,
		MaxAge: -1,
	}
	var userIDCookie = http.Cookie{
		Name:   "user_id",
		Value:  "",
		Secure: true,
		MaxAge: -1,
	}
	http.SetCookie(res, &authCookie)
	http.SetCookie(res, &roleCookie)
	http.SetCookie(res, &nameCookie)
	http.SetCookie(res, &userIDCookie)
}

// handleLogout handles a logout request by deleting the token and clearing
// cookies.
// GET /logout
func handleLogout(res http.ResponseWriter, req *http.Request) {
	var authCookie, err = req.Cookie("authentication")
	// If there is no auth cookie, skip deleting it and just return success.
	if err == nil {
		var e = db.UserLogout(authCookie.Value)
		if e != nil {
			log.Println(err)
			res.WriteHeader(500)
			return
		}
	}
	clearCookies(res)
	http.Redirect(res, req, "/", 302)
	return
}

// checkAuth uses the authentication header to find the currently logged-in user.
func checkAuth(res http.ResponseWriter, req *http.Request) (*defs.User, error) {
	var authCookie, err = req.Cookie("authentication")
	// If there is no auth cookie, just return a nil User.
	if err != nil {
		return nil, err
	}
	user, err := db.FetchUserByToken(authCookie.Value)
	// If there is an auth token, but it isn't valid. Better clear it so the
	// client knows, then continue as normal.
	if err == sql.ErrNoRows {
		clearCookies(res)
		return nil, nil
	}
	// Finally, return the valid logged-in user.
	return user, err
}
