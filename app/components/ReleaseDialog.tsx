import type { Release } from "../lib/github.server";
import { Box, Heading, Text, VStack, HStack, Button, Icon } from "@chakra-ui/react";
import { FaTimes } from "react-icons/fa";
import { ReleaseMarkdown } from "./ReleaseMarkdown";

interface ReleaseDialogProps {
  release: Release;
  owner: string;
  repo: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ReleaseDialog({ release, owner, repo, isOpen, onClose }: ReleaseDialogProps) {
  if (!isOpen) return null;

  const publishDate = new Date(release.published_at);

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
        _dark={{ bg: "gray.800" }}
        onClick={(e) => e.stopPropagation()}
      >
         {/* Header */}
         <Box borderBottom="1px solid" borderColor="gray.200" p={6} display="flex" justifyContent="space-between" alignItems="flex-start" _dark={{ borderColor: "gray.700" }}>
           <VStack gap={1} alignItems="flex-start">
             <Heading size="lg" color="gray.900" _dark={{ color: "gray.100" }}>{release.name || release.tag_name}</Heading>
             <Text fontSize="sm" fontFamily="mono" color="gray.600" _dark={{ color: "gray.400" }}>
               {release.tag_name}
             </Text>
           </VStack>
           <Button variant="ghost" onClick={onClose} minW="auto" h="auto" p={0}>
             <Icon as={FaTimes} />
           </Button>
        </Box>

         {/* Meta */}
         <Box borderBottom="1px solid" borderColor="gray.200" bg="gray.50" p={4} _dark={{ borderColor: "gray.700", bg: "gray.700" }}>
           <HStack gap={4} fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }} flexWrap="wrap">
            <Text>
              {publishDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
            {release.prerelease && (
              <Box px={2} py={1} bg="orange.100" color="orange.800" borderRadius="md" fontSize="xs">
                Pre-release
              </Box>
            )}
            {release.draft && (
              <Box px={2} py={1} bg="gray.200" color="gray.800" borderRadius="md" fontSize="xs">
                Draft
              </Box>
            )}
          </HStack>
        </Box>

          <Box flex={1} overflowY="auto" p={6}>
            {release.body ? (<ReleaseMarkdown text={release.body} owner={owner} repo={repo} />
            ) : (
              <Text color="gray.600" _dark={{ color: "gray.400" }}>No release notes provided.</Text>
            )}
         </Box>

         {/* Footer */}
         <Box borderTop="1px solid" borderColor="gray.200" p={6} display="flex" justifyContent="flex-end" gap={2} _dark={{ borderColor: "gray.700" }}>
          <Button
            as="a"
            {...{ href: release.html_url, target: "_blank", rel: "noopener noreferrer" }}
            variant="outline"
          >
            View on GitHub
          </Button>
          <Button colorScheme="blue" onClick={onClose}>
            Close
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
