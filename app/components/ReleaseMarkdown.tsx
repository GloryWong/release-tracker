import { MarkdownHooks } from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import rehypeRaw from "rehype-raw";
import rehypeStarryNight from "rehype-starry-night";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkGithub from "remark-github";
import { remarkAlert } from "remark-github-blockquote-alert";
import 'remark-github-blockquote-alert/alert.css';
import { Box, Center, Spinner } from "@chakra-ui/react";
import remarkEmoji from "remark-emoji";

export function ReleaseMarkdown({text, owner, repo, limitHeight }: {text:string, owner: string, repo: string, limitHeight?: boolean }) {
  return (
        <Box 
                width="100%" 
                bgColor="transparent"
                _dark={{ bgColor: 'transparent' }}
                maxH={limitHeight ? ["160px", "172px"] : []}
                overflow="hidden"
                className="markdown-body"
            >


    <MarkdownHooks 
      remarkPlugins={[remarkGfm, remarkBreaks, [remarkGithub, { repository: `${owner}/${repo}` }], remarkAlert, remarkEmoji]}
      rehypePlugins={[rehypeRaw, [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer', 'nofollow'] }], rehypeStarryNight]}
      remarkRehypeOptions={{ allowDangerousHtml: true }}
      fallback={
        <Center width="100%">
          <Spinner />
        </Center>
      }
    >
      {text}
    </MarkdownHooks>

    </Box>
  )
}
