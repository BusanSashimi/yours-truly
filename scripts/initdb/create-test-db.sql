-- Runs once on first container start (docker-entrypoint-initdb.d), as the
-- POSTGRES_USER (yt) against the default database. The dev database
-- (yours_truly) is created by the entrypoint itself via POSTGRES_DB; this
-- adds the database the API test suite expects (see apps/api package.json).
CREATE DATABASE yours_truly_test OWNER yt;
