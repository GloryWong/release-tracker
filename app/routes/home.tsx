import type { Release } from '../lib/github.server'
import { Box, Container, Heading, HStack, Icon, Text, VStack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { FaBox } from 'react-icons/fa'
import { useFetcher } from 'react-router'
import { ColorModeButton } from '~/components/ui/color-mode'
import { ReleaseList } from '../components/ReleaseList'
import { RepositoryForm } from '../components/RepositoryForm'

export function meta() {
  return [
    { title: 'Release Tracker - GitHub Release Info' },
    { name: 'description', content: 'Check latest release information for GitHub projects' },
  ]
}

interface RepositoryRelease {
  owner: string
  repo: string
  release: Release | null
  error?: string
  ownerAvatar?: string
}

// Session-level cache for already fetched releases
const sessionFetchCache = new Map<string, RepositoryRelease>()

export default function Home() {
  const fetcher = useFetcher<{ repositories?: RepositoryRelease[], alreadyFetched?: [], error?: string }>()
  const [repositories, setRepositories] = useState<RepositoryRelease[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const clearRepositories = () => setRepositories(null)

  useEffect(() => {
    if (fetcher.data?.repositories) {
      // Cache newly fetched releases in session cache
      for (const repo of fetcher.data.repositories) {
        const key = `${repo.owner}/${repo.repo}`
        if (repo.release || !repo.error) {
          sessionFetchCache.set(key, repo)
        }
      }

      // Push already fetched
      const { alreadyFetched } = fetcher.data
      const alreadyReleases: RepositoryRelease[] = []
      alreadyFetched?.forEach((v) => {
        const release = sessionFetchCache.get(v)
        if (release) {
          alreadyReleases.push(release)
        }
      })

      // Deduplicate repositories by owner+repo combination
      // Keep the first occurrence (GitHub takes priority over NPM)
      const seen = new Set<string>()
      const deduplicated = [...alreadyReleases, ...fetcher.data.repositories].filter((repo) => {
        const key = `${repo.owner}/${repo.repo}`
        if (seen.has(key)) {
          return false
        }
        seen.add(key)
        return true
      })

      setRepositories(deduplicated)
      setError(null)
      // Force a re-render to reset the form component
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    else if (fetcher.data?.error) {
      setError(fetcher.data.error)
      clearRepositories()
    }
  }, [fetcher.data])

  const isLoading = fetcher.state === 'submitting' || fetcher.state === 'loading'

  return (
    <Box minH="100vh" display="flex" flexDirection="column" bg="white" _dark={{ bg: 'gray.950' }}>
      {/* Header */}
      <Box bg="linear-gradient(to right, #2563eb, #1e40af)" color="white" py={[8, 12]} boxShadow="lg" _dark={{ bg: 'linear-gradient(to right, #1e3a5f, #1a2f4f)' }}>
        <Container>
          <HStack justifyContent="space-between" alignItems="center" width="100%" mb={4} gap={[2, 4]}>
            <HStack gap={3} flexWrap="wrap">
              <Icon as={FaBox} boxSize={[6, 8]} />
              <Heading as="h1" size={['lg', '2xl']}>
                Release Tracker
              </Heading>
            </HStack>
          </HStack>
          <VStack gap={2} alignItems="flex-start">
            <Text fontSize={['base', 'lg']} opacity={0.95}>
              Monitor latest releases from your favorite GitHub projects
            </Text>
          </VStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Box flex={1} py={[6, 8]}>
        <Container>
          <VStack gap={[6, 8, 10]} alignItems="stretch">
            <fetcher.Form method="post" action="/api/fetch-releases">
              <RepositoryForm isLoading={isLoading} sessionCache={sessionFetchCache} />
            </fetcher.Form>

            {error && (
              <Box bg="red.50" border="1px solid" borderColor="red.200" p={[3, 4]} borderRadius="md" color="red.800" fontSize={['sm', 'base']}>
                {error}
              </Box>
            )}

            {repositories && (
              <ReleaseList repositories={repositories} clearRepositories={clearRepositories} />
            )}
          </VStack>
        </Container>
      </Box>

      {/* Footer */}
      <Box color="fg.subtle" py={[2, 4]} borderTop="1px solid" borderColor="border" mt={12} fontSize={['xs', 'sm']}>
        <Container>
          <HStack justifyContent="space-between" alignContent="center">
            <Text>Made with ❤️ by AI Agent</Text>
            <ColorModeButton />
          </HStack>
        </Container>
      </Box>
    </Box>
  )
}
