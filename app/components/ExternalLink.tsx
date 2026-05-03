import { Link } from '@chakra-ui/react'

export function ExternalLink({ href, children }: { href: string, children: any }) {
  return (
    <Link variant="plain" href={href} target="_blank" rel="noopener noreferrer nofollow">
      {children}
    </Link>
  )
}
