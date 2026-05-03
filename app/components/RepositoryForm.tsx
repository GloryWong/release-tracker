import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Input,
  VStack,
  Text,
  Badge,
  CloseButton,
  Image,
  HStack,
  Icon,
  Tabs,
  Spinner,
} from "@chakra-ui/react";
import { FaSearch, FaRocket, FaGithub } from "react-icons/fa";
import { SiNpm } from "react-icons/si";

interface Repository {
  owner: string;
  repo: string;
  ownerAvatar?: string;
  packageName?: string;
  source?: "github" | "npm";
}

interface SuggestionItem {
  owner: string;
  repo: string;
  packageName?: string;
  description: string;
  url: string;
  ownerAvatar?: string;
}

interface RepositoryFormProps {
  isLoading?: boolean;
  sessionCache?: Map<string, any>;
}

// Debounce utility
function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Throttle utility
function useThrottle<T>(value: T, delay: number) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRanRef = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now - lastRanRef.current >= delay) {
      lastRanRef.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastRanRef.current = Date.now();
        setThrottledValue(value);
      }, delay - (now - lastRanRef.current));
      return () => clearTimeout(timer);
    }
  }, [value, delay]);

  return throttledValue;
}

export function RepositoryForm({ isLoading = false, sessionCache = new Map() }: RepositoryFormProps) {
   const [tabIndex, setTabIndex] = useState(0);
   const [repositories, setRepositories] = useState<Repository[]>([]);

  // GitHub tab state
  const [githubInput, setGithubInput] = useState("");
  const [githubSuggestions, setGithubSuggestions] = useState<SuggestionItem[]>([]);
  const [showGithubSuggestions, setShowGithubSuggestions] = useState(false);
  const [selectedGithubIndex, setSelectedGithubIndex] = useState(-1);
  const githubSuggestionsRef = useRef<HTMLDivElement>(null);
  const githubInputRef = useRef<HTMLInputElement>(null);
  const githubAbortControllerRef = useRef<AbortController | null>(null);

  // NPM tab state
  const [npmInput, setNpmInput] = useState("");
  const [npmSuggestions, setNpmSuggestions] = useState<SuggestionItem[]>([]);
  const [showNpmSuggestions, setShowNpmSuggestions] = useState(false);
  const [selectedNpmIndex, setSelectedNpmIndex] = useState(-1);
  const npmSuggestionsRef = useRef<HTMLDivElement>(null);
  const npmInputRef = useRef<HTMLInputElement>(null);
  const npmAbortControllerRef = useRef<AbortController | null>(null);

  // GitHub input helpers
  const getCurrentGithubInput = () => {
    const lastCommaIndex = githubInput.lastIndexOf(",");
    return lastCommaIndex === -1 ? githubInput : githubInput.substring(lastCommaIndex + 1).trim();
  };

  const debouncedGithubInput = useDebounce(getCurrentGithubInput(), 300);
  const throttledGithubInput = useThrottle(debouncedGithubInput, 1000);

  // NPM input helpers
  const getCurrentNpmInput = () => {
    const lastCommaIndex = npmInput.lastIndexOf(",");
    return lastCommaIndex === -1 ? npmInput : npmInput.substring(lastCommaIndex + 1).trim();
  };

  const debouncedNpmInput = useDebounce(getCurrentNpmInput(), 300);
  const throttledNpmInput = useThrottle(debouncedNpmInput, 1000);

  // GitHub input change handler
  const handleGithubInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGithubInput(value);
    setSelectedGithubIndex(-1);

    // Check if comma was typed
    if (value.includes(",") && !githubInput.includes(",")) {
      const lastCommaIndex = value.lastIndexOf(",");
      const beforeComma = value.substring(0, lastCommaIndex).trim();

      if (beforeComma && beforeComma.includes("/")) {
        const [owner, repo] = beforeComma.split("/").map((s) => s.trim());
        if (owner && repo) {
          setRepositories([...repositories, { owner, repo, source: "github" }]);
          setGithubInput("");
          setGithubSuggestions([]);
          setShowGithubSuggestions(false);
          return;
        }
      }
    }

    // Show suggestions if input is long enough
    if (value.substring(value.lastIndexOf(",") + 1).trim().length > 2) {
      setShowGithubSuggestions(true);
    } else {
      setGithubSuggestions([]);
      setShowGithubSuggestions(false);
    }
  };

  // NPM input change handler
  const handleNpmInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNpmInput(value);
    setSelectedNpmIndex(-1);

    // Check if comma was typed
    if (value.includes(",") && !npmInput.includes(",")) {
      const lastCommaIndex = value.lastIndexOf(",");
      const beforeComma = value.substring(0, lastCommaIndex).trim();

      if (beforeComma && beforeComma.length > 0) {
        setRepositories([...repositories, { owner: "npm", repo: beforeComma, packageName: beforeComma, source: "npm" }]);
        setNpmInput("");
        setNpmSuggestions([]);
        setShowNpmSuggestions(false);
        return;
      }
    }

    // Show suggestions if input is long enough
    if (value.substring(value.lastIndexOf(",") + 1).trim().length > 1) {
      setShowNpmSuggestions(true);
    } else {
      setNpmSuggestions([]);
      setShowNpmSuggestions(false);
    }
  };

  // Fetch GitHub suggestions
  const [githubSuggestionsLoading, setGithubSuggestionsLoading] = useState(false)
  useEffect(() => {
    if (throttledGithubInput.length > 2) {
      const fetchSuggestions = async () => {
        // Cancel previous request
        githubAbortControllerRef.current?.abort();
        githubAbortControllerRef.current = new AbortController();
        setGithubSuggestionsLoading(true)
        
        try {
          const response = await fetch(
            `/api/search-github?q=${encodeURIComponent(throttledGithubInput)}`,
            { signal: githubAbortControllerRef.current.signal }
          );
          if (response.ok) {
            const data = await response.json();
            setGithubSuggestions(data.suggestions || []);
            setShowGithubSuggestions(true);
          } else {
            setGithubSuggestions([]);
          }
          setGithubSuggestionsLoading(false)
        } catch (error) {
          if ((error as Error).name !== "AbortError") {
            console.error("Error fetching GitHub suggestions:", error);
            setGithubSuggestions([]);
            setGithubSuggestionsLoading(false)
          }
        }
      };
      fetchSuggestions();
    } else {
      setGithubSuggestions([]);
      setShowGithubSuggestions(false);
    }
  }, [throttledGithubInput]);

  // Fetch NPM suggestions
  const [npmSuggestionsLoading, setNpmSuggestionsLoading] = useState(false)
  useEffect(() => {
    if (throttledNpmInput.length > 1) {
      const fetchSuggestions = async () => {
        // Cancel previous request
        npmAbortControllerRef.current?.abort();
        npmAbortControllerRef.current = new AbortController();
        setNpmSuggestionsLoading(true)
        
        try {
          const response = await fetch(
            `/api/search-npm?q=${encodeURIComponent(throttledNpmInput)}`,
            { signal: npmAbortControllerRef.current.signal }
          );
          if (response.ok) {
            const data = await response.json();
            setNpmSuggestions(data.suggestions || []);
            setShowNpmSuggestions(true);
          } else {
            setNpmSuggestions([]);
          }
          setNpmSuggestionsLoading(false)
        } catch (error) {
          if ((error as Error).name !== "AbortError") {
            console.error("Error fetching NPM suggestions:", error);
            setNpmSuggestions([]);
            setNpmSuggestionsLoading(false)
          }
        }
      };
      fetchSuggestions();
    } else {
      setNpmSuggestions([]);
      setShowNpmSuggestions(false);
    }
  }, [throttledNpmInput]);

   // Clear suggestions when form is submitted
    useEffect(() => {
      if (isLoading && repositories.length > 0) {
        setGithubSuggestions([]);
        setShowGithubSuggestions(false);
        setGithubInput("");
        setNpmSuggestions([]);
        setShowNpmSuggestions(false);
        setNpmInput("");
        // Cancel any pending requests
        githubAbortControllerRef.current?.abort();
        npmAbortControllerRef.current?.abort();
      }
    }, [isLoading, repositories.length]);

   // GitHub paste handler
   const handleGithubPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
     e.preventDefault();
     const pastedText = e.clipboardData.getData("text");
     const items = pastedText
       .split(",")
       .map((item) => item.trim())
       .filter((item) => item.length > 0);

     const newRepos: Repository[] = [];
     for (const item of items) {
       if (item.includes("/")) {
         const [owner, repo] = item.split("/").map((s) => s.trim());
         if (owner && repo) {
           newRepos.push({ owner, repo, source: "github" });
         }
       }
     }

     if (newRepos.length > 0) {
       setRepositories([...repositories, ...newRepos]);
       setGithubInput("");
       setGithubSuggestions([]);
       setShowGithubSuggestions(false);
     }
   };

   // NPM paste handler
   const handleNpmPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
     e.preventDefault();
     const pastedText = e.clipboardData.getData("text");
     const items = pastedText
       .split(",")
       .map((item) => item.trim())
       .filter((item) => item.length > 0);

      const newPackages: Repository[] = [];
      for (const item of items) {
        if (item.length > 0) {
          newPackages.push({ owner: "npm", repo: item, packageName: item, source: "npm" });
        }
      }

     if (newPackages.length > 0) {
       setRepositories([...repositories, ...newPackages]);
       setNpmInput("");
       setNpmSuggestions([]);
       setShowNpmSuggestions(false);
     }
   };

   // GitHub keyboard handler
  const handleGithubKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showGithubSuggestions || githubSuggestions.length === 0) {
      if (e.key === "Enter" && githubInput.trim()) {
        handleAddGithub();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedGithubIndex((prev) => {
          const newIndex = prev < githubSuggestions.length - 1 ? prev + 1 : prev;
          setTimeout(() => {
            const selectedItem = githubSuggestionsRef.current?.children[newIndex] as HTMLElement;
            selectedItem?.scrollIntoView({ block: "nearest" });
          }, 0);
          return newIndex;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedGithubIndex((prev) => {
          const newIndex = prev > 0 ? prev - 1 : -1;
          setTimeout(() => {
            if (newIndex >= 0) {
              const selectedItem = githubSuggestionsRef.current?.children[newIndex] as HTMLElement;
              selectedItem?.scrollIntoView({ block: "nearest" });
            }
          }, 0);
          return newIndex;
        });
        break;
      case "Enter":
        e.preventDefault();
        if (selectedGithubIndex >= 0) {
          selectGithubSuggestion(githubSuggestions[selectedGithubIndex]);
        } else if (githubInput.trim()) {
          handleAddGithub();
        }
        break;
      case "Escape":
        setShowGithubSuggestions(false);
        break;
    }
  };

  // NPM keyboard handler
  const handleNpmKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showNpmSuggestions || npmSuggestions.length === 0) {
      if (e.key === "Enter" && npmInput.trim()) {
        handleAddNpm();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedNpmIndex((prev) => {
          const newIndex = prev < npmSuggestions.length - 1 ? prev + 1 : prev;
          setTimeout(() => {
            const selectedItem = npmSuggestionsRef.current?.children[newIndex] as HTMLElement;
            selectedItem?.scrollIntoView({ block: "nearest" });
          }, 0);
          return newIndex;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedNpmIndex((prev) => {
          const newIndex = prev > 0 ? prev - 1 : -1;
          setTimeout(() => {
            if (newIndex >= 0) {
              const selectedItem = npmSuggestionsRef.current?.children[newIndex] as HTMLElement;
              selectedItem?.scrollIntoView({ block: "nearest" });
            }
          }, 0);
          return newIndex;
        });
        break;
      case "Enter":
        e.preventDefault();
        if (selectedNpmIndex >= 0) {
          selectNpmSuggestion(npmSuggestions[selectedNpmIndex]);
        } else if (npmInput.trim()) {
          handleAddNpm();
        }
        break;
      case "Escape":
        setShowNpmSuggestions(false);
        break;
    }
  };

  // Select GitHub suggestion
  const selectGithubSuggestion = (suggestion: SuggestionItem) => {
    setRepositories([...repositories, { owner: suggestion.owner, repo: suggestion.repo, ownerAvatar: suggestion.ownerAvatar, source: "github" }]);
    setGithubInput("");
    setGithubSuggestions([]);
    setShowGithubSuggestions(false);
    setSelectedGithubIndex(-1);
    setTimeout(() => {
      githubInputRef.current?.focus();
    }, 0);
  };

  // Select NPM suggestion
  const selectNpmSuggestion = (suggestion: SuggestionItem) => {
    setRepositories([...repositories, { owner: "npm", repo: suggestion.repo, packageName: suggestion.packageName, ownerAvatar: suggestion.ownerAvatar, source: "npm" }]);
    setNpmInput("");
    setNpmSuggestions([]);
    setShowNpmSuggestions(false);
    setSelectedNpmIndex(-1);
    setTimeout(() => {
      npmInputRef.current?.focus();
    }, 0);
  };

  // Add GitHub repositories
  const handleAddGithub = () => {
    if (!githubInput.trim()) return;

    const items = githubInput
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const newRepos: Repository[] = [];
    for (const item of items) {
      if (item.includes("/")) {
        const [owner, repo] = item.split("/").map((s) => s.trim());
        if (owner && repo) {
          newRepos.push({ owner, repo, source: "github" });
        }
      }
    }

    if (newRepos.length > 0) {
      setRepositories([...repositories, ...newRepos]);
      setGithubInput("");
      setGithubSuggestions([]);
      setShowGithubSuggestions(false);
    }
  };

   // Add NPM packages
   const handleAddNpm = () => {
     if (!npmInput.trim()) return;

     const items = npmInput
       .split(",")
       .map((item) => item.trim())
       .filter((item) => item.length > 0);

     const newPackages: Repository[] = [];
     for (const item of items) {
       if (item.length > 0) {
         newPackages.push({ owner: "npm", repo: item, packageName: item, source: "npm" });
       }
     }

    if (newPackages.length > 0) {
      setRepositories([...repositories, ...newPackages]);
      setNpmInput("");
      setNpmSuggestions([]);
      setShowNpmSuggestions(false);
    }
  };

  // Remove repository
  const removeRepository = (index: number) => {
    setRepositories(repositories.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (repositories.length === 0) {
      e.preventDefault();
      if (tabIndex === 0 && githubInput.trim()) {
        handleAddGithub();
      } else if (tabIndex === 1 && npmInput.trim()) {
        handleAddNpm();
      }
    }
  };

  return (
    <VStack gap={4} width="100%" px={[2, 0]}>
      <Box width="100%">
        <Tabs.Root
          value={String(tabIndex)}
          onValueChange={(e) => setTabIndex(parseInt(e.value))}
        >
          <Tabs.List mb={4} flexWrap="wrap">
            <Tabs.Trigger value="0" display="flex" gap={[1, 2]} alignItems="center" fontSize={["sm", "md"]}>
              <Icon as={SiNpm} boxSize={[4, 5]} />
              <Text>NPM</Text>
            </Tabs.Trigger>
            <Tabs.Trigger value="1" display="flex" gap={[1, 2]} alignItems="center" fontSize={["sm", "md"]}>
              <Icon as={FaGithub} boxSize={[4, 5]} />
              <Text>GitHub</Text>
            </Tabs.Trigger>
          </Tabs.List>

           {/* NPM Tab */}
           <Tabs.Content value="0">
            <Box position="relative" width="100%" display="flex" flexDirection="column">
              <Box
                display="flex"
                flexWrap="wrap"
                gap={[2, 3]}
                alignItems="center"
                p={[2, 3]}
                border="1px solid"
                borderColor="gray.300"
                borderRadius="md"
                bg="white"
                _dark={{ bg: "gray.800", borderColor: "gray.600" }}
                _focusWithin={{
                  borderColor: "blue.500",
                  boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
                }}
                position="relative"
              >
                  { npmSuggestionsLoading ? <Spinner boxSize={[4, 5]} /> : <Icon as={FaSearch} color="gray.400" flexShrink={0} boxSize={[4, 5]} /> }
                 {repositories
                   .filter((r) => r.source === "npm")
                     .map((repo, index) => (
                       <Badge
                         key={`npm-${index}`}
                         display="flex"
                         alignItems="center"
                         gap={[1, 2]}
                         px={[2, 3]}
                         py={1}
                         borderRadius="md"
                         bg="red.100"
                         color="red.900"
                         _dark={{ bg: 'red.700', color: 'red.100' }}
                         fontSize={["sm", "md"]}
                       >
                         {repo.ownerAvatar && (
                           <Image
                             src={repo.ownerAvatar}
                             alt={repo.packageName}
                             width="16px"
                             height="16px"
                             borderRadius="full"
                           />
                         )}
                         {repo.packageName}
                         <CloseButton
                           size="xs"
                           onClick={() => removeRepository(repositories.indexOf(repo))}
                           disabled={isLoading}
                           borderRadius="full"
                           color="gray"
                         />
                       </Badge>
                     ))}
                    <Input
                     ref={npmInputRef}
                     type="text"
                     placeholder="e.g., react, vue, angular"
                     value={npmInput}
                     onChange={handleNpmInputChange}
                     onKeyDown={handleNpmKeyDown}
                     onPaste={handleNpmPaste}
                     disabled={isLoading}
                     autoComplete="off"
                     border="none"
                     outline="none"
                     flex={1}
                     minW={["100px", "150px"]}
                     p={0}
                     m={0}
                     bg="transparent"
                     color="gray.800"
                     _dark={{ color: "gray.100" }}
                     _focus={{ outline: "none" }}
                     _placeholder={{ color: "gray.500", _dark: { color: "gray.400" } }}
                     fontSize={["base", "lg"]}
                    />
                 </Box>

                 {/* NPM Suggestions */}
                {showNpmSuggestions && npmSuggestions.length > 0 && (
                  <Box
                    ref={npmSuggestionsRef}
                    position="absolute"
                    top="100%"
                    left={0}
                    right={0}
                    mt={2}
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    boxShadow="lg"
                    maxH="80"
                    overflowY="auto"
                    zIndex={50}
                    _dark={{ bg: "gray.800", borderColor: "gray.600" }}
                  >
                      { npmSuggestions.map((suggestion, index) => (
                       <Box
                         key={suggestion.packageName}
                         px={4}
                         py={3}
                         cursor="pointer"
                         bg={index === selectedNpmIndex ? "blue.50" : "transparent"}
                         borderBottom="1px solid"
                         borderColor="gray.100"
                         _last={{ borderBottom: "none" }}
                         onClick={() => selectNpmSuggestion(suggestion)}
                         onMouseEnter={() => setSelectedNpmIndex(index)}
                         transition="all 0.2s"
                         color="gray.900"
                         _hover={{ bg: "gray.100" }}
                         _dark={{
                           bg: index === selectedNpmIndex ? "blue.900" : "transparent",
                           borderColor: "gray.700",
                           color: "gray.100",
                           _hover: { bg: "gray.700" }
                         }}
                       >
                         <HStack gap={3} mb={1}>
                           {suggestion.ownerAvatar && (
                             <Image
                               src={suggestion.ownerAvatar}
                               alt={suggestion.repo}
                               width="24px"
                               height="24px"
                               borderRadius="full"
                               flexShrink={0}
                             />
                           )}
                           <Text fontWeight="medium" fontSize="sm">
                             <strong>{suggestion.packageName}</strong> • {suggestion.owner}/{suggestion.repo}
                           </Text>
                         </HStack>
                         {suggestion.description && (
                           <Text fontSize="xs" color="gray.600" _dark={{ color: "gray.400" }} ml={suggestion.ownerAvatar ? "32px" : "0"} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                             {suggestion.description}
                           </Text>
                         )}
                       </Box>
                    ))}
                  </Box>
                )}
            </Box>
          </Tabs.Content>

           {/* GitHub Tab */}
           <Tabs.Content value="1">
             <Box position="relative" width="100%" display="flex" flexDirection="column">
               <Box
                 display="flex"
                 flexWrap="wrap"
                 gap={[2, 3]}
                 alignItems="center"
                 p={[2, 3]}
                 border="1px solid"
                 borderColor="gray.300"
                 borderRadius="md"
                 bg="white"
                 _dark={{ bg: "gray.800", borderColor: "gray.600" }}
                 _focusWithin={{
                   borderColor: "blue.500",
                   boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
                 }}
                 position="relative"
               >
                { githubSuggestionsLoading ? <Spinner boxSize={[4, 5]} /> : <Icon as={FaSearch} color="gray.400" flexShrink={0} boxSize={[4, 5]} /> }
                {repositories
                  .filter((r) => r.source === "github")
                  .map((repo, index) => (
                     <Badge
                       key={`github-${index}`}
                       display="flex"
                       alignItems="center"
                       gap={[1, 2]}
                       px={[2, 3]}
                       py={1}
                       borderRadius="md"
                       bg="blue.100"
                       color="blue.900"
                       _dark={{ bg: "blue.700", color: "blue.100" }}
                       fontSize={["sm", "md"]}
                       >
                        {repo.ownerAvatar && (
                          <Image
                            src={repo.ownerAvatar}
                            alt={repo.owner}
                            width="16px"
                            height="16px"
                            borderRadius="full"
                          />
                        )}
                        {repo.owner}/{repo.repo}
                        <CloseButton
                          size="xs"
                          onClick={() => removeRepository(repositories.indexOf(repo))}
                          disabled={isLoading}
                          borderRadius="full"
                          color="gray"
                        />
                      </Badge>
                    ))}
                   <Input
                     ref={githubInputRef}
                     type="text"
                     placeholder="e.g., facebook/react, vuejs/core, angular/angular"
                     value={githubInput}
                     onChange={handleGithubInputChange}
                     onKeyDown={handleGithubKeyDown}
                     onPaste={handleGithubPaste}
                     disabled={isLoading}
                     autoComplete="off"
                     border="none"
                     outline="none"
                     flex={1}
                     minW={["100px", "150px"]}
                     p={0}
                     m={0}
                     bg="transparent"
                     color="gray.800"
                     _dark={{ color: "gray.100" }}
                     _focus={{ outline: "none" }}
                     _placeholder={{ color: "gray.500", _dark: { color: "gray.400" } }}
                     fontSize={["base", "lg"]}
                   />
                </Box>

                {/* GitHub Suggestions */}
                {showGithubSuggestions && githubSuggestions.length > 0 && (
                  <Box
                    ref={githubSuggestionsRef}
                    position="absolute"
                    top="100%"
                    left={0}
                    right={0}
                    mt={2}
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    boxShadow="lg"
                    maxH="80"
                    overflowY="auto"
                    zIndex={50}
                    _dark={{ bg: "gray.800", borderColor: "gray.600" }}
                  >
                    {githubSuggestions.map((suggestion, index) => (
                      <Box
                        key={`${suggestion.owner}/${suggestion.repo}`}
                        px={4}
                        py={3}
                        cursor="pointer"
                        bg={index === selectedGithubIndex ? "blue.50" : "transparent"}
                        borderBottom="1px solid"
                        borderColor="gray.100"
                        _last={{ borderBottom: "none" }}
                        onClick={() => selectGithubSuggestion(suggestion)}
                        onMouseEnter={() => setSelectedGithubIndex(index)}
                        transition="all 0.2s"
                        color="gray.900"
                        _hover={{ bg: "gray.100" }}
                        _dark={{
                          bg: index === selectedGithubIndex ? "blue.900" : "transparent",
                          borderColor: "gray.700",
                          color: "gray.100",
                          _hover: { bg: "gray.700" }
                        }}
                      >
                        <HStack gap={3} mb={1}>
                          {suggestion.ownerAvatar && (
                            <Image
                              src={suggestion.ownerAvatar}
                              alt={suggestion.owner}
                              width="24px"
                              height="24px"
                              borderRadius="full"
                              flexShrink={0}
                            />
                          )}
                          <Text fontWeight="medium" fontSize="sm">
                            {suggestion.owner}/<strong>{suggestion.repo}</strong>
                          </Text>
                        </HStack>
                        {suggestion.description && (
                          <Text fontSize="xs" color="gray.600" _dark={{ color: "gray.400" }} ml={suggestion.ownerAvatar ? "32px" : "0"} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                            {suggestion.description}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
            </Box>
          </Tabs.Content>
        </Tabs.Root>
      </Box>

       <Input
         type="hidden"
         name="repositories"
         value={repositories.map((r) => r.source === "npm" ? (r.packageName || r.repo) : `${r.owner}/${r.repo}`).join(", ")}
       />
       <Input
         type="hidden"
         name="alreadyFetched"
         value={Array.from(sessionCache.keys()).join(", ")}
       />

      <Button
        type="submit"
        disabled={repositories.length === 0}
        variant="surface"
        colorPalette="blue"
        width="100%"
        size={["md", "lg"]}
        fontWeight="bold"
        display="flex"
        gap={2}
        justifyContent="center"
        fontSize={["sm", "base"]}
        loading={isLoading}
        loadingText="Fetching..."
        spinnerPlacement="end"
      >
        Fetch Releases <Icon as={FaRocket} />
      </Button>
    </VStack>
  );
}
