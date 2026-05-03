import type { Route } from './+types/root'
import { Box, ChakraProvider, Code, defaultSystem, Heading, Text, VStack } from '@chakra-ui/react'

import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router'
import './app.css'

export const links: Route.LinksFunction = () => [
  { rel: 'icon', href: '/favicon.ico', type: 'image/x-icon' },
  { rel: 'apple-touch-icon', href: '/favicon.ico' },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Get stored color mode preference
                const storedMode = localStorage.getItem('release-tracker-color-mode');
                
                let mode = storedMode;
                
                // If no stored preference, detect system preference
                if (!mode) {
                  mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                
                // Apply theme
                if (mode === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                }
                
                // Store preference if not already stored
                if (!storedMode) {
                  localStorage.setItem('release-tracker-color-mode', mode);
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <ChakraProvider value={defaultSystem}>
          {children}
        </ChakraProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details
      = error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details
  }
  else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <Box as="main" p={4} maxW="4xl" mx="auto">
      <VStack gap={4} align="start">
        <Heading as="h1" size="2xl">{message}</Heading>
        <Text>{details}</Text>
        {stack && (
          <Box as="pre" p={4} bg="gray.100" _dark={{ bg: 'gray.800' }} overflowX="auto" w="full" rounded="md">
            <Code>{stack}</Code>
          </Box>
        )}
      </VStack>
    </Box>
  )
}
