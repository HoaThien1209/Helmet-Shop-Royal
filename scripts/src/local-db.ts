import EmbeddedPostgres from "embedded-postgres";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const databaseDir = path.join(__dirname, "../../.local-db");
const port = 54329;
const user = "postgres";
const password = "postgres";
const dbName = "helmet_shop";

const pg = new EmbeddedPostgres({
  databaseDir,
  user,
  password,
  port,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});

const initialised = await pg
  .initialise()
  .then(() => true)
  .catch(() => false);

await pg.start();

if (initialised) {
  await pg.createDatabase(dbName);
}

const url = `postgresql://${user}:${password}@localhost:${port}/${dbName}`;
console.log(`DATABASE_URL=${url}`);
console.log("Local Postgres is running. Press Ctrl+C to stop.");

process.on("SIGINT", async () => {
  await pg.stop();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await pg.stop();
  process.exit(0);
});
