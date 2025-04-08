# Automated Software Development Helper

A powerful tool for managing and analyzing software projects, with a focus on TypeScript codebases.

## Features

- **Project Management**: Create and manage multiple projects with structured file organization
- **File System Operations**: Read, write, and update files with in-memory caching
- **TypeScript Analysis**: Parse and analyze TypeScript code for imports, exports, and dependencies
- **Event-Driven Architecture**: React to file changes and project updates in real-time
- **RESTful API**: Access project functionality through a clean API interface

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/automated-dev-helper.git
cd automated-dev-helper
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The server will start on port 3000 by default.

## API Endpoints

### Projects

- `POST /api/projects` - Create a new project
  - Request body: `{ projectPath: string, name: string }`

- `GET /api/projects/:projectId/files` - Get file content
  - Query params: `filePath: string`

- `PUT /api/projects/:projectId/files` - Update file content
  - Request body: `{ filePath: string, content: string }`

- `POST /api/projects/:projectId/save` - Save project changes

## Project Structure

```
src/
├── api/              # API endpoints
├── analyzers/        # Code analysis tools
├── models/           # Data models
├── services/         # Business logic
└── types/            # TypeScript type definitions
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

## License

ISC
