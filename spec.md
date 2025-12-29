# Recipe Planning App - Detailed Specification

## Project Overview

A collaborative recipe planning and grocery management web application designed for small households (2-10 users). The app enables users to collect recipes from websites, organize them with tags, plan meals on a calendar, and generate categorized grocery lists.

### Key Goals
- Simplify recipe collection by removing website clutter
- Enable collaborative meal planning for households
- Streamline grocery shopping with organized, categorized lists
- Provide a clean, mobile-responsive experience

---

## Core Features

### 1. Recipe Collection & Management

#### Recipe Capture from Websites
- **Browser Extension**: Chromium-based (Chrome/Edge), Safari, and mobile browser support
- **Extraction Method**:
  - Primary: Schema.org JSON-LD structured data extraction
  - Fallback: Save full page snapshot (HTML/screenshot) as backup
  - Manual entry option always available
- **Extension UX Flow**:
  - One-click save via extension icon
  - Recipe saves immediately to backend (dedicated extension endpoint)
  - User reviews and adds tags/details later in main app
- **Duplication Handling**:
  - Check URL before saving
  - Block duplicate saves and show existing recipe
  - Helps maintain clean recipe collection

#### Recipe Data Structure
- **Hybrid Approach**:
  - Initially save as text-based content
  - Support optional manual structuring by users
  - Store: title, ingredients (text), instructions (text), source URL, image URL (reference only)
  - Track: who added it, when added, whether it was modified from source

#### Recipe Creation & Editing
- **Manual Recipe Creation**: Full form for adding recipes from cookbooks, handwritten notes, or original creations
- **Full Editing**: Users can edit all fields of any recipe (including web-scraped ones)
- **Error Handling**: When scraping fails, show friendly error message and offer manual entry fallback

#### Recipe Organization
- **Tags Only**: No folders or complex hierarchies
- **Default Tags**: Ship with suggested tags (dinner, lunch, breakfast, quick, healthy, weeknight, vegetarian, etc.)
- **Tag Filtering**: OR filter (show recipes with ANY selected tags)
- **Search**: Full-text search across recipe title and ingredients

#### Recipe Detail View
- **Priority Display**: Source attribution (original URL, user who added it)
- Additional: ingredients, instructions, tags, image (if available)
- **Images**: Store URLs from original source only (no self-hosting)

### 2. Calendar-Based Meal Planning

#### Calendar Interface
- **Primary View**: Week view (7 days horizontal)
- **Scope**: One recipe per day initially
- **Historical Data**: Keep past meal plans visible as a log
- **Future Planning**: Allow unlimited future planning (weeks/months in advance)

#### Adding Recipes to Calendar
- **Interaction**: Drag and drop from recipe list to calendar days
- **Implementation**: Use drag-and-drop library (react-beautiful-dnd or dnd-kit)
- **No Portion Scaling**: Recipes added as-is (no serving size adjustment initially)

#### Calendar Real-Time Collaboration
- **Sync Events**: Calendar changes (recipe added/removed from days) sync in real-time via WebSocket
- **Conflict Resolution**:
  - Prevent editing if another household member is viewing/editing the same item
  - Show "Partner is viewing this recipe" type indicators
  - Basic locking mechanism to avoid conflicts

### 3. Grocery List Generation

#### List Generation
- **Recipe Selection**: Manual selection of which recipes to include (checkboxes)
- **Not Time-Based**: User explicitly chooses recipes rather than auto-selecting by date range
- **Manual Entries**: Allow adding arbitrary items not tied to recipes (staples, household items)

#### Ingredient Organization
- **Categorization**: Auto-categorize ingredients by category
- **Method**: Simple keyword matching (e.g., "milk" → dairy, "carrot" → produce)
- **Manual Override**: Users can change category assignments
- **Default Categories**: Standard US grocery layout
  - Produce
  - Meat & Seafood
  - Dairy & Eggs
  - Bakery
  - Pantry/Dry Goods
  - Frozen
  - Other

