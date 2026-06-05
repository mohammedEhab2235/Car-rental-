import "dotenv/config";
import bcrypt from "bcryptjs";
import { getSql } from "../src/db.js";

const args = process.argv.slice(2);
const username = args[0];
const plainPassword = args[1];

if (!username || !plainPassword) {
  console.error("Usage: npx tsx scripts/create-admin.ts <username> <password>");
  console.error("Example: npx tsx scripts/create-admin.ts admin MySecurePass123");
  process.exit(1);
}

async function main() {
  const sql = getSql();
  const hash = await bcrypt.hash(plainPassword, 10);

  const result = await sql`
    INSERT INTO public.users (username, password_hash)
    VALUES (${username}, ${hash})
    ON CONFLICT (username) DO UPDATE SET password_hash = ${hash}
    RETURNING id, username
  `;

  console.log("Created/updated user:", result[0]);
  await sql.end();
}

main().catch((err) => {
  console.error("Failed to create admin user:", err);
  process.exit(1);
});
