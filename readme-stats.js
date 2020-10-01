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
  includePrivate: false,
  repositoryContributedCount: true,
  languageCount: true,
}


let data = {

}

/**
 * Github Graphql query helper
 */
const githubQuery = async (query) => fetch(apiUrl, {
  method: 'POST',
  headers: {
    Authorization: `bearer ${token}`
  },
  body: JSON.stringify({
    query
  })
})

/**
 * Github REST API query helper
 */
const githubAPIQuery = async (query) => fetch(query, {
  method: 'GET',
  headers: {
    Authorization: `bearer ${token}`
  }
})



const statsQuery = `
{
  viewer {
    repositories(isFork: false,${config.includePrivate ? '' : 'privacy: PUBLIC'}) {
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
    repositoriesContributedTo${config.includePrivate ? '' : '(privacy: PUBLIC)'} {
      totalCount
    }
  }
}
`

const contributionPerYearQuery = year => `
year${year}: contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${year}-12-31T23:59:59Z") {
  contributionCalendar {
    totalContributions
  }
}
`

const extractCountStats = (res) => {
  const data = res.data.viewer;
  return {
    repositoryCount: data.repositories.totalCount,
    contributionCount: data.repositoriesContributedTo.totalCount,
    contributionYears: data.contributionsCollection.contributionYears,
    followersCount: data.followers.totalCount,
    issuesCount: data.issues.totalCount,
    pullRequestsCount: data.pullRequests.totalCount,
  }
}


const fetchCompoundStats = (countStats) => {
  let queryArray = []
  queryArray = queryArray.concat(countStats.contributionYears.map(contributionPerYearQuery))

  queryArray = queryArray.concat(countStats.contributionYears.map(contributionPerYearQuery))

  const query = `
  {
    viewer {
      ${queryArray.join('\n')}
    }
  }
  `
  return githubQuery(query).then(res => res.json()).then(res => res.data.viewer)

}


githubQuery(
  statsQuery
).then(res => res.json())
  .then(extractCountStats)
  .then(fetchCompoundStats)
  .then(console.log)
  .catch(console.error)
