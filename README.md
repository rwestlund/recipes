# Recipes

A phone-first household recipe book. Anyone can read a recipe from its link. Creating, editing, deleting, and uploading photos needs one household password.

## Run locally

```bash
npm install
npm run import
npm run dev
```

Open http://localhost:3000.

`npm run import` loads the public book from `https://recipes.textplain.net/api/recipes` into a local Postgres-compatible database in `.data/pglite`. Stop the dev server before running the import again. The script is safe to repeat: it refreshes imported text and links, and it leaves photos and recipes that were written only in this app. If a killed dev server leaves the local database unable to open, delete `.data` and run the import again.

If your shell already has a `DATABASE_URL` for some other database, unset it so local commands use the app database:

```bash
env -u DATABASE_URL npm run import
env -u DATABASE_URL npm run dev
```

To point this app at your own Postgres instead, set `DATABASE_URL` for both `npm run import` and `npm run dev`.

## Edit password

The secret name is `EDIT_PASSWORD`.

When `EDIT_PASSWORD` is unset, `NODE_ENV` is not `production`, and `DATABASE_URL` is unset, the edit password is `dev`. That fallback is only for local development. Do not put a real password in the repo. In production, editing stays off until `EDIT_PASSWORD` is set.

## Production

The host injects `DATABASE_URL`. `cursor-app.json` asks for Postgres. `npm run build` applies `migrations/` and, the first time the database is empty of an import, copies the public book in. Later builds leave household edits in place. Run `npm run import` with `DATABASE_URL` set when you want to refresh text from the old site again. Photos are stored in Postgres as modest JPEGs. There is no object store.
