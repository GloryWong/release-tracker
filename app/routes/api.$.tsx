import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { searchRepositories, searchNPMPackages, getLatestRelease, getOwnerInfo, validateRepository, getLatestNPMRelease, validateNPMPackage, getGithubURLFromNPM } from "../lib/github.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const query = url.searchParams.get("q");

  // GitHub search
  if (pathname === "/api/search-github" && query) {
    try {
      if (query.length < 2) return { suggestions: [] };
      const results = await searchRepositories(query, 10);
      return { suggestions: results || [] };
    } catch (error) {
      console.error("Error searching GitHub:", error);
      return { suggestions: [] };
    }
  }

  // NPM search
  if (pathname === "/api/search-npm" && query) {
    try {
      if (query.length < 1) return { suggestions: [] };
      const results = await searchNPMPackages(query, 10);
      return { suggestions: results || [] };
    } catch (error) {
      console.error("Error searching NPM:", error);
      return { suggestions: [] };
    }
  }

  return { error: "Not found" };
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return { error: "Method not allowed" };
  }

  const formData = await request.formData();
  const repositoriesStr = formData.get("repositories") as string;
  const alreadyFetchedStr = formData.get("alreadyFetched") as string;

  if (!repositoriesStr || repositoriesStr.trim().length === 0) {
    return { error: "Please add at least one repository", repositories: [] };
  }

  // Parse already fetched repos from session cache
  const alreadyFetched = new Set<string>();
  if (alreadyFetchedStr && alreadyFetchedStr.trim().length > 0) {
    alreadyFetchedStr.split(",").forEach((item) => {
      const trimmed = item.trim();
      if (trimmed) alreadyFetched.add(trimmed);
    });
  }

  const items = repositoriesStr
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (items.length === 0) {
    return { error: "Invalid format. Use owner/repo for GitHub or package-name for NPM", repositories: [] };
  }

  const results: any[] = [];
  const _alreadyFetched: any[] = [];

  for (const item of items) {
    // Check if it's a scoped npm package (@scope/name) or a GitHub repo (owner/repo)
    const isScoped = item.startsWith("@");
    
    if (item.includes("/") && !isScoped) {
      // GitHub repository format: owner/repo
      const [owner, repo] = item.split("/").map((s) => s.trim());
      const repoKey = `${owner}/${repo}`;
      
      if (!owner || !repo) {
        results.push({
          owner: item,
          repo: "",
          release: null,
          error: "Invalid GitHub repository format. Use owner/repo",
        });
        continue;
      }

      // Skip if already fetched
      if (alreadyFetched.has(repoKey)) {
        _alreadyFetched.push(repoKey)
        continue;
      }

      const isValid = await validateRepository(owner, repo);
      if (!isValid) {
        results.push({
          owner,
          repo,
          release: null,
          error: `Repository not found`,
        });
        continue;
      }

      const release = await getLatestRelease(owner, repo);
      results.push({
        owner,
        repo,
        release,
        error: !release ? "No releases found" : undefined,
        ownerAvatar: release?.author.avatar_url,
        source: "github",
      });
    } else {
      // NPM package format: package-name or @scope/name
      const packageName = item.trim();
      
      const isValid = await validateNPMPackage(packageName);
      if (!isValid) {
        results.push({
          owner: "npm",
          repo: packageName,
          release: null,
          error: `Package not found on npm`,
          source: "npm",
        });
        continue;
      }

      const githubUrl = await getGithubURLFromNPM(packageName);
      let gitHubOwner: string | null = null;
      let gitHubRepo: string | null = null;

      if (githubUrl) {
        try {
          const urlParts = githubUrl.replace("https://github.com/", "").split("/");
          gitHubOwner = urlParts[0];
          gitHubRepo = urlParts[1];
          
          if (gitHubOwner && gitHubRepo) {
            const repoKey = `${gitHubOwner}/${gitHubRepo}`;
            
            // Skip if already fetched
            if (alreadyFetched.has(repoKey)) {
              _alreadyFetched.push(repoKey)
              continue;
            }

            const isRepoValid = await validateRepository(gitHubOwner, gitHubRepo);
            if (isRepoValid) {
              const ownerInfo = await getOwnerInfo(gitHubOwner);
              const release = await getLatestRelease(gitHubOwner, gitHubRepo);
              results.push({
                owner: gitHubOwner,
                repo: gitHubRepo,
                release,
                error: !release ? "No releases found" : undefined,
                ownerAvatar: ownerInfo?.avatar_url,
                source: "github",
                npmPackageName: packageName,
              });
              continue;
            }
          }
        } catch (error) {
          console.error(`Error parsing GitHub URL for NPM package ${packageName}:`, error);
        }
      }

       const npmRelease = await getLatestNPMRelease(packageName);
        // Extract owner/repo from npm package
        let owner = "npm";
        let repo = packageName;
        let ownerAvatar = npmRelease?.author?.avatar_url || "https://www.gravatar.com/avatar/npm?d=identicon";

        // If we found a GitHub URL earlier, use its owner/repo instead of package name
        if (gitHubOwner && gitHubRepo) {
          owner = gitHubOwner;
          repo = gitHubRepo;
          const ownerInfo = await getOwnerInfo(gitHubOwner);
          if (ownerInfo) {
            ownerAvatar = ownerInfo.avatar_url;
          }
        } else if (npmRelease?.author?.login) {
          owner = npmRelease.author.login;
        }

        results.push({
          owner,
          repo,
          release: npmRelease,
          error: !npmRelease ? "No versions found" : undefined,
          ownerAvatar,
          source: "npm",
          npmPackageName: packageName,
        });
    }
  }

  return { repositories: results, alreadyFetched: _alreadyFetched };
}
