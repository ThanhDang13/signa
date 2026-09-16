import { drizzle } from "drizzle-orm/postgres-js";
import { migrate as drizzleMigrate } from "drizzle-orm/postgres-js/migrator";
import path from "path";
import postgres from "postgres";

export async function migrate(connectionString: string) {
  const migrationsFolder = path.join(
    path.dirname(require.resolve("@signa/drizzle-runtime/migrations/index.js"))
  );

  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  await drizzleMigrate(db, { migrationsFolder });

  await sql.end();
}
