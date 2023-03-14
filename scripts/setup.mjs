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

import emoji from 'node-emoji';
import prompts from 'prompts';
import { $ } from 'zx';
import ora from "ora";

$.verbose = false

// start Steampipe
let spinner = ora(emoji.emojify(':dog: Starting Steampipe')).start();
try {
  await $`docker-compose up -d`
  spinner.succeed(emoji.emojify(':dog: Steampipe started'));
} catch (e) {
  spinner.fail(emoji.emojify(':dog: Failed to start Steampipe'));
  throw e
}

// grab connection details
const details = await $`docker-compose exec --no-TTY steampipe steampipe service status --show-password`

// parse postgres connection string
const connectionString = /(postgres:\/\/steampipe.*)\n/.exec(details.stdout)[1]

// install the Steampipe github plugin
spinner = ora(emoji.emojify(':dog: Installing GitHub plugin')).start();
try {
  await $`docker-compose exec steampipe steampipe plugin install github`
  spinner.succeed(emoji.emojify(':dog: GitHub plugin installed'));
} catch (e) {
  spinner.fail(emoji.emojify(':dog: Failed to install GitHub plugin'));
  throw e
}

// prompt for github token
const response = await prompts(
  [
    {
      type: 'text',
      name: 'openaiApiKey',
      message: emoji.emojify(':dog: What is your Open AI API key?')
    },
    {
      type: 'text',
      name: 'githubToken',
      message: emoji.emojify(':dog: What is your GitHub token?')
    }
  ]
);

const githubConfig =
`connection "github" {
   plugin = "github"
   token = "${response.githubToken}"
}
`

await fs.outputFile(`${path.join(os.homedir(), 'sp/config/github.spc')}`, githubConfig)

const envConfig =
`DATABASE_URL="${connectionString}"
OPENAI_API_KEY="${response.openaiApiKey}"
`

await fs.outputFile(`${path.join(process.cwd(), '.env')}`, envConfig)

console.log(emoji.emojify(':dog: Setup complete! Run `npm run steampup` to get started!'))

