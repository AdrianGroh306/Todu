# CLAUDE.md

> **Diese Datei ist die zentrale Wissensbasis für das Projekt.** Sie wird kontinuierlich aktualisiert mit Todos, aktuellen Überlegungen, Architektur-Entscheidungen und Erkenntnissen. Halte diese Datei immer up-to-date!

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint

# Release erstellen (bumpt Version, updated SW, erstellt Commit + Tag)
npm run release patch   # Bugfixes: 1.0.0 → 1.0.1
npm run release minor   # Features: 1.0.0 → 1.1.0
npm run release major   # Breaking: 1.0.0 → 2.0.0
```

---

## Aktuelle Todos

- [x] **Benachrichtigungen-Bereich immer anzeigen** - Im Profil wird der Benachrichtigungen-Bereich manchmal am Anfang nicht angezeigt. Sollte immer sichtbar sein (ist eine Einstellung).
- [x] **Neue Liste als aktive Liste setzen** - Wenn eine Liste erstellt wird, sollte diese automatisch die aktive Liste werden.
- [x] **Splash Screen mit Animation** - Natives Gefühl verbessern mit animiertem Splash Screen beim App-Start.

---

## Aktuelle Überlegungen & Erkenntnisse

### Visual Viewport & iOS Keyboard (2026-02-03)

**Problem:** Am unteren Bildschirmrand erschien ein leerer Bereich, besonders sichtbar auf der Profilseite beim Scrollen. Das Input-Feld wurde außerdem zu weit hochgeschoben. Modals (ListSelectionModal, ProfileModal) passten sich nicht an wenn die Tastatur geöffnet wurde.

**Ursache:**
1. Der `useVisualViewport` Hook setzte `--vvh` immer auf die Visual Viewport Höhe (auch ohne Tastatur)
2. Hook wurde nur in `TodoList` verwendet, nicht global
3. Modals nutzten `fixed inset-0` statt die `--vvh` Variable

**Lösung:**
1. **ViewportProvider** erstellt (`src/features/shared/providers/viewport-provider.tsx`)
   - Globaler Provider statt Hook in einzelner Komponente
   - `--vvh` wird nur bei offener Tastatur gesetzt (Differenz > 150px)
   - Bei geschlossener Tastatur: CSS-Fallback `100dvh` greift
2. **Modals angepasst** - nutzen jetzt `style={{ height: "var(--vvh, 100dvh)" }}`
   - `src/components/modal.tsx`
   - `src/features/auth/components/profile-modal.tsx`
   - `src/features/todos/components/completed-todos-page.tsx`
3. **Provider-Hierarchie** in `app/(todos)/layout.tsx`:
   ```
   ViewportProvider → ActiveListProviderWithData → ModalManagerProvider
   ```

### Liste erstellen setzt aktive Liste (2026-02-03)

**Problem:** Neue Liste wurde nicht als aktive Liste gesetzt nach Erstellung.

**Ursache:** `useEffect` in `active-list-provider.tsx` prüft ob `activeListId` in `lists` existiert. Wenn Query noch nicht aktualisiert war, wurde auf `lists[0]` zurückgesetzt.

**Lösung:** In `use-lists.ts` - `createList` Mutation verwendet jetzt `setQueryData` statt `invalidateQueries`:
```tsx
onSuccess: (newList) => {
  queryClient.setQueryData<ListSummary[]>(listsQueryKey, (old) =>
    old ? [...old, newList] : [newList]
  );
}
```
→ Neue Liste ist sofort im Cache verfügbar bevor `setActiveListId` aufgerufen wird.

### ListSelectionModal UX verbessert (2026-02-03)

**Änderung:** Liste-Erstellen-Formular jetzt konsistent mit TodoInput:
- Input-Feld links, Plus-Button rechts (wie bei Todos)
- Kein separater Abbrechen-Button
- Abbrechen durch Blur (Klick außerhalb) wenn Input leer ist
- iOS keyboard fix: `handleInputFocus` resettet Scroll
- `shrink-0` für den Footer-Bereich damit er nicht schrumpft

### iOS Input Accessory Bar (2026-02-03)

**Erkenntnis:** Die iOS Keyboard Accessory Bar (Pfeile + Fertig-Button) ist ein **natives iOS 26 Feature** und kann nicht per Web-Technologie entfernt werden - weder bei `<input>` noch bei `contenteditable` Elementen.

**Versuch:** `contenteditable` divs wurden getestet, aber Safari iOS behandelt sie genauso wie Inputs.

**Status:** Akzeptiert als iOS-Feature. Wichtiger ist, dass das Input-Feld korrekt über der Tastatur angezeigt wird (via `useVisualViewport` Hook).

### Service Worker Caching (2026-02-03)

**Problem:** Änderungen werden auf iOS nicht sofort sichtbar wegen Service Worker Cache.

**Cache leeren:**
- iOS: Einstellungen → Safari → Verlauf und Websitedaten löschen
- Oder: PWA vom Home-Bildschirm löschen und neu hinzufügen
- Dev: Server neu starten + Hard Refresh

**Service Worker Datei:** `public/sw.js`
- `CACHE_NAME = "todu-cache-v2"` - Version erhöhen bei Breaking Changes
- Navigations gehen immer zum Netzwerk (kein stale HTML)
- Nur statische Assets werden cache-first geladen

### iOS PWA Assets - Vor Release finalisieren! (2026-02-09)

**Wichtig:** Folgende Assets werden von iOS **nur beim Installieren** der PWA gecached und können danach **nicht mehr aktualisiert** werden ohne die App neu zu installieren:

- `apple-touch-startup-image` (Splash Screen Bild)
- `apple-touch-icon` (App Icon)
- App-Name im Manifest

**Konsequenz:** Diese Assets müssen **vor dem offiziellen Release** finalisiert sein! Spätere Änderungen erfordern, dass Nutzer die PWA vom Home-Bildschirm löschen und neu hinzufügen.

**Dateien:**
- `/public/splash.png` - iOS Splash Screen (1170x2532px)
- `/public/icons/apple-touch-icon.png` - iOS App Icon (180x180px)
- `/public/manifest.webmanifest` - App-Name und Icons

**Splash generieren:** `scripts/generate-splash.html` im Browser öffnen

---

## Architecture Overview

Todu is a collaborative todo app built with Next.js 16 (App Router), Supabase, and React Query.

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
├── (todos)/           # Todos route group (Hauptseite + Completed)
├── api/               # API routes
├── invite/[listId]/   # List invite acceptance
└── layout.tsx         # Root layout mit Providers

src/
├── features/          # Feature-based modules
│   ├── auth/         # Auth provider + components (inkl. ProfileModal)
│   ├── lists/        # List management (components + hooks)
│   ├── todos/        # Todo management (components + hooks)
│   └── shared/       # Global providers, constants, hooks
├── components/        # Shared UI components
├── lib/              # Utilities & infrastructure
│   ├── supabase/     # Supabase clients (server.ts, client.ts, middleware.ts)
│   └── data/         # Server-side data fetching functions
└── types/            # TypeScript definitions
```

