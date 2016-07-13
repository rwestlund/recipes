# Recipes

A client-side web application for managing recipes, written in Go and Polymer.

## Dependencies

- PostgreSQL >= 9.4
- Node.js and NPM
- Go
- NGINX, or another reverse proxy to handle TLS

## Description

This project provides a simple web application where users can view and upload
recipes.  It's designed for mobile, so it works great with your phone in the
kitchen.

The front end uses Polymer.  The back end uses Go and PostgreSQL.  Go
dependencies are managed as git submodules because using `go get` has no
concept of version numbers.

Authentication is done using OAuth 2.0 with Google.  No Google services are
accessed after authentication.

The Node.js dependency is somewhat silly; it's only there to use Bower to
manage client-side dependencies.  If anyone knows of a better way, let me know.

The old version using Node.js and MongoDB is still available at
[https://github.com/rwestlund/recipes-v1]().

## Installation

1. Install dependencies list above
2. Clone this repo
3. Run `npm install`
4. Run `npm run bower install`
5. Run `git submodule update --init`
6. Copy `src/config/config.go.example` to `src/config/config.go` and set
    parameters
7. Configure a reverse proxy (like NGINX) to handle TLS
8. Set the `GOPATH` environment variable to the root of this repository
9. Manually add yourself to the `users` table in PostgreSQL
10. Run `go run main.go`


## License

This code is under the BSD-2-Clause license.  See the LICENSE file for the full
text.
