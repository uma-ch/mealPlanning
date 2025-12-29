# Recipe Planner

A collaborative recipe planning and grocery management web application designed for small households.

## Features

- **Recipe Collection**: Save recipes from any website using a browser extension
- **Meal Planning**: Drag-and-drop calendar interface for weekly meal planning
- **Grocery Lists**: Auto-generated, categorized shopping lists from planned meals
- **Real-time Collaboration**: Share recipes and meal plans with household members
- **Smart Organization**: Tag-based recipe organization with full-text search

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite for build tooling
- React Router for navigation
- Socket.io client for real-time updates
- dnd-kit for drag-and-drop functionality

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL database
- Socket.io for WebSocket communication
- JWT for authentication

### Browser Extension
- Manifest V3
- TypeScript
- Schema.org recipe extraction

## Project Structure

```
mealPlanning/
├── packages/
│   ├── client/          # React frontend
│   ├── server/          # Node.js backend
│   ├── extension/       # Browser extension
│   └── shared/          # Shared TypeScript types
├── spec.md             # Detailed specification
├── inputspec.md        # Original requirements
└── package.json        # Root package.json (workspace)
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 14+

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cd packages/server
cp .env.example .env
# Edit .env with your configuration
```

3. Create PostgreSQL database:
```bash
createdb recipe_planner
```

4. Run database migrations:
```bash
npm run db:migrate
```

### Development

Run all services in development mode:
```bash
npm run dev
```

Or run services individually:

```bash
# Frontend (http://localhost:3000)
npm run client:dev

# Backend (http://localhost:5000)
npm run server:dev

# Extension (watch mode)
npm run extension:dev
```

### Building for Production

Build all packages:
```bash
npm run build
```

## Database Setup

The database schema includes tables for:
- Users and households
- Recipes and tags
- Calendar entries
- Grocery lists and items
- Magic link authentication tokens

See `packages/server/src/db/schema.sql` for the complete schema.

## API Endpoints

### Authentication
- `POST /api/auth/magic-link` - Send magic link email
- `POST /api/auth/verify` - Verify magic link token
- `POST /api/auth/logout` - Logout user

### Recipes
- `GET /api/recipes` - List recipes for household
- `POST /api/recipes` - Create new recipe
- `GET /api/recipes/:id` - Get recipe details
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe

### Calendar
- `GET /api/calendar` - Get calendar entries
- `POST /api/calendar` - Add recipe to calendar
- `DELETE /api/calendar/:id` - Remove calendar entry

### Grocery List
- `GET /api/grocery` - Get active grocery list
- `POST /api/grocery/generate` - Generate list from recipes
- `PUT /api/grocery/items/:id` - Update item (check/uncheck)
- `POST /api/grocery/items` - Add manual item

### Household
- `POST /api/household` - Create household
- `POST /api/household/join` - Join household via invite code
- `GET /api/household/:id` - Get household details

### Extension
- `POST /api/extension/recipes` - Save recipe from extension

## WebSocket Events

### Client → Server
- `join-household` - Join household room
- `calendar:update` - Calendar entry changed
- `grocery:item-checked` - Grocery item checked/unchecked
- `recipe:added` - New recipe added
- `user:viewing` - User viewing a resource

### Server → Client
- `calendar:updated` - Calendar updated by another user
- `grocery:item-updated` - Grocery item updated
- `recipe:new` - New recipe available
- `user:presence` - User presence information

## Browser Extension

The browser extension uses Schema.org JSON-LD extraction to save recipes from websites.

### Installation

1. Build the extension:
```bash
cd packages/extension
npm run build
```

2. Load in Chrome:
   - Go to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `packages/extension/dist`

### Usage

1. Navigate to a recipe website
2. Click the Recipe Planner extension icon
3. Click "Save Recipe"
4. Review and tag the recipe in the main app

## Development Guidelines

### Code Style

- ESLint and Prettier are configured
- Run `npm run lint` to check code style
- TypeScript strict mode is enabled

### Testing

```bash
npm run test
```

### Type Safety

Shared types are in `packages/shared/src/types.ts` and used across:
- Frontend
- Backend
- Browser Extension

## Deployment

### Backend (Render)

1. Create a new Web Service on Render
2. Connect to this repository
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start -w @recipe-planner/server`
5. Add environment variables from `.env.example`
6. Add PostgreSQL database addon

### Frontend

The frontend can be deployed to any static hosting service (Vercel, Netlify, etc.) or served from the backend.

## Contributing

This is a personal project. See `spec.md` for detailed specifications.

## License

Private - Not for public distribution