#### List Consolidation
- **Simple Concatenation**: Display all ingredients grouped by category
- **No Quantity Merging**: Show items separately (e.g., "2 cups milk" and "1 cup milk" stay separate)
- User does mental math for combining quantities

#### Shopping Experience
- **Mobile-First**: Bottom sheet navigation pattern for mobile
- **Checkbox Interface**: Simple check-off list as items are purchased
- **Real-Time Sync**: Check-offs sync in real-time across household members
- **Persistence**: Check-off state saved to database with real-time sync
- **Export Options**: Export to text or email for sharing/printing

### 4. Multi-User Collaboration

#### Household Model
- **Shared Account**: Real-time collaborative model
- **Setup**: First user creates household, generates invite code/link
- **Invitation**: Other members join via shareable link/code
- **Scale**: Designed for 2-10 users per household

#### Authentication
- **Method**: Magic link (passwordless email login)
- **No OAuth**: Keep authentication simple initially

#### Real-Time Sync
- **Technology**: Socket.io for WebSocket communication
- **Sync Events**:
  - Calendar changes (recipe added/removed from days)
  - Grocery list check-offs during shopping
- **Last Write Wins**: Simple conflict resolution with editing locks

---

## Technical Architecture

### Frontend

#### Framework & Libraries
- **Core**: React with hooks
- **State Management**: React Context for global state (auth, household) + local component state
- **Routing**: React Router
- **Drag & Drop**: react-beautiful-dnd or dnd-kit
- **UI Framework**: Mobile-first, bottom sheet navigation
- **Language**: TypeScript

#### Platform
- **Web App**: Desktop and mobile responsive
- **Progressive Enhancement**: Works on all modern browsers
- **No Native Apps**: Web-only initially

### Backend

#### Framework & Structure
- **Runtime**: Node.js with TypeScript
- **API**: REST API with Express.js
- **Real-Time**: Socket.io for WebSocket layer
- **Extension Endpoint**: Dedicated endpoint for browser extension recipe submission

#### Database
- **Primary DB**: PostgreSQL
- **Schema Approach**:
  - Recipes table (immutable references)
  - Calendar entries reference recipe ID
  - Users and households tables
  - Grocery lists and items tables
- **Real-Time Layer**: WebSocket layer on top of PostgreSQL for live updates

### Browser Extension

#### Architecture
- **Browsers**: Chromium (Chrome/Edge), Safari, mobile browsers
- **Manifest**: V3 for Chrome compliance
- **Extraction**: Schema.org JSON-LD parser with full page snapshot fallback
- **Communication**: Direct API calls to dedicated extension backend endpoint
- **Authentication**: Token-based (user must be logged in)

### Deployment

#### Hosting
- **Platform**: Render (Platform-as-a-Service)
- **Services**:
  - Web server (Node.js + React)
  - PostgreSQL database
  - WebSocket server (can be same as web server)

---

## Data Models

### Key Entities

#### Recipe
```typescript
{
  id: uuid
  title: string
  ingredients: text  // Initially unstructured
  instructions: text
  source_url: string (nullable)
  image_url: string (nullable)
  created_by: user_id
  created_at: timestamp
  modified_at: timestamp
  was_modified: boolean  // Track if user edited scraped recipe
  raw_html_backup: text (nullable)  // For failed extractions
  household_id: uuid
}
```

#### RecipeTag
```typescript
{
  id: uuid
  recipe_id: uuid
  tag: string
}
```

#### CalendarEntry
```typescript
{
  id: uuid
  household_id: uuid
  recipe_id: uuid
  date: date
  created_at: timestamp
}
```

#### GroceryList
```typescript
{
  id: uuid
  household_id: uuid
  created_at: timestamp
  is_active: boolean
}
```

#### GroceryListItem
```typescript
{
  id: uuid
  grocery_list_id: uuid
  recipe_id: uuid (nullable)  // Null if manually added
  ingredient_text: string
  category: string
  is_checked: boolean
  checked_at: timestamp (nullable)
}
```

#### User
```typescript
{
  id: uuid
  email: string
  household_id: uuid
  created_at: timestamp
}
```

