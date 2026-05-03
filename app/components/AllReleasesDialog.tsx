import type { Release } from '../lib/github.server'
import {
  Box,
  Button,
  Heading,
  HStack,
  Icon,
  Image,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FaTimes } from 'react-icons/fa'
import { ExternalLink } from './ExternalLink'
import { ReleaseCard } from './ReleaseCard'

interface AllReleasesDialogProps {
  owner: string
  repo: string
  ownerAvatar?: string
  isOpen: boolean
  onClose: () => void
}

export function AllReleasesDialog({ owner, repo, isOpen, ownerAvatar, onClose }: AllReleasesDialogProps) {
  const [releases, setReleases] = useState<Release[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const observerTargetRef = useRef<HTMLDivElement>(null)

  const repoUrl = `https://github.com/${owner}/${repo}`

  // Fetch releases using client-side fetch with token support
  const fetchReleases = useCallback(async (pageNum: number) => {
    if (isLoading || !hasMore)
      return

    setIsLoading(true)
    setError(null)

    try {
      // Try to get token from environment via a hidden API endpoint
      const headers: HeadersInit = {
        Accept: 'application/vnd.github.v3+json',
      }

      // Try fetching with authentication if available
      try {
        const authResponse = await fetch('/api/github-token', { method: 'GET' })
        if (authResponse.ok) {
          const { token } = await authResponse.json()
          if (token) {
            headers.Authorization = `token ${token}`
          }
        }
      }
      catch {
        // Token endpoint not available, continue without auth
      }

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/releases?per_page=10&page=${pageNum}`,
        { headers, cache: 'no-store' },
      )

      if (!response.ok) {
        throw new Error('Failed to fetch releases')
      }

      const data: Release[] = await response.json()

      if (data.length === 0) {
        setHasMore(false)
      }
      else {
        setReleases(prev => [...prev, ...data])
        setPage(pageNum + 1)
      }
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setHasMore(false)
    }
    finally {
      setIsLoading(false)
    }
  }, [isLoading, hasMore])

  // Initial fetch
  useEffect(() => {
    if (isOpen && releases.length === 0) {
      fetchReleases(1)
    }
  }, [isOpen, fetchReleases])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!observerTargetRef.current || !hasMore || isLoading)
      return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchReleases(page)
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(observerTargetRef.current)

    return () => observer.disconnect()
  }, [page, hasMore, isLoading, fetchReleases])

  // Reset state when dialog closes
  const handleClose = () => {
    setReleases([])
    setPage(1)
    setHasMore(true)
    setError(null)
    onClose()
  }

  if (!isOpen)
    return null

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="blackAlpha.600"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={50}
      p={4}
      onClick={handleClose}
    >
      <Box
        bg="white"
        borderRadius="lg"
        boxShadow="2xl"
        maxW="2xl"
        w="full"
        maxH="80vh"
        display="flex"
        flexDirection="column"
        _dark={{ bg: 'gray.800' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <Box borderBottom="1px solid" borderColor="gray.200" p={6} _dark={{ borderColor: 'gray.700' }}>
          <HStack justifyContent="space-between" alignItems="start">
            <VStack width="100%" alignItems="start">
              <Heading size="lg" color="gray.900" _dark={{ color: 'gray.100' }}>
                All Releases
              </Heading>
              <HStack>
                {ownerAvatar && (
                  <Image
                    src={ownerAvatar}
                    alt={owner}
                    width="24px"
                    height="24px"
                    borderRadius="full"
                    flexShrink={0}
                  />
                )}
                <ExternalLink
                  href={`https://github.com/${owner}/${repo}`}
                >
                  <Text
                    fontSize="md"
                    fontWeight="bold"
                    color="blue.600"
                    _dark={{ color: 'blue.400' }}
                  >
                    {owner}
                    /
                    {repo}
                  </Text>
                </ExternalLink>
              </HStack>
            </VStack>
            <Button variant="ghost" onClick={onClose} minW="auto" h="auto" p={0}>
              <Icon as={FaTimes} />
            </Button>
          </HStack>
        </Box>

        {/* Body */}
        <Box flex={1} overflowY="auto" p={6}>
          <VStack gap={4} align="stretch">
            {error && (
              <Box p={4} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200" color="red.800" _dark={{ bg: 'red.900', borderColor: 'red.700', color: 'red.200' }}>
                {error}
              </Box>
            )}

            {releases.length === 0 && !isLoading && (
              <Box textAlign="center" py={8} color="gray.600" _dark={{ color: 'gray.400' }}>
                <Text>No releases found</Text>
              </Box>
            )}

            {releases.map(release => (
              <Box
                key={release.tag_name}
              >
                <ReleaseCard release={release} repoUrl={repoUrl} owner={owner} repo={repo} hideAllReleasesButton={true} />
              </Box>
            ))}

            {/* Infinite scroll trigger */}
            <Box ref={observerTargetRef} textAlign="center" py={6}>
              {isLoading && (
                <VStack gap={2}>
                  <Spinner color="gray.600" _dark={{ color: 'gray.400' }} />
                  <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>Loading more releases...</Text>
                </VStack>
              )}
              {!hasMore && releases.length > 0 && (
                <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }} fontWeight="medium">
                  No more releases
                </Text>
              )}
            </Box>
          </VStack>
        </Box>

        {/* Footer */}
        <Box borderTop="1px solid" borderColor="gray.200" p={6} display="flex" justifyContent="flex-end" gap={2} _dark={{ borderColor: 'gray.700' }}>
          <Button onClick={handleClose} colorScheme="blue">
            Close
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
