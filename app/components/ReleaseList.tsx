import type { Release } from '../lib/github.server'
import {
  Box,
  Heading,
  HStack,
  Image,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react'
import { ReleaseCard } from './ReleaseCard'

interface RepositoryRelease {
  owner: string
  repo: string
  release: Release | null
  error?: string
  ownerAvatar?: string
}

interface ReleaseListProps {
  repositories: RepositoryRelease[]
}

export function ReleaseList({ repositories }: ReleaseListProps) {
  if (!repositories || repositories.length === 0) {
    return (
      <Box textAlign="center" py={[8, 12]} px={4}>
        <Heading as="h3" size={['md', 'lg']} mb={3} color="gray.900" _dark={{ color: 'gray.100' }}>
          No results
        </Heading>
        <Text color="gray.600" _dark={{ color: 'gray.400' }} fontSize={['sm', 'base']}>
          Add repositories to see their latest releases.
        </Text>
      </Box>
    )
  }

  return (
    <VStack width="100%" gap={[6, 8, 10]}>

      <Text width="100%" textAlign="center" color="fg.muted" fontSize={['sm', 'md']}>
        Showing
        {' '}
        {repositories.length}
        {' '}
        repositor
        {repositories.length > 1 ? 'ies' : 'y'}
        {' '}
        latest release
        {repositories.length > 1 ? 's' : ''}
      </Text>

      <SimpleGrid columns={repositories.length > 1 ? [1, 1, 1, 2] : 1} gapX="6" gapY={[6, 8]} width="100%">
        {repositories.map((item) => {
          const repoUrl = `https://github.com/${item.owner}/${item.repo}`

          return (
            <Box key={`${item.owner}/${item.repo}`} height={['300px', '380px', '380px', '450px']} display="flex" flexDirection="column">
              <HStack mb={[2, 4]}>
                {item.ownerAvatar && (
                  <Image
                    src={item.ownerAvatar}
                    alt={item.owner}
                    width="30px"
                    height="30px"
                    borderRadius="full"
                    flexShrink={0}
                  />
                )}
                <Heading
                  as="a"
                  {...{ href: repoUrl, target: '_blank', rel: 'noopener noreferrer nofollow' }}
                  size="xl"
                  color="blue.600"
                  _dark={{ color: 'blue.400' }}
                  _hover={{ textDecoration: 'underline' }}
                  flexGrow={1}
                  truncate
                >
                  {item.owner}
                  /
                  {item.repo}
                </Heading>
              </HStack>
              <Box flexGrow={1} minHeight={0}>
                {
                  (item.error || !item.release)
                    ? (
                        <Box
                          py={8}
                          px={4}
                          bg="white"
                          borderRadius="lg"
                          border="1px solid"
                          borderColor="gray.200"
                          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                          height="100%"
                          display="flex"
                          justifyContent="center"
                          alignItems="center"
                        >
                          <Text color="fg.muted">
                            {item.error || 'No releases found'}
                          </Text>
                        </Box>
                      )
                    : (
                        <ReleaseCard
                          release={item.release}
                          repoUrl={repoUrl}
                          owner={item.owner}
                          repo={item.repo}
                          ownerAvatar={item.ownerAvatar}
                          height="full"
                        />
                      )
                }
              </Box>
            </Box>
          )
        })}
      </SimpleGrid>
    </VStack>
  )
}
