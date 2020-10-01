require('dotenv').config()
const fetch = require('node-fetch');
const token = process.env.GITHUB_TOKEN
const apiUrl = process.env.GITHUB_GRAPHQL_URL

const defaultConfig = {
  followersCount: true,
  issuesCount: true,
  pullRequestCount: true,
  contributionCount: true,
  currentYearContributionCount: true,
  repositoryCount: true,
  countPrivate: true,
  repositoryContributedCount: true,
  languageCount: true,
}

const config = {
  followersCount: true,
  issuesCount: true,
  pullRequestCount: true,
  contributionCount: true,
  currentYearContributionCount: true,
  repositoryCount: true,
  includePrivate: true,
  repositoryContributedCount: true,
  languageCount: true,
}


let data = {

}

const githubQuery = async (query) => fetch(apiUrl, {
  method: 'POST',
  headers: {
    Authorization: `bearer ${token}`
  },
  body: JSON.stringify({
    query
  })
})


const statsQuery = `
{
  viewer {
    repositories(isFork: false) {
      totalCount
    }
    pullRequests {
      totalCount
    }
    issues {
      totalCount
    }
    followers {
      totalCount
    }
    contributionsCollection {
      contributionYears
    }
    repositoriesContributedTo${config.includePrivate ? '(privacy: PUBLIC)' : ''} {
      totalCount
    }
  }
}
`
githubQuery(
  statsQuery
).then(res => res.json())
  .then(res => data = res.data.viewer || res.data.viewer)
  .then(console.log)
  .then(() => console.log(data))
  .catch(console.error)
