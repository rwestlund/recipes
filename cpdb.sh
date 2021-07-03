#!/bin/sh
set -e

# This copies the production database to the local machine.

go build
./tools/createdb/createdb
ssh ryloth.textplain.net 'pg_dump -U recipes -d recipes' | psql -U recipes -d recipes 
