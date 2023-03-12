import emoji from 'node-emoji';
import prompts from 'prompts';
import { $ } from 'zx';

$.verbose = false

// start Steampipe
await $`docker-compose up -d`

// grab connection details
const details = await $`docker-compose exec steampipe steampipe service status --show-password`

// parse postgres connection string
const connectionString = /postgres:\/\/steampipe.*\/steampipe/.exec(details.stdout)[0]

// install the Steampipe github plugin
await $`docker-compose exec steampipe steampipe plugin install github`

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
   options = {
     token = "${response.githubToken}"
   }
}
`

await fs.outputFile(`${path.join(os.homedir(), 'sp/config/github.spck')}`, githubConfig)

const envConfig =
`DATABASE_URL="${connectionString}"
OPENAI_API_KEY="${response.openaiApiKey}"
`

await fs.outputFile(`${path.join(process.cwd(), '.envk')}`, envConfig)

