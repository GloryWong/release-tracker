import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
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

  // Helper function to strip markdown and truncate
  const stripMarkdownAndTruncate = (text: string, maxLength: number = 300) => {
    // Remove markdown links [text](url) -> text
    let stripped = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
    // Remove markdown bold/italic **text** -> text, __text__ -> text, *text* -> text, _text_ -> text
    stripped = stripped.replace(/(\*\*|__)(.*?)\1/g, "$2");
    stripped = stripped.replace(/(\*|_)(.*?)\1/g, "$2");
    // Remove markdown headers # -> empty
    stripped = stripped.replace(/^#+\s+/gm, "");
    // Remove html tags
    stripped = stripped.replace(/<[^>]+>/g, "");
    // Trim and truncate
    stripped = stripped.trim();
    if (stripped.length > maxLength) {
      stripped = stripped.substring(0, maxLength).trim() + "...";
    }
    return stripped;
  };

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

           {/* Release Body Preview with Markdown */}
            {release.body && (
              <Box 
                width="100%" 
                fontSize={["xs", "sm"]}
                color="gray.700"
                _dark={{ color: "gray.300" }}
                maxH={["60px", "72px"]}
                overflow="hidden"
                className="github-markdown"
              sx={{
                "& > *": {
                  margin: 0,
                  marginBottom: "0.5em",
                },
                "& > *:last-child": {
                  marginBottom: 0,
                },
              }}
            >
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  p: ({ node, ...props }) => <Text display="inline" {...props} />,
                  ul: ({ node, ...props }) => <Box as="ul" display="inline" ml={0} {...props} />,
                  ol: ({ node, ...props }) => <Box as="ol" display="inline" ml={0} {...props} />,
                  li: ({ node, ...props }) => <Box as="li" display="inline" mr={1} {...props} />,
                  code: ({ node, inline, ...props }) => 
                    <Box 
                      as="code" 
                      px={1} 
                      bg="gray.100" 
                      borderRadius="sm" 
                      fontFamily="mono"
                      fontSize="0.9em"
                      display="inline"
                      _dark={{ bg: "gray.700" }}
                      {...props} 
                    />,
                  a: ({ node, ...props }) => (
                    <Box 
                      as="a" 
                      color="blue.600"
                      display="inline"
                      _dark={{ color: "blue.400" }}
                      {...props} 
                    />
                  ),
                }}
              >
                {stripMarkdownAndTruncate(release.body, 300)}
              </ReactMarkdown>
            </Box>
          )}

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
