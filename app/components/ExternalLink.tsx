import type { CssProperties } from '@chakra-ui/react'
import { Link } from '@chakra-ui/react'

export function ExternalLink({ href, overflow, width, children }: { href: string, overflow?: CssProperties['overflow'], width?: string, children: any }) {
  return (
    <Link variant="plain" overflow={overflow} width={width} href={href} target="_blank" rel="noopener noreferrer nofollow">
      {children}
    </Link>
  )
}
