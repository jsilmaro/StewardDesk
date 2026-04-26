import pg from "pg";

const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

console.log("Running migrations...");

await client.query(`
  ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workspace_id integer REFERENCES workspaces(id) ON DELETE CASCADE;
`);
console.log("✓ Added workspace_id to tasks");

await client.query(`
  ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS viewer_token varchar UNIQUE;
`);
console.log("✓ Added viewer_token to workspaces");

await client.query(`
  ALTER TABLE columns ADD COLUMN IF NOT EXISTS workspace_id integer REFERENCES workspaces(id) ON DELETE CASCADE;
`);
console.log("✓ Added workspace_id to columns");

await client.end();
console.log("Done.");
