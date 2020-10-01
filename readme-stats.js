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


const extractGraphqlJson = res => {
  return res.json().then(res => {
    if (res.errors && res.errors.length) {
      throw res
    }
    return res
  })
}

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
    repoContributedCount: data.repositoriesContributedTo.totalCount,
    contributionYears: data.contributionsCollection.contributionYears,
    followersCount: data.followers.totalCount,
    issuesCount: data.issues.totalCount,
    pullRequestsCount: data.pullRequests.totalCount,
    firstContribution: data.contributionsCollection.contributionYears.slice(-1)[0]
  }
}

const fetchContributionPerYear = (yearArray) => {
  let queryArray = []
  queryArray = queryArray.concat(yearArray.map(contributionPerYearQuery))
  const query = `
  {
    viewer {
      ${queryArray.join('\n')}
    }
  }
  `
  return githubQuery(query).then(extractGraphqlJson).then(res => res.data.viewer)
}


const fetchRepoLanguage = (externalRepo = false) => {
  const schemaKey = externalRepo ? 'repositoriesContributedTo' : 'repositories';
  const forkKey = externalRepo ? '' : 'isFork: false,';
  let repoLanguages = [];
  let hasNext = null
  let cursor
  function fetchPerPage() {
    if (hasNext === false) {
      return true
    }
    const query = `
    {
      viewer {
        ${schemaKey}(${forkKey} ${config.includePrivate ? '' : 'privacy: PUBLIC'}, first: 100 ${hasNext ? `,after: "${cursor}"` : ''}) {
          pageInfo{
            endCursor
            hasNextPage
          }
          nodes {
            name
            languages(first: 100) {
              nodes {
                name
              }
            }
          }
        }
      }
    }
    `
    return githubQuery(query)
      .then(extractGraphqlJson)
      .then(res => console.log(res) || res)
      .then(res => res.data.viewer)
      .then(data => {
        cursor = data[schemaKey].pageInfo.endCursor
        hasNext = data[schemaKey].pageInfo.hasNextPage
        repoLanguages = repoLanguages.concat(data[schemaKey].nodes.languages)
        return fetchPerPage()
      });
  }

  return fetchPerPage().then(() => repoLanguages)

}
const fetchCompoundStats = (countStats) => {
  return Promise.all([
    fetchContributionPerYear(countStats.contributionYears),
    fetchRepoLanguage(),
    fetchRepoLanguage(true)
  ])
    .then(responses => {
      return responses[0]
    })
}


githubQuery(
  statsQuery
).then(extractGraphqlJson)
  .then(extractCountStats)
  .then(fetchCompoundStats)
  .then(console.log)
  .catch(console.error)
