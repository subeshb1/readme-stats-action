const fetch = require('node-fetch');

require('dotenv').config()

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


const token = process.env.GITHUB_TOKEN
const apiUrl = process.env.GITHUB_TOKEN
const githubQuery = async (query) => fetch('https://api.github.com/graphql', {
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
  .then(JSON.stringify).then(res => data = res || res)
  .then(console.log)
  .then(() => console.log(data))
  .catch(console.error)
