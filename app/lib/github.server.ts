import type { Octokit } from 'octokit'
import type { AsyncReturnType } from 'type-fest'
import { getCached, setCache } from '~/utils/cache'
import { extractGithub } from '~/utils/extractGithub'
import { octokit } from './octokit.server'

export type Release = AsyncReturnType<Octokit['rest']['repos']['getLatestRelease']>['data']

export interface NPMRelease {
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

export interface Repository {
  owner: string
  repo: string
  releases?: Release[]
  error?: string
}

export interface OwnerInfo {
  login: string
  avatar_url: string
}

const NPM_API_HOST = 'https://registry.npmjs.org'

export async function getLatestRelease(
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

export async function searchRepositories(query: string, limit: number = 10): Promise<Array<{ owner: string, repo: string, description: string, url: string, ownerAvatar: string }> | null> {
  const cacheKey = `search-github:${query}:${limit}`
  const cached = getCached(cacheKey)
  if (cached !== null) {
    return cached
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

export async function getOwnerInfo(owner: string): Promise<OwnerInfo | null> {
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

export async function fetchNPMPackage(packageName: string): Promise<{
  owner: string
  repo: string
  packageName: string
  description: string
  url: string
  ownerAvatar: string
} | null> {
  const cacheKey = `npm-package:${packageName}`
  const cached = getCached(cacheKey)
  if (cached !== null) {
    return cached
  }

  try {
    const response = await fetch(
      `${NPM_API_HOST}/-/v1/search?text=${encodeURIComponent(packageName)}&size=1`,
      { cache: 'no-store' },
    )

    if (!response.ok) {
      return null
    }

    const data: { objects: any[] } = await response.json()
    const item = data.objects.at(0)

    if (!item || item.package.name !== packageName) {
      setCache(cacheKey, null)
      return null
    }

    let owner = 'npm'
    let repo = packageName
    let ownerAvatar = 'https://www.gravatar.com/avatar/npm?d=identicon'
    let url = item.package.links?.npm || `https://www.npmjs.com/package/${packageName}`

    // Try to get GitHub info from the package
    try {
      const github = extractGithub(packageName, item.package.links)
      if (github) {
        url = github.url
        owner = github.owner
        repo = github.repo
        // Get GitHub owner avatar
        const ownerInfo = await getOwnerInfo(github.owner)
        if (ownerInfo) {
          ownerAvatar = ownerInfo.avatar_url
        }
      }
    }
    catch {
      // If parsing fails, fallback to npm package name
    }

    const result = {
      owner,
      repo,
      packageName,
      description: item.package.description || '',
      url,
      ownerAvatar,
    }

    setCache(cacheKey, result)
    return result
  }
  catch (error) {
    console.error(`Error searching NPM packages for "${packageName}":`, error)
    return null
  }
}

export async function searchNPMPackages(query: string, limit: number = 10): Promise<Array<{ owner: string, repo: string, packageName: string, description: string, url: string, ownerAvatar: string }> | null> {
  const cacheKey = `search-npm:${query}:${limit}`
  const cached = getCached(cacheKey)
  if (cached !== null) {
    return cached
  }

  try {
    const response = await fetch(
      `${NPM_API_HOST}/-/v1/search?text=${encodeURIComponent(query)}&size=${limit}`,
      { cache: 'no-store' },
    )

    if (!response.ok) {
      return null
    }

    const data: { objects: [] } = await response.json()
    const results: any[] = []

    const promises = data.objects.map(async (item: any): Promise<{
      owner: string
      repo: string
      packageName: string
      description: string
      url: string
      ownerAvatar: string
    }> => {
      const packageName = item.package.name
      let owner = 'npm'
      let repo = packageName
      let ownerAvatar = 'https://www.gravatar.com/avatar/npm?d=identicon'
      let url = item.package.links?.npm || `https://www.npmjs.com/package/${packageName}`

      // Try to get GitHub info from the package
      try {
        const github = extractGithub(packageName, item.package.links)
        if (github) {
          url = github.url
          owner = github.owner
          repo = github.repo
          // Get GitHub owner avatar
          const ownerInfo = await getOwnerInfo(github.owner)
          if (ownerInfo) {
            ownerAvatar = ownerInfo.avatar_url
          }
        }
      }
      catch {
        // If parsing fails, fallback to npm package name
      }

      return {
        owner,
        repo,
        packageName,
        description: item.package.description || '',
        url,
        ownerAvatar,
      }
    })

    ;(await Promise.allSettled(promises)).forEach((v) => {
      if (v.status === 'fulfilled') {
        results.push(v.value)
      }
    })

    setCache(cacheKey, results)
    return results
  }
  catch (error) {
    console.error(`Error searching NPM packages for "${query}":`, error)
    return null
  }
}
