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