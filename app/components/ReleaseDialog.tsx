import type { Release } from '../lib/github.server'
import { Box, Button, Heading, HStack, Icon, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { FaGithub, FaTimes } from 'react-icons/fa'
import { GoTag } from 'react-icons/go'
import TimeAgo from 'react-timeago'
import { ExternalLink } from './ExternalLink'
import { ReleaseMarkdown } from './ReleaseMarkdown'

interface ReleaseDialogProps {
  release: Release
  repoUrl: string
  owner: string
  repo: string
  isOpen: boolean
  onClose: () => void
}

export function ReleaseDialog({ release, repoUrl, owner, repo, isOpen, onClose }: ReleaseDialogProps) {
  const [publishDate] = useState(() => new Date(release.published_at))

  if (!isOpen)
    return null

  return (
    <Box
      position="fixed"
      inset={0}
      bg="blackAlpha.600"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={50}
      p={4}
      onClick={onClose}
    >
      <Box
        bg="white"
        borderRadius="lg"
        boxShadow="2xl"
        maxW="2xl"
        width="100%"
        maxH="80vh"
        display="flex"
        flexDirection="column"
        _dark={{ bg: 'gray.800' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <Box borderBottom="1px solid" borderColor="gray.200" p={6} _dark={{ borderColor: 'gray.700' }}>
          <HStack justifyContent="space-between" alignItems="center">
            <ExternalLink href={release.html_url}>
              <Heading size="lg" color="gray.900" _dark={{ color: 'gray.100' }}>{release.name || release.tag_name}</Heading>
            </ExternalLink>
            <Button variant="ghost" onClick={onClose} minW="auto" h="auto" p={0}>
              <Icon as={FaTimes} />
            </Button>
          </HStack>
        </Box>

        {/* Meta */}
        <Box borderBottom="1px solid" borderColor="gray.200" bg="gray.50" py={4} px={6} _dark={{ borderColor: 'gray.700', bg: 'gray.700' }}>
          <HStack gap={[2, 4]} fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }} alignItems="center" flexWrap="wrap">
            <HStack gap={1} alignItems="center">
              <Text>Released</Text>
              <TimeAgo date={publishDate} live={false} />
              <Text>
                (
                {publishDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                )
              </Text>
            </HStack>
            <HStack gap={4} flexGrow={1} justifyContent="space-between" alignItems="center">
              <ExternalLink href={`${repoUrl}/tree/${release.tag_name}`}>
                <HStack gap={1}>
                  <Icon>
                    <GoTag />
                  </Icon>
                  <Text fontSize={['xs', 'sm']} fontFamily="mono" color="gray.600" _dark={{ color: 'gray.400' }}>
                    {release.tag_name}
                  </Text>
                </HStack>
              </ExternalLink>
              {release.prerelease && (
                <Box px={2} py={1} bg="orange.200" color="orange.800" borderRadius="md" fontSize="xs">
                  Pre-release
                </Box>
              )}
              {release.draft && (
                <Box px={2} py={1} bg="bg.emphasized" color="fg.muted" borderRadius="md" fontSize="xs">
                  Draft
                </Box>
              )}
            </HStack>
          </HStack>
        </Box>

        <Box flex={1} overflowY="auto" p={6}>
          {release.body
            ? (<ReleaseMarkdown text={release.body} owner={owner} repo={repo} />
              )
            : (
                <Text color="gray.600" _dark={{ color: 'gray.400' }}>No release notes provided.</Text>
              )}
        </Box>

        {/* Footer */}
        <Box borderTop="1px solid" borderColor="gray.200" p={6} display="flex" justifyContent="flex-end" gap={2} _dark={{ borderColor: 'gray.700' }}>
          <Button
            as="a"
            {...{ href: release.html_url, target: '_blank', rel: 'noopener noreferrer' }}
            variant="outline"
          >
            View on GitHub
            {' '}
            <Icon as={FaGithub}></Icon>
          </Button>
          <Button colorScheme="blue" onClick={onClose}>
            Close
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
