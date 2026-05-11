import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { fetchNPMPackage, getLatestRelease, searchNPMPackages, searchRepositories } from '../lib/github.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const pathname = url.pathname
  const query = url.searchParams.get('q')

  // GitHub search
  if (pathname === '/api/search-github' && query) {
    try {
      if (query.length < 2)
        return { suggestions: [] }
      const results = await searchRepositories(query, 10)
      return { suggestions: results || [] }
    }
    catch (error) {
      console.error('Error searching GitHub:', error)
      return { suggestions: [] }
    }
  }

  // NPM search
  if (pathname === '/api/search-npm' && query) {
    try {
      if (query.length < 1)
        return { suggestions: [] }
      const results = await searchNPMPackages(query, 10)
      return { suggestions: results || [] }
    }
    catch (error) {
      console.error('Error searching NPM:', error)
      return { suggestions: [] }
    }
  }

  return { error: 'Not found' }
}

export async function action({ request }: ActionFunctionArgs): Promise<{
  repositoryReleases: any[]
  alreadyFetched: any[]
  error?: string
}> {
  const _alreadyFetched: any[] = []

  if (request.method !== 'POST') {
    return { error: 'Method not allowed', repositoryReleases: [], alreadyFetched: _alreadyFetched }
  }

  const formData = await request.formData()
  const repositoriesStr = formData.get('repositories') as string
  const alreadyFetchedStr = formData.get('alreadyFetched') as string

  if (!repositoriesStr || repositoriesStr.trim().length === 0) {
    return { error: 'Please add at least one repository', repositoryReleases: [], alreadyFetched: _alreadyFetched }
  }

  // Parse already fetched repos from session cache
  const alreadyFetched = new Set<string>()
  if (alreadyFetchedStr && alreadyFetchedStr.trim().length > 0) {
    alreadyFetchedStr.split(',').forEach((item) => {
      const trimmed = item.trim()
      if (trimmed)
        alreadyFetched.add(trimmed)
    })
  }

  const items = repositoriesStr
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0)

  if (items.length === 0) {
    return { error: 'Invalid format. Use owner/repo for GitHub or package-name for NPM', repositoryReleases: [], alreadyFetched: _alreadyFetched }
  }

  const promiseSettledResult = await Promise.allSettled(items.map(async (item): Promise<{
    owner: string
    repo: string
    release: any
    error?: string
    ownerAvatar?: string
    source?: string
    npmPackageName?: string
  } | undefined> => {
    // Check if it's a scoped npm package (@scope/name) or a GitHub repo (owner/repo)
    const isScoped = item.startsWith('@')

    if (item.includes('/') && !isScoped) {
      // GitHub repository format: owner/repo
      const [owner, repo] = item.split('/').map(s => s.trim())
      const repoKey = `${owner}/${repo}`

      if (!owner || !repo) {
        return {
          owner: item,
          repo: '',
          release: null,
          error: 'Invalid GitHub repository format. Use owner/repo',
        }
      }

      // Skip if already fetched
      if (alreadyFetched.has(repoKey)) {
        _alreadyFetched.push(repoKey)
        return
      }

      const release = await getLatestRelease(owner, repo)
      return {
        owner,
        repo,
        release,
        error: !release ? 'No releases found' : undefined,
        ownerAvatar: release?.author.avatar_url,
        source: 'github',
      }
    }
    else {
      // NPM package format: package-name or @scope/name
      const packageName = item.trim()
      const npmPackage = await fetchNPMPackage(packageName)
      if (!npmPackage) {
        return {
          owner: 'npm',
          repo: packageName,
          release: null,
          error: `Package not found on npm`,
          source: 'npm',
        }
      }

      try {
        const gitHubOwner = npmPackage.owner
        const gitHubRepo = npmPackage.repo
        const repoKey = `${gitHubOwner}/${gitHubRepo}`

        // Skip if already fetched
        if (alreadyFetched.has(repoKey)) {
          _alreadyFetched.push(repoKey)
          return
        }

        const release = await getLatestRelease(gitHubOwner, gitHubRepo)
        return {
          owner: gitHubOwner,
          repo: gitHubRepo,
          release,
          error: !release ? 'No releases found' : undefined,
          ownerAvatar: release?.author.avatar_url,
          source: 'github',
          npmPackageName: packageName,
        }
      }
      catch (error) {
        console.error(`Error parsing GitHub URL for NPM package ${packageName}:`, error)
      }
    }
  }))

  const results: any[] = []
  promiseSettledResult.forEach((v) => {
    if (v.status === 'fulfilled' && v.value !== undefined) {
      results.push(v.value)
    }
  })

  return { repositoryReleases: results, alreadyFetched: _alreadyFetched }
}
