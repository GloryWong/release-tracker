import type { Release } from '../lib/github.server'
import {
  Box,
  Heading,
  HStack,
  Icon,
  IconButton,
  Image,
  Separator,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react'
import { FaTimes } from 'react-icons/fa'
import { SiNpm } from 'react-icons/si'
import { ExternalLink } from './ExternalLink'
import { ReleaseCard } from './ReleaseCard'
import { Tooltip } from './ui/tooltip'

export interface RepositoryRelease {
  owner: string
  repo: string
  release: Release | null
  error?: string
  ownerAvatar?: string
  npmPackageName?: string
}

interface ReleaseListProps {
  repositoryReleases: RepositoryRelease[]
  clearRepositoryReleases: () => void
}

export function ReleaseList({ repositoryReleases, clearRepositoryReleases }: ReleaseListProps) {
  if (!repositoryReleases || repositoryReleases.length === 0) {
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
    <VStack width="full" gap={[6, 8, 10]}>

      <HStack width="full">
        <Separator flex="1" />
        <Text textAlign="center" flexShrink={0} color="fg.muted" fontSize={['sm', 'md']}>
          Showing
          {' '}
          <b>{repositoryReleases.length}</b>
          {' '}
          repositor
          {repositoryReleases.length > 1 ? 'ies' : 'y'}
          {' '}
          Latest Release
          {repositoryReleases.length > 1 ? 's' : ''}
        </Text>
        <Tooltip content="Clear releases">
          <IconButton flexShrink={0} size="xs" variant="ghost" onClick={clearRepositoryReleases}>
            <FaTimes />
          </IconButton>
        </Tooltip>
        <Separator flex="1" />
      </HStack>

      <SimpleGrid columns={repositoryReleases.length > 1 ? [1, 1, 1, 2] : 1} gapX="6" gapY={[6, 8]} width="100%">
        {repositoryReleases.map((item) => {
          const repoUrl = `https://github.com/${item.owner}/${item.repo}`

          return (
            <Box key={`${item.owner}/${item.repo}`} height={['300px', '380px', '380px', '450px']} display="flex" flexDirection="column">
              <HStack mb={[2, 4]}>
                <HStack flexGrow={1} minW={0}>
                  {item.ownerAvatar && (
                    <Image
                      src={item.ownerAvatar}
                      alt={item.owner}
                      width="30px"
                      height="30px"
                      borderRadius="full"
                      borderWidth={1}
                      borderColor="border.emphasized"
                      borderStyle="solid"
                      flexShrink={0}
                    />
                  )}
                  <Box flexGrow={1} minWidth={0} truncate>
                    <Heading
                      as="a"
                      {...{ href: repoUrl, target: '_blank', rel: 'noopener noreferrer nofollow' }}
                      size="xl"
                      color="blue.600"
                      _dark={{ color: 'blue.400' }}
                      _hover={{ textDecoration: 'underline' }}
                      maxWidth="full"
                    >
                      {item.owner}
                      /
                      {item.repo}
                    </Heading>
                  </Box>
                </HStack>
                {item.npmPackageName && (
                  <ExternalLink href={`https://www.npmjs.com/package/${item.npmPackageName}`}>
                    <Icon boxSize="24px" as={SiNpm} color="red.emphasized" />
                  </ExternalLink>
                )}
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
