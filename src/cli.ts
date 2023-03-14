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

import prompts from 'prompts';
import emoji from 'node-emoji';
import { connectToSteampipe, disconnectFromSteampipe, executeQuery } from "./steampipe";
import ora from "ora";
import { callModel } from "./model";
import { table } from "table";

export async function getRequest() {
  const response = await prompts({
    type: 'text',
    name: 'request',
    message: emoji.emojify(':dog: Woof do you want?')
  });

  return response.request;
}

function sanitize(str: string) {
  return str.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
}

// wrap text in string to given max width on word boundaries
function wrapText(text: string, maxWidth: number) {
  const words = text.split(' ');
  let lines = [];
  let currentLine = '';
  for (const word of words) {
    if (currentLine.length + word.length > maxWidth) {
      lines.push(currentLine);
      currentLine = '';
    }
    currentLine += word + ' ';
  }
  lines.push(currentLine);
  return lines.join('\n');
}

// build a table with error details given an error message, the request and the sql
function errorTable(error: string, request: string, sql: string) {
  const maxWidth = 80;
  const data = [
    ['Error', wrapText(sanitize(error), maxWidth)],
    ['Request', wrapText(sanitize(request), maxWidth)],
    ['SQL', wrapText(sanitize(sql), maxWidth)]
  ];
  return table(data);
}

export async function runLoop() {
  await connectToSteampipe();

  while (true) {
    const request = await getRequest();
    if(!request || request === '' || request.trim() === 'exit') {
      break;
    }

    const spinner = ora(emoji.emojify(':dog: Sniffing out the answer')).start();
    const sql = await callModel(request);
    try {
      const tableData = await executeQuery(sql);

      spinner.succeed(emoji.emojify(':dog: Done!'));

      console.log(table(tableData));
    } catch (e) {
      spinner.fail(emoji.emojify(':dog: Ruh roh! Something went wrong.'));
      console.log(errorTable(e.message, request, sql));
    }
  }

  await disconnectFromSteampipe();
}