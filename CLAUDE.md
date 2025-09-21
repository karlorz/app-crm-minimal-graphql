# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server (frontend only)
- `npm run dev:server` - Start GraphQL server only
- `npm run dev:full` - Start both GraphQL server and frontend concurrently
- `npm run build` - Build the application (TypeScript + Vite)
- `npm run codegen` - Generate GraphQL types
- `npm run format` - Format code with Prettier
- `npm run lint` - Run ESLint with auto-fix

### Testing
- Tests are located in `src/utilities/date/get-date-colors.test.ts`
- No test runner configured - project uses Jest but lacks test script
- Individual tests can be run with: `npx jest src/utilities/date/get-date-colors.test.ts`

## Project Architecture

### Tech Stack
- **Framework**: Refine (React meta-framework for internal tools)
- **UI**: Ant Design v5 with React 19
- **GraphQL**: Apollo Server with subscriptions, local development server
- **Build**: Vite with TypeScript
- **Styling**: Ant Design + custom CSS-in-JS via ConfigProvider

### Directory Structure
```
src/
├── components/          # Reusable UI components
│   ├── layout/         # App layout components (header, sidebar, settings)
│   ├── tags/           # Status/user/contact tags
│   ├── tasks/          # Kanban board and task components
│   └── utilities/      # Utility components (Text, Avatar, etc.)
├── config/             # Resource configurations
├── graphql/            # GraphQL queries and mutations
├── pages/              # Page components (Companies, Tasks, Dashboard)
├── providers/          # Data and auth providers
├── routes/             # Route components
└── utilities/          # Utility functions
```

### GraphQL Architecture
- **Server**: Local GraphQL server in `graphql-server/` with Apollo Express
- **Schema**: Comprehensive CRM schema with Users, Companies, Contacts, Deals, Tasks, Events
- **Features**: Real-time subscriptions, filtering, sorting, pagination, aggregations
- **Code Generation**: Automated TypeScript types via GraphQL Codegen
- **Endpoints**:
  - GraphQL: `http://localhost:4000/graphql`
  - WebSocket: `ws://localhost:4000/graphql`

### Key Patterns

#### Data Provider
- Uses `@refinedev/nestjs-query` for GraphQL integration
- Custom fetch wrapper in `src/providers/data/fetch-wrapper.ts`
- Live subscriptions for real-time updates
- Authentication via Bearer tokens in localStorage

#### Authentication
- Simple email-based authentication (no password validation in dev)
- JWT-like tokens stored in localStorage
- Provider in `src/providers/auth.ts`

#### Resources
- Resources defined in `src/config/resources.ts`
- Companies, Contacts, Deals, Tasks, Users, Dashboard
- Each resource has list, create, edit, show pages

#### UI Components
- Ant Design with extensive customization
- Custom Text component with size variants
- Avatar components with initials fallback
- Responsive design patterns throughout

### State Management
- Refine handles data fetching, caching, and state
- Real-time updates via GraphQL subscriptions
- Local component state via React hooks
- Form state via Ant Design Form and Refine hooks

### Styling Conventions
- Ant Design theme customization via ConfigProvider
- Custom size variants for Typography.Text
- Consistent spacing and color tokens
- Responsive breakpoints handled by Ant Design

### Import Organization
- ESLint `simple-import-sort` enforces import order:
  1. React
  2. @refinedev packages
  3. Other @ packages
  4. Relative imports (bare, then with .)
  5. Side-effect imports

### Code Generation
- GraphQL types auto-generated in `src/graphql/`
- Schema types in `schema.types.ts`
- Operation types in `types.ts`
- Post-generation hooks run ESLint and Prettier

## Development Environment

### Local Development
1. Install dependencies: `npm install`
2. Install server dependencies: `cd graphql-server && npm install`
3. Start full environment: `npm run dev:full`
4. Frontend: http://localhost:5173
5. GraphQL Playground: http://localhost:4000/graphql

### Mock Data
- Server loads from `graphql-server/demo-data.json` or uses minimal defaults
- Includes sample users, companies, contacts, deals, tasks, events
- Audit trail for tracking changes
- Real-time subscriptions for live updates

### Key Dependencies
- `@refinedev/core` - Core framework
- `@refinedev/antd` - Ant Design integration
- `@refinedev/nestjs-query` - GraphQL data provider
- `@refinedev/react-router` - Routing
- `antd` - UI components
- `graphql` - GraphQL client
- `dayjs` - Date handling
- `react` and `react-dom` v19

### File Conventions
- Components: PascalCase, `.tsx` extension
- Pages: PascalCase with `Page` suffix
- Utilities: camelCase, `.ts` extension
- Styles: CSS-in-JS via theme configuration
- Types: Auto-generated from GraphQL schema