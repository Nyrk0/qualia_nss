# Development Setup

This guide covers the development environment setup and workflow for the Qualia NSS project.

## Prerequisites

- Node.js v16+
- npm v8+
- Git
- Code editor (VS Code recommended)

## Getting Started

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/Nyrk0/qualia_nss.git
   cd qualia_nss
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory with the necessary environment variables.
   Refer to `.env.example` for required variables.

## Development Workflow

### Starting the Development Server

```bash
npm run dev
```

This will start the development server with hot-reload enabled.

### Running Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test:watch
```

### Code Quality

Lint the code:
```bash
npm run lint
```

Format the code:
```bash
npm run format
```

### Documentation

Generate API documentation:
```bash
npm run docs:generate
```

Serve the wiki locally:
```bash
npm run docs:serve
```

## Git Workflow

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. Push your changes and create a pull request

## Code Style

- Follow the existing code style in the project
- Use meaningful variable and function names
- Add comments for complex logic
- Write tests for new features

## Debugging

- Use `console.log()` for quick debugging
- For more complex debugging, use the browser's developer tools
- The project is configured with source maps for better debugging experience

## Dependencies

- Add new dependencies using npm:
  ```bash
  npm install package-name --save
  ```

- Add dev dependencies:
  ```bash
  npm install package-name --save-dev
  ```

- Update dependencies:
  ```bash
  npm update
  ```

## Resources

- [Project Wiki](/)
- [API Documentation](/api/)
- [Architecture Overview](../architecture/overview.md)
