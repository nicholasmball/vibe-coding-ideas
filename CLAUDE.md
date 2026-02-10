# VibeCodes - Project Guide

## Quick Reference

- **Dev server**: `npm run dev` (http://localhost:3000)
- **Build**: `npm run build` (uses Turbopack)
- **Lint**: `npm run lint`
- **Test**: `npm run test` (Vitest, single run) / `npm run test:watch` (watch mode)

## Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss"` syntax) + shadcn/ui (New York style, Zinc base)
- **Backend**: Supabase (Auth, Postgres, Realtime, RLS)
- **Auth**: OAuth (GitHub + Google) + email/password via Supabase Auth
- **Theming**: next-themes (dark default)
- **Markdown**: react-markdown + remark-gfm (idea descriptions, comments)
- **Drag & Drop**: @dnd-kit/core, @dnd-kit/sortable (kanban board)
- **Notifications**: sonner (toasts)
- **Testing**: Vitest + @testing-library/react + jsdom

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (ThemeProvider, Toaster)
│   ├── page.tsx            # Landing page (public, live stats)
│   ├── (auth)/             # Auth routes (no navbar)
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/ # Password reset request
│   │   ├── reset-password/  # Password reset form
│   │   └── callback/       # OAuth callback route handler
│   └── (main)/             # Authenticated routes (with navbar)
│       ├── layout.tsx      # Navbar wrapper
│       ├── dashboard/      # Personal dashboard (stats, tasks, ideas, activity)
│       ├── feed/           # Idea feed with search/filter/pagination
│       ├── ideas/new       # Submit idea form
│       ├── ideas/[id]      # Idea detail (votes, comments, collaborators)
│       ├── ideas/[id]/board # Kanban task board (author + collaborators only)
│       ├── ideas/[id]/edit # Edit idea (author only)
│       └── profile/[id]    # User profile with tabs
├── actions/                # Server Actions (all use server-side validation)
│   ├── ideas.ts            # create, update, updateStatus, delete
│   ├── board.ts            # initializeColumns, create/update/delete columns & tasks, reorder, move, labels (CRUD + assign/remove), checklists (CRUD + toggle), task comments (create/delete)
│   ├── votes.ts            # toggleVote
│   ├── comments.ts         # create, incorporate, delete
│   ├── collaborators.ts    # toggleCollaborator, addCollaborator, removeCollaborator
│   ├── notifications.ts    # markRead, markAllRead, updateNotificationPreferences
│   ├── profile.ts          # updateProfile (including avatar_url)
│   └── users.ts            # deleteUser (admin only)
├── components/
│   ├── ui/                 # shadcn/ui (don't edit manually, except markdown.tsx)
│   ├── layout/             # navbar, theme-toggle, notification-bell
│   ├── auth/               # oauth-buttons
│   ├── ideas/              # card, feed, form, edit-form, vote-button, collaborator-button, add-collaborator-popover, remove-collaborator-button, etc.
│   ├── board/              # kanban-board, board-column, board-task-card, board-toolbar, task-edit-dialog, task-detail-dialog, column-edit-dialog, add-column-button, board-realtime, label-picker, due-date-picker, due-date-badge, task-label-badges, checklist-section, activity-timeline, task-comments-section, task-attachments-section, mention-autocomplete, import-dialog, import-csv-tab, import-json-tab, import-bulk-text-tab, import-column-mapper, import-preview-table
│   ├── dashboard/          # stats-cards, my-tasks-list, activity-feed
│   ├── comments/           # thread, item, form, type-badge
│   └── profile/            # header, tabs, delete-user-button, edit-profile-dialog, notification-settings, complete-profile-banner
├── hooks/
│   ├── use-user.ts         # Client-side auth state
│   └── use-realtime.ts     # Supabase realtime subscription
├── lib/
│   ├── activity.ts         # logTaskActivity() — client-side fire-and-forget activity logging
│   ├── constants.ts        # Status/comment type configs, sort options, tags, board defaults, LABEL_COLORS, ACTIVITY_ACTIONS
│   ├── import.ts           # CSV/JSON/bulk-text parsers, auto-mapping, executeBulkImport()
│   ├── validation.ts       # Server-side input validation (title, description, comment, tags, GitHub URL, label name/color, bio, avatar URL)
│   ├── utils.ts            # cn(), formatRelativeTime(), getDueDateStatus(), formatDueDate(), getLabelColorConfig()
│   └── supabase/
│       ├── client.ts       # Browser client (createBrowserClient)
│       ├── server.ts       # Server client (createServerClient + cookies)
│       └── middleware.ts    # Session refresh + route protection
├── types/
│   ├── database.ts         # Supabase Database type (manual, includes Relationships)
│   └── index.ts            # Derived types (IdeaWithAuthor, CommentWithAuthor, DashboardTask, etc.)
├── test/
│   ├── setup.ts            # Vitest setup (@testing-library/jest-dom)
│   └── mocks.ts            # Shared mocks (Supabase client, Next.js navigation)
middleware.ts               # Root middleware (calls updateSession)
vitest.config.ts            # Vitest config (jsdom, @/ alias, react plugin)
supabase/migrations/        # 29 SQL migration files (run in order)
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
- `redirect()` in server actions throws a special error — when calling server actions that redirect from client code wrapped in try/catch, re-throw errors with `digest` starting with `NEXT_REDIRECT`
- Forms using server actions should use `useFormStatus` to disable submit buttons during pending state
- All client-side catch blocks that call server actions should show `toast.error()` — never fail silently

### Auth Flow
- Middleware protects `/dashboard`, `/feed`, `/ideas`, `/profile` routes (redirects to `/login`)
- Middleware redirects logged-in users away from `/login`, `/signup`
- OAuth callback at `/callback` exchanges code for session
- Email/password with forgot/reset password flow
- `useUser()` hook for client-side auth state
- Profile picture upload: edit-profile-dialog uploads to `avatars` bucket client-side, saves public URL (with cache-bust `?t=`) to `users.avatar_url` via `updateProfile` server action; supports upload, replace, and remove

### Database
- 14 tables: users, ideas, comments, collaborators, votes, notifications, board_columns, board_tasks, board_labels, board_task_labels, board_checklist_items, board_task_activity, board_task_comments, board_task_attachments
- Denormalized counts on ideas (upvotes, comment_count, collaborator_count) maintained by triggers
- Users auto-created from auth.users via trigger
- Notifications auto-created via triggers on comments/votes/collaborators (respect user preferences)
- `notification_preferences` JSONB on users controls which notification types are received
- Status change notifications sent to collaborators when idea status updates
- `ideas.visibility` (`public`/`private`) — private ideas only visible to author, collaborators, and admins (enforced by RLS SELECT policy)
- RLS: visibility-aware read, authenticated write, owner-only update/delete; collaborators INSERT/DELETE allows idea author
- Authors can add/remove collaborators directly (solves private idea chicken-and-egg problem)
- Collaborator notifications are bidirectional: author-adds-user notifies user, self-join notifies author
- Admin role: `users.is_admin` — admins can delete any idea or non-admin user
- `admin_delete_user` RPC (security definer) deletes from auth.users, cascading all data
- `notifications.idea_id` is nullable (ON DELETE SET NULL) so notifications persist after user deletion
- Board tables (board_columns, board_tasks, board_labels, board_task_labels, board_checklist_items) use `is_idea_team_member()` RLS function for team-only access
- Board columns lazy-initialized with "To Do", "In Progress", "Done" (done column) on first visit
- `board_columns.is_done_column` (boolean) marks columns where tasks are considered complete
- Dashboard excludes archived tasks and tasks in done columns
- Board uses @dnd-kit for drag-and-drop with optimistic UI updates
  - `MouseSensor` (distance: 8) for desktop, `TouchSensor` (delay: 200ms) for mobile, `KeyboardSensor` for a11y
  - Drag handles use `touch-none` CSS to prevent browser scroll interference
  - Task drag handles: visible on mobile, hover-reveal on desktop (`opacity-100 sm:opacity-0 sm:group-hover:opacity-100`)
- Board tasks support labels (colored, per-idea), due dates, and checklists (subtasks)
- `board_tasks.checklist_total` and `checklist_done` are denormalized counts maintained by `update_checklist_counts()` trigger
- Clicking a task card opens a rich detail dialog (task-detail-dialog) for editing all task properties; all mutations use server actions (not direct client calls) to ensure `revalidatePath` fires
- Board toolbar provides search, assignee/label/due-date filters, and archived toggle
- Columns are draggable (reorderable) via drag handle in column header
- Tasks can be archived/unarchived from the detail dialog; archived tasks are hidden by default
- `board_tasks.archived` (boolean) and `board_tasks.attachment_count` (denormalized, trigger-maintained)
- `board_task_activity` tracks all task changes with actor, action, and details (JSONB)
- Activity is logged client-side via `logTaskActivity()` fire-and-forget calls
- `board_task_comments` stores markdown comments per task, with Realtime subscription
- `avatars` storage bucket (public, 2MB limit) — profile picture uploads at `{userId}/avatar`, upsert on change
- `board_task_attachments` + `task-attachments` storage bucket (private, 10MB limit)
- `update_attachment_count()` trigger maintains `board_tasks.attachment_count`
- Task comments support @mentions: typing `@` triggers autocomplete for team members, selecting inserts `@Full Name`, submitting creates `task_mention` notifications (fire-and-forget, respects `notification_preferences.task_mentions`)
- @mentions render with primary color styling in markdown via `renderMentions()` in `markdown.tsx`
- Board import: CSV (with header mapping), JSON (Trello export + custom format), bulk text paste
  - Import uses client-side Supabase for batch inserts (avoids N revalidatePath round-trips)
  - Auto-maps column names case-insensitively, supports "Create new column"
  - Max 500 tasks per import, inserted in batches of 50
  - Creates labels/columns on-the-fly, resolves assignees by name/email

### Testing
- **Framework**: Vitest + jsdom + @testing-library/react
- **Config**: `vitest.config.ts` (react plugin, `@/` alias, `src/test/setup.ts`)
- **Test files**: Co-located as `*.test.ts` next to source (e.g., `utils.test.ts`, `import.test.ts`)
- **Coverage**: 126 tests across 5 files — utils, validation, types, import parsers, constants integrity
- **Convention**: Write tests for all new pure logic, validators, parsers, and utility functions. Component/UI changes are verified via build + manual testing.
- **Run**: `npm run test` (single run) or `npm run test:watch` (watch mode)

### Input Validation
- `src/lib/validation.ts` provides server-side validators with `ValidationError` class
- All server actions validate inputs before database operations
- Validators: `validateTitle`, `validateDescription`, `validateOptionalDescription`, `validateComment`, `validateGithubUrl`, `validateTags`, `validateLabelColor`, `validateLabelName`, `validateBio`, `validateAvatarUrl`
- Limits: title 200 chars, description 10K, comment 5K, bio 500, tag 50 chars / 10 max, label name 50, avatar URL 2000
- Label colors validated against allowlist (red, orange, amber, yellow, lime, green, blue, cyan, violet, purple, pink, rose)

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
