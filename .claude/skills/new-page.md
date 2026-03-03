Scaffold a complete new dashboard page for the WealthWise web app following all project conventions.

The page/feature name is: $ARGUMENTS

## What to create

Follow the exact pattern from CLAUDE.md — create all four layers:

### 1. Shared types (if entity doesn't exist yet)
Check `packages/shared-types/src/schemas/` first. If no schema exists, note that one is needed and reference the `/api-endpoint` skill.

### 2. TanStack Query hooks (`apps/web/src/hooks/use-<entity>.ts`)
Create the full standard hook set:
- `use<Entity>s()` — list all, calls `GET /api/v1/<entities>`
- `use<Entity>(id: string)` — single record, calls `GET /api/v1/<entities>/:id`
- `useCreate<Entity>()` — mutation, calls `POST /api/v1/<entities>`, invalidates list query on success
- `useUpdate<Entity>()` — mutation, calls `PUT /api/v1/<entities>/:id`, invalidates list + single
- `useDelete<Entity>()` — mutation, calls `DELETE /api/v1/<entities>/:id`, invalidates list

All hooks must:
- Use `apiClient` from `lib/api-client.ts` (never raw fetch)
- Use proper TanStack Query v5 syntax (`useQuery`, `useMutation`)
- Include `queryKey` arrays that enable proper cache invalidation
- Show Sonner toast on mutation success AND error

### 3. Components (`apps/web/src/components/<entity>/`)
Create at minimum:
- `<Entity>List.tsx` — table or card list with loading skeleton, error state, empty state
- `<Entity>Form.tsx` — create/edit form using React Hook Form + zodResolver + schema from shared-types
- `<Entity>Card.tsx` (if appropriate for the entity)

All components must:
- Use shadcn/ui primitives from `components/ui/` before building custom ones
- Handle loading, error, and empty states explicitly
- Use Tailwind CSS only (no inline styles except dynamic CSS custom properties)
- Work correctly in both light and dark themes (check `.dark` class)
- Use named exports (no default exports, except the Next.js page itself)

### 4. Page (`apps/web/src/app/(dashboard)/<route>/page.tsx`)
- Add `export const metadata` for the page title
- Use a Suspense boundary with a skeleton fallback
- Default export (required by Next.js)

### 5. Sidebar link (`apps/web/src/components/layout/sidebar.tsx`)
- Add the nav item with the correct icon from `lucide-react`
- Place it in the correct section (main nav vs settings)

## Standards
- No `any` types. No raw `fetch`. No default exports except the page.
- All forms use `zodResolver` with schemas from `@wealthwise/shared-types`
- TanStack Query for all data fetching — no `useEffect` + fetch patterns
- Sonner toasts on every mutation

After scaffolding, list all files created and the URL path for the new page.
