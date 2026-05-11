import { getCached, setCache } from './cache'

export function extractGithub(packageName: string, links: Record<string, string>): {
  url: string
  owner: string
  repo: string
} | null {
  const cacheKey = `npm-github:${packageName}`
  const cached = getCached(cacheKey)
  if (cached !== null) {
    return cached
  }

  try {
    // Look for repository URL in different places
    let repoUrl: string | undefined

    if (links.repository && typeof links.repository === 'string') {
      repoUrl = links.repository
    }

    if (!repoUrl && links.homepage) {
      repoUrl = links.homepage
    }

    if (repoUrl) {
      // Clean up common GitHub URL formats
      repoUrl = repoUrl.replace('git+https://github.com/', 'https://github.com/')
      repoUrl = repoUrl.replace('git+ssh://git@github.com/', 'https://github.com/')
      repoUrl = repoUrl.replace('git://github.com/', 'https://github.com/')
      repoUrl = repoUrl.replace(/\.git$/, '')
      repoUrl = repoUrl.replace(/#.*$/, '')
      repoUrl = repoUrl.replace(/\/$/, '')

      // Check if it's a GitHub URL
      if (repoUrl.includes('github.com')) {
        const urlParts = repoUrl.replace('https://github.com/', '').split('/')
        const ghOwner = urlParts[0]
        const ghRepo = urlParts[1]
        if (ghOwner && ghRepo) {
          const result = {
            url: repoUrl,
            owner: ghOwner,
            repo: ghRepo,
          }
          setCache(cacheKey, result)
          return result
        }
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