#### Household
```typescript
{
  id: uuid
  name: string
  invite_code: string
  created_at: timestamp
}
```

---

## User Experience & Interface

### Navigation Structure
- **Main Sections**:
  - Recipes (list/search view)
  - Calendar (week view)
  - Grocery List (current active list)

### Mobile Experience
- **Pattern**: Bottom sheet navigation
- **Responsive**: Mobile-first design approach
- **Touch**: Optimized for touch interactions on grocery list

### Desktop Experience
- **Layout**: Sidebar navigation
- **Drag & Drop**: Full drag-and-drop support for calendar
- **Multi-Column**: Recipe list + calendar side-by-side where appropriate

---

## Implementation Details

### Recipe Extraction Logic

1. **Extension Activation**: User clicks extension icon on recipe page
2. **Schema.org Attempt**: Parse page for JSON-LD recipe markup
3. **Fallback**: If no schema data found, save full page HTML snapshot
4. **API Call**: POST to `/api/extension/recipes` with extracted data
5. **Response**: Return recipe ID for user confirmation
6. **Review**: User opens app to add tags and review extraction quality

### Calendar Interaction Flow

1. **Recipe List**: Show all household recipes with search/filter
2. **Calendar Grid**: Display week view with dates
3. **Drag Initiation**: User drags recipe card
4. **Drop Zone**: Highlight valid calendar days
5. **Drop Action**: Create calendar entry, sync via WebSocket
6. **Real-Time Update**: Other household members see update immediately

### Grocery List Generation Flow

1. **Recipe Selection**: Show all calendar entries with checkboxes
2. **Manual Additions**: Input field for non-recipe items
3. **Generate**: Parse selected recipes' ingredients
4. **Categorize**: Apply keyword matching for categories
5. **Display**: Show grouped by category with checkboxes
6. **Persistence**: Save list to database as user shops
7. **Real-Time**: Sync check-offs across household

### Real-Time Sync Architecture

```
Client (React)
  ↕ Socket.io client
WebSocket Server (Socket.io)
  ↕ PostgreSQL

Events:
- calendar:update
- groceryList:itemChecked
- recipe:added
- user:presenceChange
```

---

## Edge Cases & Special Considerations

### Recipe Duplication
- **Detection**: Check source URL before saving
- **Action**: Block save and show existing recipe link
- **User Flow**: Redirect to existing recipe for review

### Grocery List Persistence
- **Storage**: All check-offs saved to database immediately
- **Sync**: Real-time sync ensures no data loss on refresh
- **Recovery**: User can refresh/close app and resume shopping

### Failed Recipe Extraction
- **User Feedback**: Show friendly error message explaining failure
- **Fallback Option**: Offer manual recipe entry form
- **Data Preservation**: Save URL and raw HTML for potential retry

### Concurrent Editing
- **Detection**: Track who is viewing/editing each recipe
- **Prevention**: Show "User X is editing" message
- **Lock**: Prevent simultaneous edits to same resource

### Empty States
- **No Recipes**: Guide user to add first recipe (extension or manual)
- **Empty Calendar**: Prompt to drag recipes onto days
- **No Grocery List**: Explain how to select recipes and generate list

---

## Testing Strategy

### Unit Tests
- **Recipe parsing** logic (Schema.org extraction)
- **Ingredient categorization** keyword matching
- **Date handling** for calendar entries
- **Duplication detection** logic

### Coverage Focus
- Critical business logic
- Data transformations
- Utility functions
- Real-time sync edge cases

### Manual Testing
- Browser extension on various recipe sites
- Drag and drop across browsers
- Real-time sync with multiple users
- Mobile responsive behavior

---

## Development Phases

### Phase 1: Core Infrastructure
- Database schema and migrations
- Authentication (magic link)
- Household creation and invitations
- Basic API structure

### Phase 2: Recipe Management
- Manual recipe creation
- Recipe list view and search
- Tag system
- Recipe detail view

### Phase 3: Browser Extension
- Extension manifest and structure
- Schema.org extraction
- Backend endpoint for extension
- Error handling and fallbacks

