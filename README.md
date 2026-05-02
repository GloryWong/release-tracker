# Release Tracker

A modern web application to check the latest release information for one or more GitHub projects. Built with React Router (formerly Remix) and React.

## Features

- 🔍 Search GitHub repositories for latest releases
- 📦 Display release information including tags, dates, and descriptions
- 🎯 Support for multiple repositories
- ⚡ Server-side rendering with React Router
- 🎨 Modern UI with Tailwind CSS
- 🌙 Dark mode support
- 🔐 GitHub API integration with optional authentication

## Tech Stack

- **Frontend**: React 19
- **Backend**: React Router 7 with Node.js server-side rendering
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **API**: GitHub REST API

## Getting Started

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file (optional but recommended for higher API rate limits):

```bash
cp .env.example .env
```

Add your GitHub personal access token:

```
GITHUB_TOKEN=your_github_token_here
```

To generate a token:
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select `public_repo` scope
4. Copy the token and add to `.env`

### Development

Start the development server with hot module replacement:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

### Type Checking

Check TypeScript types:

```bash
npm run typecheck
```

### Build for Production

Create an optimized production build:

```bash
npm run build
```

Output structure:
```
build/
├── client/    # Static assets
└── server/    # Server-side code
```

### Run Production Build

```bash
npm start
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

## Project Structure

```
app/
├── components/
│   ├── ReleaseCard.tsx      # Individual release display
│   ├── ReleaseList.tsx      # List of releases
│   └── RepositoryForm.tsx   # Search form
├── lib/
│   └── github.server.ts     # GitHub API integration
├── routes/
│   └── home.tsx             # Main page with loader and action
├── app.css                  # Global styles with Tailwind
├── root.tsx                 # Root layout
└── routes.ts                # Route configuration
```

## License

MIT
