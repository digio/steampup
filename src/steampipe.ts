import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

export async function connectToSteampipe() {
  await client.connect();
}

export async function executeQuery(sql) {

  const result = await client.query(sql);

  return [Object.keys(result.rows[0]), ...result.rows.map(Object.values)];
}

export async function disconnectFromSteampipe() {
  await client.end();
}