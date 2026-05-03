import type { Release } from '../lib/github.server'
import { Box, Button, ClientOnly, Container, Heading, HStack, Icon, Skeleton, Text, VStack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { FaBox, FaMoon, FaSun } from 'react-icons/fa'
import { useFetcher } from 'react-router'
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
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setColorMode(isDark ? 'dark' : 'light')
  }, [])

  const toggleColorMode = () => {
    const isDark = document.documentElement.classList.contains('dark')
    if (isDark) {
      document.documentElement.classList.remove('dark')
      document.documentElement.style.colorScheme = 'light'
      localStorage.setItem('release-tracker-color-mode', 'light')
      setColorMode('light')
    }
    else {
      document.documentElement.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
      localStorage.setItem('release-tracker-color-mode', 'dark')
      setColorMode('dark')
    }
  }

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
      setRepositories(null)
    }
  }, [fetcher.data])

  const isLoading = fetcher.state === 'submitting' || fetcher.state === 'loading'

  return (
    <Box minH="100vh" display="flex" flexDirection="column" bg="white" _dark={{ bg: 'gray.950' }}>
      {/* Header */}
      <Box bg="linear-gradient(to right, #2563eb, #1e40af)" color="white" py={[8, 12]} px={4} boxShadow="lg" _dark={{ bg: 'linear-gradient(to right, #1e3a5f, #1a2f4f)' }}>
        <Container maxW="4xl">
          <HStack justifyContent="space-between" width="100%" mb={4} gap={[2, 4]}>
            <HStack gap={3} flexWrap="wrap">
              <Icon as={FaBox} boxSize={[6, 8]} />
              <Heading as="h1" size={['lg', '2xl']}>
                Release Tracker
              </Heading>
            </HStack>
            <ClientOnly fallback={<Skeleton width="46px" height="36px" sm={{ width: '95px', height: '40px' }} bgColor="transparent" />}>
              <Button
                onClick={toggleColorMode}
                variant="ghost"
                color="gray"
                size={['sm', 'md']}
                display="flex"
                gap={2}
                whiteSpace="nowrap"
                flexShrink={0}
              >
                <Icon as={colorMode === 'dark' ? FaSun : FaMoon} />
                <Text display={['none', 'inline']}>{colorMode === 'dark' ? 'Light' : 'Dark'}</Text>
              </Button>
            </ClientOnly>
          </HStack>
          <VStack gap={2} alignItems="flex-start">
            <Text fontSize={['base', 'lg']} opacity={0.95}>
              Monitor latest releases from your favorite GitHub projects
            </Text>
          </VStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Box flex={1} py={[6, 8]} px={4}>
        <Container maxW={['100%', '4xl']} px={[2, 4]}>
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
              <ReleaseList repositories={repositories} />
            )}
          </VStack>
        </Container>
      </Box>

      {/* Footer */}
      <Box bg="gray.100" color="gray.700" textAlign="center" py={[4, 6]} borderTop="1px solid" borderColor="gray.300" mt={12} _dark={{ bg: 'gray.800', color: 'gray.300', borderColor: 'gray.700' }} fontSize={['xs', 'sm']}>
        <Text>Made with ❤️ by AI Agent based on Claude Haiku 4.5</Text>
      </Box>
    </Box>
  )
}
