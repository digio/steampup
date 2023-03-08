#!/usr/bin/env npx ts-node --esm

import { table } from 'table';
import * as dotenv from 'dotenv'
import { PromptTemplate } from "langchain/prompts";
import { OpenAI } from "langchain";
import pkg from 'pg';
const { Client } = pkg;
import prompts from 'prompts';
import emoji from 'node-emoji';
dotenv.config()

import { HNSWLib } from "langchain/vectorstores";
import { OpenAIEmbeddings } from "langchain/embeddings";

const embeddings = new OpenAIEmbeddings();

// returns a new vector store if no saved one found or the saved one if it exists
function getVectorStore() {
  return HNSWLib.load("index", embeddings).catch(async () => {
      console.log("no saved index found, creating new one")
    const store = await HNSWLib.fromTexts(
      [
        `Request: List the stargazers of repository turbot/steampipe,
        ordered by the time they starred it, most recent first
        SQL: select user_login, starred_at from github_stargazer
        where repository_full_name = 'turbot/steampipe' order by starred_at desc;`,

        `Request: List the count of stargazers of repository turbot/steampipe, grouped by month 
        SQL: select to_char(starred_at, 'YYYY-MM') as month, count(*) from github_stargazer where repository_full_name = 'turbot/steampipe'
        group by month order by month;`,

        `Request: List stargazers of repository turbot/steampipe with their contact information
        SQL: select u.login, s.starred_at, u.name, u.company, u.email,
           u.html_url, u.twitter_username, u.blog, u.location, u.bio
        from github_stargazer as s, github_user as u
        where s.repository_full_name = 'turbot/steampipe' and s.user_login = u.login
        order by s.starred_at desc;`
      ],
      [{ id: 2 }, { id: 1 }, { id: 3 }],
      embeddings
    );

    // save the index so we don't have to rebuild it next time
    await store.save("index");
    console.log("saved");
    return store;
  });
}

const vectorStore = await getVectorStore();

const response = await prompts({
  type: 'text',
  name: 'request',
  message: emoji.emojify(':dog: Woof do you want?')
});

const request = response.request;
// const request = "List the stargazers of repository simoncollins/skia-canvaskit-vite, just the login and the time they starred it, most recent first";

const similarQueries = await vectorStore.similaritySearch(request, 2);

// join the pageContent with the similar queries
const context = similarQueries.map((d) => d.pageContent)
  .reduce((acc, d) => `${acc}\n\n${d}`, "").trim();

// console.log("context:", context);

const model = new OpenAI({ temperature: 0.9 });

const template = new PromptTemplate({
  template:
    `Create an appropriate steampipe SQL query given the following examples:
    
    {context}
    
    Request: {request}
    SQL:`,
  inputVariables: ["context", "request"],
});

const prompt = template.format({
  context,
  request
});

// console.log(prompt);

const sql = await model.call(prompt);

console.log("SQL:\n", sql);

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});
await client.connect();

const result = await client.query(sql)

// create a table with the results whose columns are the keys of the first row
const data = [Object.keys(result.rows[0]), ...result.rows.map(Object.values)];

console.log(table(data));

await client.end()