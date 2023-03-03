#!/usr/bin/env npx ts-node --esm

import * as dotenv from 'dotenv'
dotenv.config()
//
// import { PromptTemplate } from "langchain/prompts";
// import { OpenAI } from "langchain";
//
// const model = new OpenAI({ temperature: 0.9 });
//
// const template = new PromptTemplate({
//   template: "What is a good name for a company that makes {product}?",
//   inputVariables: ["product"],
// });
//
// const prompt = template.format({ product: "colorful shoes" });
//
// const res = await model.call(prompt);
//
// console.log(res);

import pkg from 'pg';
const { Client } = pkg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});
await client.connect();

const res = await client.query(`
select
  user_login,
  starred_at
from
  github_stargazer
where
  repository_full_name = 'simoncollins/skia-canvaskit-vite'
order by
  starred_at desc;
`)
console.log(res.rows)
await client.end()