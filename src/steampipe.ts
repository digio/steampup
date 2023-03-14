// Copyright 2023 Mantel Group Pty Ltd
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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