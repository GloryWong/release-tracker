import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import type { Release } from "../lib/github.server";
import { Box, Heading, Text, VStack, HStack, Button, Icon } from "@chakra-ui/react";
import { FaTimes } from "react-icons/fa";

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

          {/* Body */}
          <Box flex={1} overflowY="auto" p={6}>
            {release.body ? (
              <Box className="github-markdown" fontSize="sm" color="gray.700" _dark={{ color: "gray.300" }}>
               <ReactMarkdown 
                 remarkPlugins={[remarkGfm, remarkBreaks]}
                 rehypePlugins={[rehypeRaw]}
                 components={{
                   h1: ({ node, ...props }) => <Heading as="h1" size="lg" mb={4} {...props} />,
                   h2: ({ node, ...props }) => <Heading as="h2" size="md" mb={3} {...props} />,
                   h3: ({ node, ...props }) => <Heading as="h3" size="sm" mb={2} {...props} />,
                   p: ({ node, ...props }) => <Text mb={3} {...props} />,
                   ul: ({ node, ...props }) => <Box as="ul" ml={6} mb={3} {...props} />,
                   ol: ({ node, ...props }) => <Box as="ol" ml={6} mb={3} {...props} />,
                   li: ({ node, ...props }) => <Box as="li" mb={1} {...props} />,
                    code: ({ node, inline, ...props }) => 
                      inline ? (
                        <Box 
                          as="code" 
                          px={1} 
                          py={0.5} 
                          bg="gray.100" 
                          borderRadius="sm" 
                          fontFamily="mono"
                          fontSize="0.9em"
                          _dark={{ bg: "gray.700" }}
                          {...props} 
                        />
                      ) : (
                        <Box 
                          as="code" 
                          display="block" 
                          p={3} 
                          bg="gray.50" 
                          border="1px solid" 
                          borderColor="gray.200" 
                          borderRadius="md" 
                          mb={3} 
                          fontFamily="mono"
                          fontSize="sm"
                          overflow="auto"
                          _dark={{ bg: "gray.700", borderColor: "gray.600" }}
                          {...props} 
                        />
                      ),
                    blockquote: ({ node, ...props }) => (
                      <Box 
                        as="blockquote" 
                        borderLeft="4px solid" 
                        borderColor="gray.300" 
                        pl={3} 
                        py={1} 
                        mb={3} 
                        color="gray.600" 
                        fontStyle="italic"
                        _dark={{ borderColor: "gray.600", color: "gray.400" }}
                        {...props} 
                      />
                    ),
                    table: ({ node, ...props }) => (
                      <Box 
                        as="table" 
                        width="100%" 
                        borderCollapse="collapse" 
                        mb={3} 
                        border="1px solid" 
                        borderColor="gray.300"
                        _dark={{ borderColor: "gray.600" }}
                        {...props} 
                      />
                    ),
                    thead: ({ node, ...props }) => (
                      <Box 
                        as="thead" 
                        bg="gray.50" 
                        borderBottom="2px solid" 
                        borderColor="gray.300"
                        _dark={{ bg: "gray.700", borderColor: "gray.600" }}
                        {...props} 
                      />
                    ),
                    th: ({ node, ...props }) => (
                      <Box 
                        as="th" 
                        p={2} 
                        textAlign="left" 
                        fontWeight="600"
                        borderRight="1px solid"
                        borderColor="gray.300"
                        _dark={{ borderColor: "gray.600" }}
                        {...props} 
                      />
                    ),
                    td: ({ node, ...props }) => (
                      <Box 
                        as="td" 
                        p={2} 
                        borderRight="1px solid" 
                        borderColor="gray.300"
                        borderBottom="1px solid"
                        _dark={{ borderColor: "gray.600" }}
                        {...props} 
                      />
                    ),
                    a: ({ node, ...props }) => (
                      <Box 
                        as="a" 
                        color="blue.600" 
                        textDecoration="underline"
                        _hover={{ textDecoration: "none" }}
                        _dark={{ color: "blue.400" }}
                        {...props} 
                      />
                    ),
                    hr: ({ node, ...props }) => (
                      <Box 
                        as="hr" 
                        my={4} 
                        borderColor="gray.300"
                        _dark={{ borderColor: "gray.600" }}
                        {...props} 
                      />
                    ),
                 }}
               >
                 {release.body}
               </ReactMarkdown>
             </Box>
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
