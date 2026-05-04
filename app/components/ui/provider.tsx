'use client'

import type { ColorModeProviderProps } from './color-mode'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import {
  ColorModeProvider,
} from './color-mode'

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={defaultSystem}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  )
}
