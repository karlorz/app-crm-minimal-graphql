# Local Development Setup

This guide shows how to run the CRM minimal example with a local GraphQL server instead of the remote API.

## Quick Start

### 1. Install Dependencies

First, install dependencies for both the main app and the GraphQL server:

```bash
# Install main app dependencies
npm install

# Install GraphQL server dependencies
cd graphql-server
npm install
cd ..
```

### 2. Start Both Server and Client

Run both the GraphQL server and the frontend simultaneously:

```bash
npm run dev:full
```

This will start:
- GraphQL server at `http://localhost:4000/graphql`
- Frontend at `http://localhost:5173`

### 3. Alternative: Start Separately

If you prefer to start them separately:

```bash
# Terminal 1: Start GraphQL server
npm run dev:server

# Terminal 2: Start frontend
npm run dev
```

## GraphQL Server Details

The local GraphQL server includes:

### Mock Data
- **Users**: 2 sample users (John Doe, Jane Smith)
- **Companies**: 2 sample companies (Acme Corporation, Tech Solutions Inc)
- **Contacts**: 2 sample contacts
- **Deals**: 2 sample deals with values
- **Deal Stages**: 4 stages (Qualify, Proposal, Won, Lost)
- **Tasks**: 1 sample task
- **Task Stages**: 4 stages (TODO, IN_PROGRESS, IN_REVIEW, DONE)

### Features
- Full GraphQL schema matching the original API
- Filtering, sorting, and pagination support
- Real-time subscriptions
- CRUD operations for companies
- Authentication simulation
- Deal aggregations (sum, avg, count, min, max)

### GraphQL Playground

Visit `http://localhost:4000/graphql` to access the GraphQL playground and explore the schema.

### Example Query

```graphql
query GetCompanies {
  companies(
    filter: {}
    sorting: [{ field: name, direction: ASC }]
    paging: { limit: 10, offset: 0 }
  ) {
    totalCount
    nodes {
      id
      name
      salesOwner {
        name
      }
      dealsAggregate {
        sum {
          value
        }
      }
    }
  }
}
```

## Configuration Changes

The following files have been modified to use the local server:

1. **`src/providers/data/index.ts`**: Updated API URLs to point to localhost:4000
2. **`graphql.config.ts`**: Updated schema URL for code generation
3. **`package.json`**: Added scripts for running the local server

## Switching Back to Remote API

To switch back to the remote API, revert these changes:

```typescript
// In src/providers/data/index.ts
export const API_BASE_URL = "https://api.crm.refine.dev";
export const API_URL = `${API_BASE_URL}/graphql`;
export const WS_URL = "wss://api.crm.refine.dev/graphql";

// In graphql.config.ts
schema: "https://api.crm.refine.dev/graphql"
```

## Troubleshooting

### Port Conflicts
If port 4000 is already in use, edit `graphql-server/index.js` and change the port:

```javascript
const httpServer = app.listen(4001, () => { // Change to 4001 or another port
```

Then update the API URLs in `src/providers/data/index.ts` accordingly.

### CORS Issues
The server is configured to allow requests from `http://localhost:5173` and `http://localhost:3000`. If you're running on a different port, update the CORS configuration in `graphql-server/index.js`.

### Dependencies
Make sure you have Node.js 18+ installed. The GraphQL server uses modern JavaScript features.