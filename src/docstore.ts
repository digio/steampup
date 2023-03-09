import { OpenAIEmbeddings } from "langchain/embeddings";
import { HNSWLib } from "langchain/vectorstores";

// returns a new vector store if no saved one found or the saved one if it exists
export async function getDocStore() {
  const embeddings = new OpenAIEmbeddings();
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