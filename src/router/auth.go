/*
 * This file handles authentication workflows for the application, namely
 * OAuth2.
 */
package router

import (
    "fmt"
    "log"
    "database/sql"
    "net/http"
    "encoding/json"
    "golang.org/x/oauth2"
    "golang.org/x/oauth2/google"
    "db"
    "defs"
    "config"
)

/* Build OAuth2 configuration. */
var conf *oauth2.Config = &oauth2.Config{
    ClientID:       config.OAuthClientID,
    ClientSecret:   config.OAuthClientSecret,
    RedirectURL:    "https://" + config.LocalHostName + "/oauth2callback",
    Scopes:         []string{ "profile", "email" },
    Endpoint:       google.Endpoint,
}

/*
 * Handle the first step of the OAuth2 process; redirecting them to Google.
 * GET /auth/google/login
 */
func oauth_redirect(res http.ResponseWriter, req *http.Request) {
    http.Redirect(res, req, conf.AuthCodeURL("CSRF token"), 302)
}

/*
 * We'll need these structs to pull the parts we care about from Google's
 * profile responses after OAuth token exchange.
 */
type OAuthEmail struct {
    Value   string `json:"value"`
    Type    string `json:"type"`
}
type OAuthProfile struct {
    Emails         []OAuthEmail `json:"emails"`
    DisplayName    string       `json:"displayName"`
}

/*
 * Handle OAuth redirects from Google by exvchanging the validation code for a
 * real token, fetching the user profile from Google, then recording the login
 * in the local database and setting cookies.
 */
func handle_oauth_callback(res http.ResponseWriter, req *http.Request) {
    var err error
    /* Google provided the validation code in the URL. */
    var code string
    code = req.URL.Query().Get("code")

    /* Use the validation code and our client secret to get a user token. */
    var token  *oauth2.Token
    fmt.Println("exchanging token") // DEBUG
    token, err = conf.Exchange(oauth2.NoContext, code)
    if err != nil {
        log.Println(err)
        res.WriteHeader(400)
        return
    }
    /*
     * At this point, they have successfully proven authentication; they are
     * who they claim to be. Now we need to see who they are.
     */
    fmt.Println("getting profile")// DEBUG
    var client *http.Client;
    client = conf.Client(oauth2.NoContext, token)
    var resp *http.Response
    resp, err = client.Get("https://www.googleapis.com/plus/v1/people/me")
    if err != nil {
        log.Println("error fetching profile")
        log.Println(err)
        res.WriteHeader(500)
        return
    }
    fmt.Println("parsing profile")// DEBUG
    /* Use this commented block to print the JSON response if necessary. */
    //var bytes []byte
    //bytes, err = ioutil.ReadAll(resp.Body)
    //fmt.Println(string(bytes))
    //err = json.NewDecoder(strings.NewReader(string(bytes))).Decode(&oauth_profile)

    /* Decode the response from Google. */
    var oauth_profile OAuthProfile
    err = json.NewDecoder(resp.Body).Decode(&oauth_profile)
    resp.Body.Close()
    if err != nil {
        log.Println("failed to decode google's response")
        log.Println(err)
        res.WriteHeader(500)
        return
    }
    fmt.Println(oauth_profile)//DEBUG

    /* Now that we have their profile and token, record the login. */
    fmt.Println("recording user in DB")//DEBUG
    var user *defs.User
    user, err = db.GoogleLogin(oauth_profile.Emails[0].Value,
            oauth_profile.DisplayName, token.AccessToken)
    /* If they don't exist in the database, then we haven't authorized them. */
    if err == sql.ErrNoRows {
        log.Println("unauthorized user: " + oauth_profile.Emails[0].Value)
        res.WriteHeader(403)
        return
    }
    /* Any other error is a server problem. */
    if err != nil {
        log.Println(err)
        res.WriteHeader(500)
        return
    }
    /* The client will send this with every request. */
    var auth_cookie = http.Cookie {
        Name:      "authentication",
        Value:     token.AccessToken,
        Secure:    true,
    }
    /* The client uses this for visibility control. */
    var role_cookie = http.Cookie {
        Name:       "role",
        Value:      user.Role,
        Secure:     true,
    }
    /* The client will display this. */
    var name_cookie = http.Cookie {
        Name:       "name",
        Value:      user.Name,
        Secure:     true,
    }
    /* Set the cookies and send them home. */
    http.SetCookie(res, &auth_cookie)
    http.SetCookie(res, &role_cookie)
    http.SetCookie(res, &name_cookie)
    http.Redirect(res, req, "/", 302)
    /* TODO check auth in router */
}
