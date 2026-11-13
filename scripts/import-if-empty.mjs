import { importRecipes } from "./import.mjs";

const url = process.env.DATABASE_URL?.trim() ?? "";
if (url === "") {
  console.log("import-if-empty: no DATABASE_URL, skipping");
  process.exit(0);
}

importRecipes({ refresh: false }).catch((error) => {
  const message = error instanceof Error ? error.message : "import failed";
  console.error(message.replace(/postgres(?:ql)?:\/\/\S+/gi, "postgres://[redacted]"));
  process.exit(1);
});