### Modal-basierte Navigation

Statt separater Routes werden einige Views als Modals geöffnet:
- **ProfileModal** (`src/features/auth/components/profile-modal.tsx`) - Benutzereinstellungen
- **CompletedTodosPage** (`src/features/todos/components/completed-todos-page.tsx`) - Erledigte Todos
- Modals werden über `ModalManagerProvider` gesteuert

### Key Patterns

**Server vs Client Components**: Server Components are the default. Client components are marked with `"use client"` and used for interactivity (modals, forms, real-time updates).

**Data Flow**:
1. Server Components fetch initial data via functions in `src/lib/data/`
2. Data is passed to `ActiveListProviderWithData` which hydrates React Query cache
3. Client components use hooks (`useLists`, `usePollingTodos`) that read from React Query

**Provider Hierarchy**:
- `app/layout.tsx`: `AuthProvider → ThemeProvider → QueryClientProvider`
- `app/(todos)/layout.tsx`: `ViewportProvider → ActiveListProviderWithData → ModalManagerProvider`

**API Routes Pattern**: All API routes use `getAuthenticatedUser()` from `src/lib/api-auth.ts` for auth. List access is checked via `ensureListAccess()` from `src/lib/list-access.ts`.

**React Query Conventions**:
- Query keys: `["lists"]`, `["todos", listId]`, `["profile", userId]`
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
- `pt-safe` für fixed Overlays die body-padding ignorieren
- Definiert in `app/globals.css`

### Viewport & Keyboard Handling
- `interactiveWidget: "resizes-content"` - Tastatur verkleinert Viewport
- `viewportFit: "cover"` - Content geht bis zu den Rändern
- **ViewportProvider** (`src/features/shared/providers/viewport-provider.tsx`)
  - Setzt `--vvh` nur bei offener Tastatur (Differenz > 150px)
  - Body hat `height: var(--vvh, 100dvh)` - nutzt 100dvh wenn keine Tastatur
- **Modals** müssen `style={{ height: "var(--vvh, 100dvh)" }}` verwenden
  - Nicht `inset-0` für die Höhe, sonst reagieren sie nicht auf Tastatur

### Navigation
- `/` - Hauptseite mit Todo-Liste
- Profile & Completed Todos werden als Modals geöffnet (keine separaten Routes)

---

## Styling-Regeln

1. **Tailwind First**: Immer Tailwind-Klassen verwenden
2. **CSS nur wenn nötig**: Nur `globals.css` nutzen wenn Tailwind nicht ausreicht
3. **Keine Inline-Styles**: Außer für dynamische Werte (z.B. CSS-Variablen)
4. **Theme-Variablen**: `--theme-*` Variablen für konsistente Farben nutzen
