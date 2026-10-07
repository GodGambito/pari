import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Cargar variables de entorno desde .env.local o .env
config({ path: ".env.local" });
config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  console.warn("ADVERTENCIA: DATABASE_URL no encontrada en .env o .env.local");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
