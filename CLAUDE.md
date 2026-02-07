# VibeCodes - Project Guide

## Quick Reference

- **Dev server**: `npm run dev` (http://localhost:3000)
- **Build**: `npm run build` (uses Turbopack)
- **Lint**: `npm run lint`

## Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss"` syntax) + shadcn/ui (New York style, Zinc base)
- **Backend**: Supabase (Auth, Postgres, Realtime, RLS)
- **Auth**: OAuth (GitHub + Google) + email/password via Supabase Auth
- **Theming**: next-themes (dark default)
- **Notifications**: sonner (toasts)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (ThemeProvider, Toaster)
│   ├── page.tsx            # Landing page (public)
│   ├── (auth)/             # Auth routes (no navbar)
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/ # Password reset request
│   │   ├── reset-password/  # Password reset form
│   │   └── callback/       # OAuth callback route handler
│   └── (main)/             # Authenticated routes (with navbar)
│       ├── layout.tsx      # Navbar wrapper
│       ├── feed/           # Idea feed with search/filter/pagination
│       ├── ideas/new       # Submit idea form
│       ├── ideas/[id]      # Idea detail (votes, comments, collaborators)
│       ├── ideas/[id]/edit # Edit idea (author only)
│       └── profile/[id]    # User profile with tabs
├── actions/                # Server Actions
│   ├── ideas.ts            # create, update, updateStatus, delete
│   ├── votes.ts            # toggleVote
│   ├── comments.ts         # create, incorporate, delete
│   ├── collaborators.ts    # toggleCollaborator
│   ├── notifications.ts    # markRead, markAllRead
│   └── profile.ts          # updateProfile
├── components/
│   ├── ui/                 # shadcn/ui (don't edit manually)
│   ├── layout/             # navbar, theme-toggle, notification-bell
│   ├── auth/               # oauth-buttons
│   ├── ideas/              # card, feed, form, edit-form, vote-button, etc.
│   ├── comments/           # thread, item, form, type-badge
│   └── profile/            # header, tabs
├── hooks/
│   ├── use-user.ts         # Client-side auth state
│   └── use-realtime.ts     # Supabase realtime subscription
├── lib/
│   ├── constants.ts        # Status/comment type configs, sort options, tags
│   ├── utils.ts            # cn(), formatRelativeTime()
│   └── supabase/
│       ├── client.ts       # Browser client (createBrowserClient)
│       ├── server.ts       # Server client (createServerClient + cookies)
│       └── middleware.ts    # Session refresh + route protection
├── types/
│   ├── database.ts         # Supabase Database type (manual, includes Relationships)
│   └── index.ts            # Derived types (IdeaWithAuthor, CommentWithAuthor, etc.)
middleware.ts               # Root middleware (calls updateSession)
supabase/migrations/        # 9 SQL migration files (run in order)
```

## Key Patterns

### Supabase Types (IMPORTANT)
- Database types in `src/types/database.ts` are **manually maintained** (no CLI generation)
- Each table MUST have `Row`, `Insert`, `Update`, AND `Relationships` arrays
- Without `Relationships`, Supabase JS v2.95+ resolves insert/update/delete to `never`
- Use `.maybeSingle()` instead of `.single()` when the row might not exist
- Foreign key joins use explicit names: `users!ideas_author_id_fkey(*)`

### Next.js 16 Conventions
- `params` and `searchParams` in page props are `Promise` types — must `await` them
- `cookies()` from `next/headers` is async — must `await` it
- Server Actions are in `src/actions/` with `"use server"` directive
- Client components use `"use client"` directive

### Auth Flow
- Middleware protects `/feed`, `/ideas`, `/profile` routes (redirects to `/login`)
- Middleware redirects logged-in users away from `/login`, `/signup`
- OAuth callback at `/callback` exchanges code for session
- Email/password with forgot/reset password flow
- `useUser()` hook for client-side auth state

### Database
- 6 tables: users, ideas, comments, collaborators, votes, notifications
- Denormalized counts on ideas (upvotes, comment_count, collaborator_count) maintained by triggers
- Users auto-created from auth.users via trigger
- Notifications auto-created via triggers on comments/votes/collaborators
- RLS: public read, authenticated write, owner-only update/delete
- Admin role: `users.is_admin` — admins can delete any idea

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
```

## Adding New Database Tables

1. Create migration in `supabase/migrations/`
2. Add table types to `src/types/database.ts` (include `Relationships`)
3. Add row type export to `src/types/index.ts`
4. Run migration via Supabase MCP (`apply_migration`) or SQL Editor

## Adding shadcn/ui Components

```bash
npx shadcn@latest add <component-name>
```

Components go into `src/components/ui/` — don't edit these manually.
