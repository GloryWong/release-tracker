import type { Octokit } from 'octokit'
import type { AsyncReturnType } from 'type-fest'
import { getCached, setCache } from '~/utils/cache'
import { octokit } from './octokit.server'

type Release = AsyncReturnType<Octokit['rest']['repos']['getLatestRelease']>['data']

interface NPMRelease {
  version: string
  name: string
  description: string
  published_at: string
  html_url: string
  author?: {
    login?: string
    avatar_url?: string
  }
}

interface Repository {
  owner: string
  repo: string
  releases?: Release[]
  error?: string
}

interface OwnerInfo {
  login: string
  avatar_url: string
}

async function getLatestRelease(
  owner: string,
  repo: string,
): Promise<Release | null> {
  const cacheKey = `release:${owner}/${repo}`
  const cached = getCached(cacheKey)
  if (cached !== null) {
    return cached
  }

  try {
    const response = await octokit.rest.repos.getLatestRelease({
      owner,
      repo,
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (response.status !== 200) {
      return null
    }

    const release = response.data
    setCache(cacheKey, release)
    return release
  }
  catch (error) {
    console.error(`Error fetching latest release for ${owner}/${repo}:`, error)
    return null
  }
}

async function validateRepository(
  owner: string,
  repo: string,
): Promise<boolean> {
  const cacheKey = `repo-valid:${owner}/${repo}`
  const cached = getCached(cacheKey)
  if (cached !== null) {
    return cached
  }

  try {
    const response = await octokit.rest.repos.get({
      owner,
      repo,
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    })

    const isValid = response.status === 200
    setCache(cacheKey, isValid)
    return isValid
  }
  catch {
    return false
  }
}

async function searchRepositories(query: string, limit: number = 10): Promise<Array<{ owner: string, repo: string, description: string, url: string, ownerAvatar: string }> | null> {
  const cacheKey = `search-github:${query}:${limit}`
  const cached = getCached(cacheKey)
  if (cached !== null) {
    return cached
  }

  const token = process.env.GITHUB_TOKEN
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  }

  if (token) {
    headers.Authorization = `token ${token}`
  }

  try {
    const response = await octokit.rest.search.repos({
      q: query,
      sort: 'stars',
      per_page: limit,
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (response.status !== 200) {
      return null
    }

    const data = response.data
    const results = data.items.map(item => ({
      owner: item.owner?.login ?? 'Unknown',
      repo: item.name,
      description: item.description || '',
      url: item.html_url,
      ownerAvatar: item.owner?.avatar_url ?? 'https://www.gravatar.com/avatar/npm?d=identicon',
    }))
    setCache(cacheKey, results)
    return results
  }
  catch (error) {
    console.error(`Error searching repositories for "${query}":`, error)
    return null
  }
}

async function getOwnerInfo(owner: string): Promise<OwnerInfo | null> {
  const cacheKey = `owner-info:${owner}`
  const cached = getCached(cacheKey)
  if (cached !== null) {
    return cached
  }

  const token = process.env.GITHUB_TOKEN
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  }

  if (token) {
    headers.Authorization = `token ${token}`
  }

  try {
    const response = await octokit.rest.users.getByUsername({
      username: owner,
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (response.status !== 200) {
      return null
    }

    const data = response.data
    const ownerInfo = {
      login: data.login,
      avatar_url: data.avatar_url,
    }
    setCache(cacheKey, ownerInfo)
    return ownerInfo
  }
  catch (error) {
    console.error(`Error fetching owner info for ${owner}:`, error)
    return null
  }
}

async function getGithubURLFromNPM(packageName: string): Promise<string | null> {
  const cacheKey = `npm-github-url:${packageName}`
  const cached = getCached(cacheKey)
  if (cached !== null) {
    return cached
  }

  try {
    const response = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(packageName)}`,
      { cache: 'no-store' },
    )

    if (!response.ok) {
      return null
    }

    const data: any = await response.json()

    // Look for repository URL in different places
    let repoUrl: string | undefined

    if (data.repository) {
      if (typeof data.repository === 'string') {
        repoUrl = data.repository
      }
      else if (data.repository.url) {
        repoUrl = data.repository.url
      }
    }

    if (!repoUrl && data.homepage) {
      repoUrl = data.homepage
    }

    if (repoUrl) {
      // Clean up common GitHub URL formats
      repoUrl = repoUrl.replace('git+https://github.com/', 'https://github.com/')
      repoUrl = repoUrl.replace('git+ssh://git@github.com/', 'https://github.com/')
      repoUrl = repoUrl.replace('git://github.com/', 'https://github.com/')
      repoUrl = repoUrl.replace(/\.git$/, '')
      repoUrl = repoUrl.replace(/\/$/, '')

      // Check if it's a GitHub URL
      if (repoUrl.includes('github.com')) {
        setCache(cacheKey, repoUrl)
        return repoUrl
      }
    }

    setCache(cacheKey, null)
    return null
  }
  catch (error) {
    console.error(`Error fetching GitHub URL for NPM package ${packageName}:`, error)
    return null
  }
}

async function getLatestNPMRelease(packageName: string): Promise<NPMRelease | null> {
  const cacheKey = `npm-release:${packageName}`
  const cached = getCached(cacheKey)
  if (cached !== null) {
    return cached
  }

  try {
    const response = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`,
      { cache: 'no-store' },
    )

    if (!response.ok) {
      return null
    }

    const data: any = await response.json()

    // Extract author info from npm package
    let author: any
    if (data.author) {
      author = {
        login: data.author.name || 'npm',
        avatar_url: `https://www.gravatar.com/avatar/${data.author.email || ''}?d=identicon`,
      }
    }
    else if (data.maintainers && data.maintainers.length > 0) {
      const maintainer = data.maintainers[0]
      author = {
        login: maintainer.name || 'npm',
        avatar_url: `https://www.gravatar.com/avatar/${maintainer.email || ''}?d=identicon`,
      }
    }

    const release = {
      version: data.version,
      name: data.name,
      description: data.description || '',
      published_at: data.time?.modified || new Date().toISOString(),
      html_url: `https://www.npmjs.com/package/${encodeURIComponent(packageName)}`,
      author,
    }
    setCache(cacheKey, release)
    return release
  }
  catch (error) {
    console.error(`Error fetching latest NPM release for ${packageName}:`, error)
    return null
  }
}

async function validateNPMPackage(packageName: string): Promise<boolean> {
  const cacheKey = `npm-valid:${packageName}`
  const cached = getCached(cacheKey)
  if (cached !== null) {
    return cached
  }

  try {
    const response = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(packageName)}`,
      { cache: 'no-store' },
    )

    const isValid = response.ok
    setCache(cacheKey, isValid)
    return isValid
  }
  catch {
    return false
  }
}

async function searchNPMPackages(query: string, limit: number = 10): Promise<Array<{ owner: string, repo: string, packageName: string, description: string, url: string, ownerAvatar: string }> | null> {
  const cacheKey = `search-npm:${query}:${limit}`
  const cached = getCached(cacheKey)
  if (cached !== null) {
    return cached
  }

  try {
    const response = await fetch(
      `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=${limit}`,
      { cache: 'no-store' },
    )

    if (!response.ok) {
      return null
    }

    const data: any = await response.json()
    const results = []

    for (const item of data.objects) {
      const packageName = item.package.name
      let owner = 'npm'
      let repo = packageName
      let ownerAvatar = 'https://www.gravatar.com/avatar/npm?d=identicon'

      // Try to get GitHub info from the package
      const githubUrl = await getGithubURLFromNPM(packageName)
      if (githubUrl) {
        try {
          const urlParts = githubUrl.replace('https://github.com/', '').split('/')
          const ghOwner = urlParts[0]
          const ghRepo = urlParts[1]

          if (ghOwner && ghRepo) {
            owner = ghOwner
            repo = ghRepo
            // Get GitHub owner avatar
            const ownerInfo = await getOwnerInfo(ghOwner)
            if (ownerInfo) {
              ownerAvatar = ownerInfo.avatar_url
            }
          }
        }
        catch {
          // If parsing fails, fallback to npm package name
        }
      }

      results.push({
        owner,
        repo,
        packageName,
        description: item.package.description || '',
        url: item.package.links?.npm || `https://www.npmjs.com/package/${packageName}`,
        ownerAvatar,
      })
    }

    setCache(cacheKey, results)
    return results
  }
  catch (error) {
    console.error(`Error searching NPM packages for "${query}":`, error)
    return null
  }
}

export { getGithubURLFromNPM, getLatestNPMRelease, getLatestRelease, getOwnerInfo, searchNPMPackages, searchRepositories, validateNPMPackage, validateRepository }
export type { NPMRelease, OwnerInfo, Release, Repository }
