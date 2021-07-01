#!/bin/sh

# This script builds both the Awning Tracker client and server, including
# inserting version numbers.

set -e

# This version string will be embedded in both the client and server. On a
# tagged commit, it will look like: v4.10.6. On other commits, it will look
# like: v4.10.6-1-gd5ea9c4.
VERSION=$(git describe --tags)
echo "Building $VERSION..."

# Build the server.
go build

# Build the clients.
rm -rf dist
npx rollup -c rollup.config.js
