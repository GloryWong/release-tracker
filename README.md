# Release Tracker

A modern web application to check the latest release information for one or more GitHub projects. Built with React Router (formerly Remix) and React.

## Features

- 🔍 Search GitHub repositories for latest releases; Support searching NPM registry for latest releases
- 📦 Display release information including tags, dates, and descriptions
- 🎯 Support for multiple repositories
- ⚡ Server-side rendering with React Router
- 🎨 Modern UI with [Chakra-UI](https://chakra-ui.com/)
- 🌙 Dark mode support

## Tech Stack

- **Frontend**: React 19
- **Backend**: React Router 7 with Node.js server-side rendering
- **UI**: [Chakra-UI](https://chakra-ui.com/)
- **Language**: TypeScript
- **API**: GitHub and NPM REST API

## Getting Started

### Installation

```bash
pnpm install
```

### Development

Start the development server with hot module replacement:

```bash
pnpm dev
```

Your application will be available at `http://localhost:3000`.

### Type Checking

Check TypeScript types:

```bash
pnpm typecheck
```

### Build for Production

Create an optimized production build:

```bash
pnpm build
```

Output structure:
```
build/
├── client/    # Static assets
└── server/    # Server-side code
```

### Run Production Build

```bash
pnpm start
```

## Usage

1. Open the application in your browser
2. Enter a GitHub repository in the format: `owner/repo`
   - Example: `facebook/react`
3. Click "Fetch Releases" to retrieve the latest releases
4. Browse release information including:
   - Release name and tag
   - Publication date
   - Author information
   - Release body/description
   - Pre-release and draft status badges

## API Rate Limits

- **Without authentication**: 60 requests/hour per IP
- **With GitHub token**: 5,000 requests/hour per user

Using a GitHub token is recommended for production deployment.
> Generate a GitHub token in github.com and add an environment variable GITHUB_TOKEN to the project in the PaaS platforms (Vercel, Netlify, etc.).

## Deployment

### Docker

```bash
docker build -t release-tracker .
docker run -p 3000:3000 -e GITHUB_TOKEN=your_token release-tracker
```

### Supported Platforms

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway
- Vercel (recommended for Remix/React Router projects)
- Heroku
- Self-hosted Node servers

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | No | GitHub personal access token for higher API rate limits |

## License

[MIT](./LICENSE)
