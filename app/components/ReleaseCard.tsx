import type { Release } from '../lib/github.server'
import {
  Badge,
  Box,
  Button,
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
}

export function ReleaseCard({ release, repoUrl, owner, repo, ownerAvatar, hideAllReleasesButton = false }: ReleaseCardProps) {
  const [showFullDialog, setShowFullDialog] = useState(false)
  const [showAllDialog, setShowAllDialog] = useState(false)

  // Extract owner and repo from URL if not provided
  const ownerFromUrl = owner || repoUrl.split('/')[repoUrl.split('/').length - 2]
  const repoFromUrl = repo || repoUrl.split('/')[repoUrl.split('/').length - 1]

  const publishDate = new Date(release.published_at)
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
      >
        <VStack gap="0" alignItems="start" width="100%" divideY="1px" divideColor="gray.200" _dark={{ divideColor: 'gray.700' }}>
          <VStack gap={2} p={[4, 6]} width="100%">
            {/* Header */}
            <HStack justifyContent="space-between" width="100%" gap={[2, 3]} flexDirection={['column', 'row']} alignItems={['flex-start', 'center']}>
              <ExternalLink href={release.html_url}>
                <Heading as="h1" size={['xl', '2xl', '3xl']} fontWeight="bold" color="gray.900" _dark={{ color: 'gray.100' }}>
                  {release.name || release.tag_name}
                </Heading>
              </ExternalLink>
              <HStack gap={2} flexShrink={0} width={['100%', 'auto']}>
                {isPrerelease && <Badge colorScheme="orange" fontSize={['xs', 'sm']}>Pre-release</Badge>}
                {isDraft && <Badge colorScheme="gray" fontSize={['xs', 'sm']}>Draft</Badge>}
              </HStack>
            </HStack>

            {/* Meta Info */}
            <HStack gap={[2, 4]} width="100%" fontSize={['xs', 'sm']} color="gray.600" _dark={{ color: 'gray.400' }} flexWrap="wrap">
              <HStack gap={[2, 4]} flexWrap="wrap">
                {release.author && (
                  <HStack gap={1}>
                    <Box
                      as="img"
                      {...{
                        src: release.author.avatar_url,
                        alt: release.author.login,
                      }}
                      width="24px"
                      height="24px"
                      borderRadius="full"
                    />
                    <ExternalLink href={`https://github.com/${owner}`}>
                      <Text fontWeight="semibold" color="fg.muted">
                        {release.author.login}
                      </Text>
                    </ExternalLink>

                    <Text>released this</Text>
                    <TimeAgo date={publishDate} live={false} />
                  </HStack>
                )}
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
              </HStack>
            </HStack>
          </VStack>

          <Box width="100%" p={[4, 6]}>
            {release.body ? (<ReleaseMarkdown text={release.body} owner={ownerFromUrl} repo={repoFromUrl} limitHeight />) : (<Text color="fg.muted">No release notes provided.</Text>)}
          </Box>

          {/* Actions */}
          <HStack gap={[1, 2]} width="100%" flexWrap={['wrap', 'nowrap']} p={[4, 6]}>
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
              <Text display={['none', 'inline']}>View on GitHub</Text>
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
