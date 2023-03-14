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

import { OpenAI } from "langchain";
import { PromptTemplate } from "langchain/prompts";
import { getDocStore } from "./docstore";

let docStore = await getDocStore();

async function buildPrompt(request: string) {
  const similarQueries = await docStore.similaritySearch(request, 2);

  const context = similarQueries.map((d) => d.pageContent)
    .reduce((acc, d) => `${acc}\n\n${d}`, "").trim();

  const template = new PromptTemplate({
    template:
      `Create an appropriate PostgreSQL SQL query given the following examples, using
      only English language in the SQL query:
    
    {context}
    
    Request: {request}
    SQL:`,
    inputVariables: ["context", "request"],
  });

  return template.format({
    context,
    request
  });
}

export async function callModel(request: string) {
  const model = new OpenAI({ temperature: 0.9 });
  const prompt = await buildPrompt(request);
  return await model.call(prompt);
}