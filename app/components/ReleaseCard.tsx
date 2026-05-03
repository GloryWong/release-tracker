import { useState } from "react";
import type { Release } from "../lib/github.server";
import { ReleaseDialog } from "./ReleaseDialog";
import { AllReleasesDialog } from "./AllReleasesDialog";
import {
  Box,
  Heading,
  HStack,
  VStack,
  Text,
  Badge,
  Button,
  Image,
  Icon,
} from "@chakra-ui/react";
import { FaBook, FaList, FaGithub } from "react-icons/fa";
import { ReleaseMarkdown } from "./ReleaseMarkdown";

interface ReleaseCardProps {
  release: Release;
  repoUrl: string;
  owner?: string;
  repo?: string;
  ownerAvatar?: string;
  hideAllReleasesButton?: boolean;
}

export function ReleaseCard({ release, repoUrl, owner, repo, ownerAvatar, hideAllReleasesButton = false }: ReleaseCardProps) {
  const [showFullDialog, setShowFullDialog] = useState(false);
  const [showAllDialog, setShowAllDialog] = useState(false);

  // Extract owner and repo from URL if not provided
  const ownerFromUrl = owner || repoUrl.split("/")[repoUrl.split("/").length - 2];
  const repoFromUrl = repo || repoUrl.split("/")[repoUrl.split("/").length - 1];

  const publishDate = new Date(release.published_at);
  const isPrerelease = release.prerelease;
  const isDraft = release.draft;

   return (
     <>
        <Box
          bg="white"
          borderRadius="lg"
          border="1px solid"
          borderColor="gray.200"
          p={[4, 6]}
          _dark={{ bg: "gray.800", borderColor: "gray.700" }}
          _hover={{ boxShadow: "lg", transition: "all 0.2s" }}
        >
         <VStack gap={4} alignItems="start" width="100%">
           {/* Header with Repository Logo */}
           <HStack justifyContent="space-between" width="100%" gap={[2, 3]} flexDirection={["column", "row"]} alignItems={["flex-start", "center"]}>
             <HStack gap={[2, 3]} alignItems="flex-start" flex={1} width={["100%", "auto"]}>
               {ownerAvatar && (
                 <Image
                   src={ownerAvatar}
                   alt={ownerFromUrl}
                   width={["32px", "40px"]}
                   height={["32px", "40px"]}
                   borderRadius="full"
                   flexShrink={0}
                 />
               )}
               <VStack gap={1} alignItems="start">
                <Heading as="h3" size={["sm", "md"]} color="gray.900" _dark={{ color: "gray.100" }}>
                    {release.name || release.tag_name}
                  </Heading>
                  <Text fontSize={["xs", "sm"]} fontFamily="mono" color="gray.600" _dark={{ color: "gray.400" }}>
                    {release.tag_name}
                  </Text>
               </VStack>
             </HStack>
             <HStack gap={2} flexShrink={0} width={["100%", "auto"]}>
               {isPrerelease && <Badge colorScheme="orange" fontSize={["xs", "sm"]}>Pre-release</Badge>}
               {isDraft && <Badge colorScheme="gray" fontSize={["xs", "sm"]}>Draft</Badge>}
             </HStack>
           </HStack>

            {/* Meta Info */}
            <HStack gap={[2, 4]} width="100%" fontSize={["xs", "sm"]} color="gray.600" _dark={{ color: "gray.400" }} flexWrap="wrap">
            <Text>
              {publishDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </Text>
            {release.author && (
              <HStack gap={2}>
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
                <Text>{release.author.login}</Text>
              </HStack>
            )}
          </HStack>

            {release.body ? (<ReleaseMarkdown text={release.body} owner={ownerFromUrl} repo={repoFromUrl} limitHeight />) : (<Text color="gray.600" _dark={{ color: "gray.400" }}>No release notes provided.</Text>)}

            {/* Actions */}
            <HStack gap={[1, 2]} width="100%" pt={4} borderTop="1px solid" borderColor="gray.200" _dark={{ borderColor: "gray.700" }} flexWrap={["wrap", "nowrap"]}>
               <Button size={["xs", "sm"]} variant="outline" onClick={() => setShowFullDialog(true)} display="flex" gap={[1, 2]} fontSize={["xs", "sm"]}>
                 <Icon as={FaBook} boxSize={[3, 4]} />
                 <Text display={["none", "inline"]}>View Full</Text>
               </Button>
               {!hideAllReleasesButton && (
                 <Button size={["xs", "sm"]} variant="outline" onClick={() => setShowAllDialog(true)} display="flex" gap={[1, 2]} fontSize={["xs", "sm"]}>
                   <Icon as={FaList} boxSize={[3, 4]} />
                   <Text display={["none", "inline"]}>All Releases</Text>
                 </Button>
               )}
               <Button
                 as="a"
                 {...{ href: release.html_url, target: "_blank", rel: "noopener noreferrer" }}
                 size={["xs", "sm"]}
                 variant="ghost"
                 ml={["auto", "auto"]}
                 fontSize={["xs", "sm"]}
                 fontWeight="semibold"
                 color="blue.600"
                 display="flex"
                 gap={[1, 2]}
               >
                 <Text display={["none", "inline"]}>GitHub</Text>
                 <Icon as={FaGithub} boxSize={[3, 4]} />
               </Button>
             </HStack>
        </VStack>
      </Box>

      {ownerFromUrl && repoFromUrl && (
        <>
          <ReleaseDialog
            release={release}
            owner={ownerFromUrl}
            repo={repoFromUrl}
            isOpen={showFullDialog}
            onClose={() => setShowFullDialog(false)}
          />
          <AllReleasesDialog
            owner={ownerFromUrl}
            repo={repoFromUrl}
            isOpen={showAllDialog}
            onClose={() => setShowAllDialog(false)}
          />
        </>
      )}
    </>
  );
}
