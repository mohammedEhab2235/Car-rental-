import postgres from "postgres";

function ensureSslModeRequire(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    if (!url.searchParams.get("sslmode")) url.searchParams.set("sslmode", "require");
    return url.toString();
  } catch {
    return connectionString;
  }
}

export { ensureSslModeRequire };

export function ensureSslMode(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    const current = url.searchParams.get("sslmode");
    if (!current || current === "require" || current === "prefer" || current === "verify-ca") {
      url.searchParams.set("sslmode", "verify-full");
    }
    return url.toString();
  } catch {
    return connectionString;
  }
}

const connectionString = process.env.DATABASE_URL;
const sql = connectionString ? postgres(ensureSslModeRequire(connectionString)) : null;

export function getSql() {
  if (!sql) {
    throw new Error("DATABASE_URL is not set");
  }

  return sql;
}

export default sql;
