---
name: new-page
description: >
  Scaffold a complete new Next.js dashboard page for the WealthWise web app.
  Triggers when asked to "add a page", "create a dashboard screen", "build a UI for <feature>",
  or scaffold any new frontend feature end-to-end. Does not trigger for API-only or backend tasks.
---

Scaffold a complete new dashboard page for the WealthWise web app following all project conventions.

The page/feature name is provided in the task prompt.

## Scope

Create all four layers in this order:

### 1. TanStack Query hooks — `apps/web/src/hooks/use-<entity>.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export const use<Entity>s = () =>
  useQuery({
    queryKey: ['<entities>'],
    queryFn: () => apiClient.get<{ data: <Entity>Response[] }>('<entities>'),
  });

export const use<Entity> = (id: string) =>
  useQuery({
    queryKey: ['<entities>', id],
    queryFn: () => apiClient.get<{ data: <Entity>Response }>(`<entities>/${id}`),
    enabled: !!id,
  });

export const useCreate<Entity> = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Create<Entity>Input) =>
      apiClient.post<{ data: <Entity>Response }>('<entities>', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['<entities>'] });
      toast.success('<Entity> created successfully');
    },
    onError: () => toast.error('Failed to create <entity>'),
  });
};

// useUpdate<Entity> and useDelete<Entity> follow same pattern
```

Rules:
- Always use `apiClient` from `@/lib/api-client` — never raw `fetch`
- TanStack Query v5 syntax (`useQuery`, `useMutation`)
- Sonner toast on every mutation success AND error
- Proper cache invalidation in `onSuccess`

### 2. Components — `apps/web/src/components/<entity>/`

Create at minimum:
- `<Entity>List.tsx` — table or card list with loading skeleton, error state, empty state
- `<Entity>Form.tsx` — create/edit form

All components must:
- Use React Hook Form + `zodResolver` with schema from `@wealthwise/shared-types`
- Use shadcn/ui from `components/ui/` before building custom elements
- Handle loading (use `<Skeleton />`), error, and empty states explicitly
- Work in both light and dark themes (always check `.dark` class)
- Named exports only (no default exports)
- Tailwind CSS only — no inline styles except dynamic CSS custom properties

### 3. Page — `apps/web/src/app/(dashboard)/<route>/page.tsx`

```typescript
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: '<Feature> | WealthWise',
};

export default function <Feature>Page() {
  return (
    <Suspense fallback={<SkeletonFallback />}>
      <Feature>Content />
    </Suspense>
  );
}
```

Default export required by Next.js.

### 4. Sidebar link — `apps/web/src/components/layout/sidebar.tsx`

- Add nav item with appropriate `lucide-react` icon
- Place in correct section (main nav vs settings)
- Use the correct route path

## Standards

- No `any` types. No raw `fetch`. No `useEffect` + fetch patterns.
- Named exports everywhere except the page itself.
- Every form uses `zodResolver` with schemas from `@wealthwise/shared-types`.
- Strict null checks — handle `undefined` from queries explicitly.

## Verification

After scaffolding, run:
```bash
npx turbo lint --filter=@wealthwise/web
npx turbo test --filter=@wealthwise/web
```

Report all created file paths and the URL path for the new page.
