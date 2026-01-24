# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

## Architecture Overview

Clarydo is a collaborative todo app built with Next.js 16 (App Router), Supabase, and React Query.

### Tech Stack
- **Framework**: Next.js 16 with App Router (React 19)
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: React Query (TanStack Query v5) + React Context
- **Styling**: Tailwind CSS v4 + DaisyUI
- **Icons**: lucide-react

### Project Structure

```
app/                    # Next.js App Router pages
├── (auth)/            # Auth route group (sign-in, sign-up)
├── api/               # API routes
├── completed/         # Erledigte Todos Seite
├── invite/[listId]/   # List invite acceptance
├── profile/           # User profile (mit loading.tsx Skeleton)
└── page.tsx           # Main todo list view

src/
├── features/          # Feature-based modules
│   ├── auth/         # Auth provider + components
│   ├── lists/        # List management (components + hooks)
│   ├── todos/        # Todo management (components + hooks)
│   └── shared/       # Global providers, constants, hooks
├── components/        # Shared UI components
├── lib/              # Utilities & infrastructure
│   ├── supabase/     # Supabase clients (server.ts, client.ts, middleware.ts)
│   └── data/         # Server-side data fetching functions
└── types/            # TypeScript definitions
```

### Key Patterns

**Server vs Client Components**: Server Components are the default. Client components are marked with `"use client"` and used for interactivity (modals, forms, real-time updates).

**Data Flow**:
1. Server Components fetch initial data via functions in `src/lib/data/`
2. Data is passed to `ActiveListProviderWithData` which hydrates React Query cache
3. Client components use hooks (`useLists`, `usePollingTodos`) that read from React Query

**Provider Hierarchy** (in `app/layout.tsx`):
```
AuthProvider → ThemeProvider → QueryClientProvider → ActiveListProviderWithData
```

**API Routes Pattern**: All API routes use `getAuthenticatedUser()` from `src/lib/api-auth.ts` for auth. List access is checked via `ensureListAccess()` from `src/lib/list-access.ts`.

**React Query Conventions**:
- Query keys: `["lists"]`, `["todos", listId]`
- Mutations use optimistic updates with rollback on error
- Polling: todos refetch every 8s, presence every 10s

### Database Tables (Supabase)
- `lists` - Todo lists
- `list_members` - Membership with roles (owner, editor, viewer)
- `todos` - Todo items
- `profiles` - User profiles (username)
- `presence` - Real-time user presence
- `list_invites` - Pending invitations

### Path Alias
`@/*` maps to `./src/*` (configured in tsconfig.json)

---

## PWA / Mobile Hinweise

### Safe Areas (iOS)
- `safe-top` Klasse für Padding unter Notch/Dynamic Island
- `safe-bottom` Klasse für Home Indicator Bereich
- Definiert in `app/globals.css`
- **WICHTIG:** Hauptseite (`todo-list.tsx`) muss `h-full safe-top` haben

### Viewport Settings (`app/layout.tsx`)
- `interactiveWidget: "resizes-content"` - Tastatur verkleinert Viewport
- `viewportFit: "cover"` - Content geht bis zu den Rändern
- `100dvh` in CSS für dynamische Viewport-Höhe

### Navigation
- `/` - Hauptseite mit Todo-Liste
- `/completed` - Erledigte Todos (Swipe-back vom linken Rand)
- `/profile` - Benutzereinstellungen

---

## Aktuelle Bugs (zu beheben)

1. **Safe Area Bug**: Nach Navigation von /completed oder /profile zurück zur Hauptseite fehlt das Top-Padding
2. **Keyboard Gap**: Abstand zwischen Input-Feld und Tastatur nach Keyboard-Nutzung
3. **useVisualViewport Hook**: Verursacht Layout-Probleme, sollte entfernt werden
