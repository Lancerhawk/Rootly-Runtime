# Changelog

All notable changes to Rootly will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] - 2026-02-06

### 🎉 Initial Release - Web App Foundation

The first release of Rootly establishes the core web application infrastructure with authentication, project management, and a premium user interface.

### Added

#### Authentication & User Management
- GitHub OAuth integration for secure authentication
- Session management with PostgreSQL storage
- User profile with GitHub data sync
- Secure logout functionality with session cleanup

#### Project Management
- Create new projects linked to GitHub repositories
- View all projects in a unified dashboard
- Delete projects with confirmation modal (requires typing repo name)
- Project ownership verification and access control

#### API Key System
- Generate secure API keys for each project
- One-time display of API keys for security
- Cryptographically secure key generation
- API key storage with project association

#### User Interface
- Modern, premium dark-themed design
- Responsive layout for all screen sizes
- Animated particle background on landing page
- Smooth transitions and hover effects
- User dropdown menu in navbar
- Project cards with visual indicators

#### Developer Experience
- Comprehensive README with setup instructions
- Architecture diagrams (Mermaid)
- Database schema documentation
- API documentation
- MIT License

#### Version System
- Version history tracking in JSON format
- Interactive version modal with implemented/planned sections
- Separate scrollable sections for versions and upcoming features
- Clickable version items showing detailed information

### Technical Details

#### Frontend
- Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Custom React components
- Client-side state management

#### Backend
- Node.js with Express.js
- TypeScript
- Prisma 6 ORM
- Passport.js for authentication
- PostgreSQL database via Supabase

#### Database Schema
- Users table with GitHub integration
- Projects table with repository linking
- API keys table with secure storage
- Session table for authentication

### Security
- Environment variable configuration
- Secure session management
- API key encryption
- CORS configuration
- Authentication middleware

---

## [1.0.2] - 2026-02-06

### 🚀 Phase 2 - Production-Ready Error Ingestion

This release hardens the error ingestion system with strict validation, enhanced data capture, and adds a new API for reading incidents.

### Added

#### Hardened Ingest Endpoint
- **Renamed endpoint**: `POST /api/ingest` (was `/api/ingest/error`)
- **Structured payload format** with `error` and `context` objects
- **Strict validation** for all required fields
- **Commit SHA validation**: Enforces 40-character lowercase hex Git SHAs (`^[a-f0-9]{40}$`)
- **Environment validation**: Only accepts "production" or "preview"
- **ISO 8601 timestamp validation** for `occurred_at`
- **Enhanced error responses** with specific error codes and messages
- **201 Created** status code for successful ingestion

#### New Database Fields
- `stack_trace`: Full error stack trace (raw string)
- `error_type`: Error classification (e.g., "TypeError", "ReferenceError")
- `commit_sha`: Git commit SHA where error occurred (required, validated)
- `environment`: Deployment environment ("production" or "preview")
- `occurred_at`: Actual timestamp when error occurred (ISO 8601)
- Removed deprecated `file_path` and `line_number` fields

#### Incidents Read API
- **New endpoint**: `GET /api/incidents`
- **GitHub OAuth authentication** (JWT-based, same as dashboard)
- **Query parameters**: `repo` (required), `status`, `limit`, `offset`
- **Project ownership verification**: Only returns incidents for user's projects
- **Filtering**: By status ("open" or "resolved")
- **Pagination**: Configurable limit (1-100, default 50) and offset
- **Ordered by** `occurred_at` DESC (newest first)
- **Comprehensive error handling**: 401, 404, 400 responses

### Changed
- Ingest endpoint now requires structured payload instead of flat fields
- API key verification improved with proper hash comparison loop
- Database schema updated with new incident fields

### Technical Details
- **Migration**: `20260206002416_phase2_harden_ingest_final`
- **Validation regex**: `/^[a-f0-9]{40}$/` for commit SHAs
- **Response format**: Standardized error objects with `code` and `message`
- **Authentication**: Dual authentication (API keys for ingest, JWT for incidents)

### Documentation
- Added `docs/postman-testing.md` with curl examples
- Added `docs/phase2-migration.md` with upgrade guide
- Added `docs/phase2-validation-checklist.md`
- Added `docs/incidents-api-testing.md`
- Added `docs/test-invalid-commit-sha.md`

---

## [Unreleased]

### Planned for v0.2.0 - Node.js SDK
- Error capture and serialization
- Stack trace parsing with source maps
- Context collection (user data, environment)
- Automatic error reporting
- API integration for error submission
- Zero-overhead performance monitoring

### Planned for v0.3.0 - VS Code Extension
- Real-time error notifications in IDE
- Inline error display at code locations
- Jump to error functionality
- GitHub repository synchronization
- Error filtering and search
- WebSocket integration for live updates

### Planned for v0.4.0 - Error Dashboard
- Real-time error monitoring
- Error analytics and visualization
- Error grouping and deduplication
- Source code viewer with syntax highlighting
- Team collaboration features
- Error assignment and tracking
- Comment system for errors
- Resolution workflow

---

## Version History

- **[1.0.2]** - 2026-02-06 - Phase 2 (Production-Ready Error Ingestion)
- **[1.0.1]** - 2026-02-06 - Initial release (Web App Foundation)

---

## Contributing

See [README.md](README.md) for contribution guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