### Phase 4: Calendar
- Week view calendar UI
- Drag and drop implementation
- Calendar entry CRUD
- Basic persistence

### Phase 5: Grocery Lists
- List generation from selected recipes
- Category assignment
- Checkbox interface
- Export functionality

### Phase 6: Real-Time Collaboration
- Socket.io integration
- Calendar sync
- Grocery list sync
- Presence/editing indicators

### Phase 7: Polish & Testing
- Mobile responsive refinement
- Error handling improvements
- Unit test coverage
- Performance optimization

---

## Future Considerations (Not in Initial Scope)

### Potential V2 Features
- Recipe portion scaling
- Smart grocery list merging (quantity calculation)
- Recipe image upload/storage
- Export/import data
- Recipe sharing beyond household
- Nutritional information
- Cooking timers
- Shopping list store layout optimization
- Recipe collections/cookbooks
- Advanced search filters
- Accessibility enhancements

### Known Limitations
- No offline support initially
- No recipe deletion cascade handling
- No data export/backup
- No social sharing features
- No advanced accessibility features
- No portion scaling

---

## Technical Dependencies

### Frontend
- React 18+
- TypeScript
- React Router
- Socket.io-client
- react-beautiful-dnd or dnd-kit
- CSS modules or styled-components

### Backend
- Node.js 18+
- Express.js
- TypeScript
- Socket.io
- PostgreSQL client (pg)
- JSON Web Tokens (for magic link)
- Nodemailer (for magic link emails)

### Database
- PostgreSQL 14+

### Development Tools
- Vite or Create React App
- Jest for testing
- ESLint + Prettier
- Git for version control

---

## Security Considerations

### Authentication
- Magic link tokens expire after 15 minutes
- Tokens single-use only
- HTTPS required for all production traffic

### API Security
- CORS configuration for extension
- Rate limiting on API endpoints
- Input validation and sanitization
- SQL injection prevention via parameterized queries

### Data Privacy
- Household data isolation (users only see their household)
- Invite codes are unique and non-guessable
- User emails not shared across households

---

## Performance Targets

### Small Scale Optimization
- Support 2-10 users per household
- Handle 100-1000 recipes per household smoothly
- Calendar: 52+ weeks of planning data
- Grocery lists: 50-200 items per list

### Response Times
- API responses: < 200ms for standard queries
- Real-time sync: < 100ms latency
- Page loads: < 2 seconds on 3G mobile

---

## Success Metrics

### Core Functionality
- Users can save recipe in < 5 seconds via extension
- Calendar planning takes < 30 seconds per week
- Grocery list generation is instant (< 1 second)
- Mobile grocery list is usable one-handed

### Collaboration
- Real-time sync works across 2+ devices
- No data loss during concurrent editing
- Household invitation works on first try

---

## Open Questions & Decisions

### Resolved
- ✓ Platform: Web app (mobile responsive)
- ✓ Tech stack: TypeScript + React + Node + PostgreSQL
- ✓ Authentication: Magic link
- ✓ Multi-user: Shared household model
- ✓ Real-time: Socket.io
- ✓ Hosting: Render
- ✓ Recipe data: Hybrid text-based with optional structure
- ✓ Calendar: Week view, drag & drop, one recipe per day
- ✓ Grocery list: Manual selection, simple categorization
- ✓ Browser support: Chrome/Edge, Safari, mobile

### Deferred
- Recipe deletion cascade behavior (not handling initially)
- Advanced accessibility features
- Data export/import
- Social sharing features
- Recipe scaling

---

## Glossary

- **Household**: Group of users sharing recipes and meal plans
- **Recipe**: Saved cooking instructions from web or manual entry
- **Calendar Entry**: Association of a recipe to a specific date
- **Grocery List**: Generated list of ingredients from selected recipes
- **Tag**: User-defined label for organizing recipes
- **Magic Link**: Passwordless login via email link
- **Schema.org**: Structured data format used by many recipe websites

---

*This specification represents the agreed-upon scope and implementation approach for the Recipe Planning App v1.0*
