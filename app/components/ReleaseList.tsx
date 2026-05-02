import type { Release } from "../lib/github.server";
import { ReleaseCard } from "./ReleaseCard";
import {
  Box,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react";

interface RepositoryRelease {
  owner: string;
  repo: string;
  release: Release | null;
  error?: string;
  ownerAvatar?: string;
}

interface ReleaseListProps {
  repositories: RepositoryRelease[];
}

export function ReleaseList({ repositories }: ReleaseListProps) {
  if (!repositories || repositories.length === 0) {
    return (
      <Box textAlign="center" py={[8, 12]} px={4}>
        <Heading as="h3" size={["md", "lg"]} mb={3} color="gray.900" _dark={{ color: "gray.100" }}>
          No results
        </Heading>
        <Text color="gray.600" _dark={{ color: "gray.400" }} fontSize={["sm", "base"]}>
          Add repositories to see their latest releases.
        </Text>
      </Box>
    );
  }

  return (
    <Box width="100%">
       <Box mb={[6, 8]} pb={[4, 6]} borderBottom="1px solid" borderColor="gray.200" _dark={{ borderColor: "gray.700" }}>
          <Heading as="h2" size={["md", "lg"]} mb={2} color="gray.900" _dark={{ color: "gray.100" }}>
            Latest Releases
          </Heading>
          <Text color="gray.600" fontSize={["xs", "sm"]} _dark={{ color: "gray.400" }}>
            Showing {repositories.length} repository/repositories
          </Text>
        </Box>

      <VStack gap={[4, 8]} alignItems="stretch" width="100%">
       {repositories.map((item) => {
           const repoUrl = `https://github.com/${item.owner}/${item.repo}`;

           if (item.error || !item.release) {
             return (
               <Box key={`${item.owner}/${item.repo}`}>
                 <Box mb={4}>
                   <Heading
                     as="a"
                     {...{ href: repoUrl, target: "_blank", rel: "noopener noreferrer" }}
                     size="md"
                     color="blue.600"
                     _dark={{ color: "blue.400" }}
                     _hover={{ textDecoration: "underline" }}
                   >
                     {item.owner}/{item.repo}
                   </Heading>
                 </Box>
                  <Box textAlign="center" py={8} px={4} bg="gray.50" borderRadius="md" _dark={{ bg: "gray.800" }}>
                    <Text color="gray.600" _dark={{ color: "gray.400" }}>
                      {item.error || "No releases found"}
                    </Text>
                  </Box>
               </Box>
             );
           }

           return (
             <Box key={`${item.owner}/${item.repo}`}>
               <Box mb={4}>
                 <Heading
                   as="a"
                   {...{ href: repoUrl, target: "_blank", rel: "noopener noreferrer" }}
                    size="md"
                    color="blue.600"
                    _dark={{ color: "blue.400" }}
                    _hover={{ textDecoration: "underline" }}
                  >
                    {item.owner}/{item.repo}
                  </Heading>
               </Box>
               <ReleaseCard 
                 release={item.release} 
                 repoUrl={repoUrl} 
                 owner={item.owner}
                 repo={item.repo}
                 ownerAvatar={item.ownerAvatar}
               />
             </Box>
           );
         })}
      </VStack>
    </Box>
  );
}
