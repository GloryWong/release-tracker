import type { BoxProps } from '@chakra-ui/react'
import type { Release } from '../lib/github.server'
import {
  Box,

  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useState } from 'react'
import { FaBook, FaGithub, FaList } from 'react-icons/fa'
import { GoTag } from 'react-icons/go'
import TimeAgo from 'react-timeago'
import { AllReleasesDialog } from './AllReleasesDialog'
import { ExternalLink } from './ExternalLink'
import { ReleaseDialog } from './ReleaseDialog'
import { ReleaseMarkdown } from './ReleaseMarkdown'

interface ReleaseCardProps {
  release: Release
  repoUrl: string
  owner?: string
  repo?: string
  ownerAvatar?: string
  hideAllReleasesButton?: boolean
  height?: BoxProps['height']
}

export function ReleaseCard({ release, repoUrl, owner, repo, ownerAvatar, hideAllReleasesButton = false, height }: ReleaseCardProps) {
  const [showFullDialog, setShowFullDialog] = useState(false)
  const [showAllDialog, setShowAllDialog] = useState(false)

  // Extract owner and repo from URL if not provided
  const ownerFromUrl = owner || repoUrl.split('/')[repoUrl.split('/').length - 2]
  const repoFromUrl = repo || repoUrl.split('/')[repoUrl.split('/').length - 1]

  const [publishDate] = useState(() => release.published_at ? new Date(release.published_at) : new Date())
  const isPrerelease = release.prerelease
  const isDraft = release.draft

  return (
    <>
      <Box
        bg="white"
        borderRadius="lg"
        border="1px solid"
        borderColor="gray.200"
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        _hover={{ boxShadow: 'lg', transition: 'all 0.2s' }}
        height={height}
      >
        <VStack gap="0" alignItems="start" width="full" height="full" divideY="1px" divideColor="gray.200" _dark={{ divideColor: 'gray.700' }}>
          <VStack gap={2} p={[4, 6]} width="full">
            {/* Header */}
            <HStack justifyContent="space-between" width="full" gap={[2, 3]} alignItems={['center']}>
              <Box flexGrow={1} minW={0}>
                <ExternalLink href={release.html_url} maxWidth="full">
                  <Heading as="h1" width="full" truncate size={['xl', '2xl', '3xl']} fontWeight="bold" color="gray.900" _dark={{ color: 'gray.100' }}>
                    {release.name || release.tag_name}
                  </Heading>
                </ExternalLink>
              </Box>
              {(isPrerelease || isDraft) && (
                <HStack gap={1} flexShrink={0}>
                  {release.prerelease && (
                    <Box px={2} py={1} bg="orange.subtle" color="orange.fg" borderRadius="md" fontSize={['xs', 'sm']}>
                      Pre-release
                    </Box>
                  )}
                  {release.draft && (
                    <Box px={2} py={1} bg="bg.emphasized" color="fg.muted" borderRadius="md" fontSize={['xs', 'sm']}>
                      Draft
                    </Box>
                  )}
                </HStack>
              )}
            </HStack>

            {/* Meta Info */}
            {release.author && (
              <HStack gap={1} fontSize={['xs', 'sm']} color="fg.muted" width="full">
                <ExternalLink href={release.author.html_url} overflow="hidden">
                  <HStack gap={1} maxW="full">
                    <Box
                      as="img"
                      {...{
                        src: release.author.avatar_url,
                        alt: release.author.login,
                      }}
                      width="24px"
                      height="24px"
                      borderRadius="full"
                      flexShrink={0}
                    />
                    <Text fontWeight="semibold" color="fg.muted" truncate>
                      {release.author.login}
                    </Text>
                  </HStack>
                </ExternalLink>
                <Text textWrap="nowrap">released this</Text>
                <Box whiteSpace="nowrap">
                  <TimeAgo date={publishDate} live={false} />
                </Box>
                {release.tag_name
                  && (
                    <Flex ml={2} alignItems="center">
                      <ExternalLink href={`${repoUrl}/tree/${release.tag_name}`}>
                        <HStack gap={1}>
                          <Icon>
                            <GoTag />
                          </Icon>
                          <Text fontSize={['xs', 'sm']} textWrap="nowrap" fontFamily="mono" color="fg.muted">
                            {release.tag_name}
                          </Text>
                        </HStack>
                      </ExternalLink>
                    </Flex>
                  )}
              </HStack>
            )}
          </VStack>

          <Box width="100%" p={[4, 6]} flexGrow={1} minHeight={0} overflow="hidden">
            {release.body
              ? (<ReleaseMarkdown text={release.body} owner={ownerFromUrl} repo={repoFromUrl} />)
              : (
                  <HStack width="100%" height="100%" justifyContent="center" alignItems="center">
                    <Text color="fg.muted">No release notes provided.</Text>
                  </HStack>
                )}
          </Box>

          {/* Actions */}
          <HStack gap={[1, 1, 2]} width="100%" flexWrap={['wrap', 'nowrap']} p={[4, 6]}>
            <Button size={['xs', 'sm']} variant="outline" onClick={() => setShowFullDialog(true)} display="flex" gap={[1, 2]} fontSize={['xs', 'sm']}>
              <Icon as={FaBook} boxSize={[3, 4]} />
              <Text>View Full</Text>
            </Button>
            {!hideAllReleasesButton && (
              <Button size={['xs', 'sm']} variant="outline" onClick={() => setShowAllDialog(true)} display="flex" gap={[1, 2]} fontSize={['xs', 'sm']}>
                <Icon as={FaList} boxSize={[3, 4]} />
                <Text>All Releases</Text>
              </Button>
            )}
            <Button
              as="a"
              {...{ href: release.html_url, target: '_blank', rel: 'noopener noreferrer' }}
              size={['xs', 'sm']}
              variant="ghost"
              ml={['auto', 'auto']}
              fontSize={['xs', 'sm']}
              fontWeight="semibold"
              display="flex"
              gap={[1, 2]}
            >
              <Text display={['inline', 'inline']} fontSize={['xs', 'xs', 'sm', 'sm']}>View on GitHub</Text>
              <Icon as={FaGithub} boxSize={[3, 4]} />
            </Button>
          </HStack>
        </VStack>
      </Box>

      {ownerFromUrl && repoFromUrl && (
        <>
          <ReleaseDialog
            release={release}
            repoUrl={repoUrl}
            owner={ownerFromUrl}
            repo={repoFromUrl}
            isOpen={showFullDialog}
            onClose={() => setShowFullDialog(false)}
          />
          <AllReleasesDialog
            owner={ownerFromUrl}
            repo={repoFromUrl}
            ownerAvatar={ownerAvatar}
            isOpen={showAllDialog}
            onClose={() => setShowAllDialog(false)}
          />
        </>
      )}
    </>
  )
}
