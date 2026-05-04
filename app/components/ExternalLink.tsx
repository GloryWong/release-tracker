import type { LinkProps } from '@chakra-ui/react'
import { Link } from '@chakra-ui/react'

export function ExternalLink(props: LinkProps) {
  return (
    <Link {...props} target="_blank" rel="noopener noreferrer nofollow" />
  )
}
