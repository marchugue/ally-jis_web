# Ally-jis Project Standards

## Tech Stack
- **Frontend:** React 18 (Vite, TypeScript)
- **Styling:** Tailwind CSS, Shadcn UI (Radix), Framer Motion
- **Backend:** Supabase (Auth, DB, Storage, Realtime)
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React

## Core Mandates
- **Auth First:** All user-facing pages except `WelcomePage` and `LoginPage` must be protected.
- **Types:** Strictly use TypeScript. Ensure `src/types/supabase.ts` is kept up to date.
- **Validation:** Use Zod schemas for all form validation and API responses.
- **Real-time:** Prefer Supabase Realtime for data that needs to be "live" (messages, notifications).
- **Styling:** Adhere to the established color palette (Primary: `#1A6B3C`, Secondary: `#3B8C7E`, Accent: `#E8A838`).

## Architecture
- **Components:** Functional components with Hooks. Use Shadcn UI for base primitives.
- **State:** Use `AuthContext` for global user state. Prefer local state or URL state for page-specific data.
- **Data Fetching:** Centralize Supabase logic in `src/lib/services` (to be implemented).
- **Matching:** Logic resides in `src/data/mockData.ts` (moving to DB functions eventually).

## Improvements Roadmap
1. [ ] Implement `ProtectedRoute` component.
2. [ ] Refactor `OnboardingPage` to use `react-hook-form` + `Zod`.
3. [ ] Refactor `ProfilePage` to use `react-hook-form` + `Zod`.
4. [ ] Implement real-time messaging using Supabase.
5. [ ] Add Framer Motion page transitions.
6. [ ] Replace spinners with Skeleton loaders.
7. [ ] Implement server-side matching queries.
