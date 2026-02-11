# Contributing to Rootly

Thank you for your interest in contributing to Rootly. This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- Node.js v18 or higher
- npm v9 or higher
- PostgreSQL v14 or higher (or a Supabase account)
- Git
- VS Code (recommended for extension development)

### Initial Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Project-Rootly.git
   cd Project-Rootly
   ```

3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/Lancerhawk/Project-Rootly.git
   ```

4. Follow the setup instructions in [README.md](README.md) to configure your development environment

### Keeping Your Fork Updated

Regularly sync your fork with the upstream repository:

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## Project Structure

Rootly is a monorepo containing multiple components:

- **webapp/backend** - Express.js API server with Prisma ORM
- **webapp/frontend** - Next.js 15 application with TypeScript and Tailwind CSS
- **runtime-sdk** - Node.js SDK for error capture (published to npm as `rootly-runtime`)
- **ide-extension** - VS Code extension (published to VS Code Marketplace)
- **test/production-test** - Comprehensive test suite for SDK validation
- **docs** - Technical documentation and architecture guides

For detailed structure information, see [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md).

## Development Workflow

### Branching Strategy

We follow a structured branching model. See [BRANCHING_STRATEGY.md](BRANCHING_STRATEGY.md) for complete details.

**Quick Reference:**

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Critical production fixes

### Working on a Feature

1. Create a new branch from `develop`:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our code standards

3. Commit your changes using conventional commit messages (see [COMMIT_CONVENTION.md](COMMIT_CONVENTION.md))

4. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

5. Open a Pull Request against the `develop` branch

## Code Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode in tsconfig.json
- Avoid using `any` type unless absolutely necessary
- Use explicit return types for functions
- Use interfaces for object shapes

### Code Style

- Use 4 spaces for indentation (backend) or 2 spaces (frontend)
- Use single quotes for strings
- Add semicolons at the end of statements
- Use meaningful variable and function names
- Keep functions small and focused on a single responsibility

### Backend Standards

- Use async/await instead of callbacks
- Handle errors properly with try/catch blocks
- Validate all user input
- Use Prisma for database operations
- Follow REST API conventions for routes
- Add JSDoc comments for complex functions

### Frontend Standards

- Use functional components with hooks
- Keep components small and reusable
- Use TypeScript interfaces for props
- Follow Next.js 15 App Router conventions
- Use Tailwind CSS for styling
- Ensure responsive design for all screen sizes

### SDK Standards

- Minimize dependencies (currently zero runtime dependencies)
- Keep the codebase under 300 lines
- Fail silently to avoid breaking user applications
- Use clear, descriptive error messages
- Optimize for performance and memory usage

### Extension Standards

- Follow VS Code extension best practices
- Use VS Code native icons and theming
- Handle errors gracefully
- Minimize extension activation time
- Test on multiple VS Code versions

## Testing Requirements

### Backend Testing

- Test API endpoints with valid and invalid inputs
- Verify authentication and authorization
- Test database operations
- Ensure proper error handling

### Frontend Testing

- Test component rendering
- Verify user interactions
- Test responsive layouts
- Ensure proper error states

### SDK Testing

Use the comprehensive test suite in `test/production-test`:

```bash
cd test/production-test
npm install
npm start
```

Run all test scenarios and verify errors appear in the Rootly dashboard.

### Extension Testing

1. Open the extension project in VS Code
2. Press F5 to launch Extension Development Host
3. Test all commands and features
4. Verify error handling and edge cases

## Pull Request Process

### Before Submitting

- Ensure your code follows our code standards
- Run all relevant tests
- Update documentation if needed
- Add entries to CHANGELOG.md if applicable
- Ensure your branch is up to date with the target branch

### PR Requirements

1. Fill out the pull request template completely
2. Link related issues using keywords (Fixes, Closes, Resolves)
3. Provide clear description of changes
4. Include screenshots for UI changes
5. Mark breaking changes clearly
6. Ensure CI checks pass

### Review Process

- At least one maintainer must approve the PR
- Address all review comments
- Keep the PR focused on a single feature or fix
- Be responsive to feedback
- Squash commits if requested before merging

### After Merge

- Delete your feature branch
- Update your local repository
- Close related issues if not automatically closed

## Issue Reporting

### Bug Reports

Use the bug report template when creating issues. Include:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment information (OS, Node version, etc.)
- Component affected (webapp, SDK, extension)
- Screenshots or error logs if applicable

### Feature Requests

Use the feature request template. Include:

- Problem statement
- Proposed solution
- Alternative solutions considered
- Use cases
- Component affected

### Security Issues

Do not create public issues for security vulnerabilities. Contact the maintainers directly at the email listed in package.json.

## Commit Message Guidelines

We follow the Conventional Commits specification. See [COMMIT_CONVENTION.md](COMMIT_CONVENTION.md) for complete details.

**Format:**

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, semicolons, etc.)
- `refactor` - Code refactoring without feature changes
- `test` - Adding or updating tests
- `chore` - Maintenance tasks, dependency updates

**Scopes:**

- `backend` - Backend API changes
- `frontend` - Frontend application changes
- `sdk` - Runtime SDK changes
- `extension` - VS Code extension changes
- `docs` - Documentation changes
- `ci` - CI/CD changes

**Examples:**

```
feat(sdk): add severity levels for error capture

fix(backend): correct commit SHA validation regex

docs(readme): update installation instructions
```

## Questions?

If you have questions about contributing, feel free to:

- Open a discussion on GitHub
- Ask in pull request comments
- Review existing issues and PRs for examples

Thank you for contributing to Rootly and helping improve developer experience for everyone.
