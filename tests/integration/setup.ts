import { config } from "dotenv";
import path from "node:path";

// Prefer .env.test (dedicated CI Neon / local Docker), never silently fall back to app .env.
config({ path: path.resolve(process.cwd(), ".env.test"), override: true });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "Integration tests require DATABASE_URL. Copy .env.test.example → .env.test, or use docker-compose.test.yml / CI Postgres service."
  );
}

// Force Prisma to use the test URL even if a global client was cached.
process.env.PRISMA_USE_DIRECT_URL = process.env.DIRECT_URL ? "1" : "";
