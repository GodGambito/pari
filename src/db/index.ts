import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

// Cliente HTTP Serverless optimizado para Vercel Edge y Serverless Functions.
// Evita conexiones TCP persistentes y no sufre por límites de conexión concurrentes.
const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
export type DB = typeof db;
