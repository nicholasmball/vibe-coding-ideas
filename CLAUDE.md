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
- **PWA**: Manual service worker + Next.js manifest (Turbopack-compatible, zero runtime deps)
- **AI**: Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) for idea enhancement and board generation
- **Remote MCP**: mcp-handler (Vercel MCP adapter) + OAuth 2.1 + PKCE

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (ThemeProvider, Toaster, SW register, install prompt)
│   ├── manifest.ts         # PWA web app manifest (standalone, dark theme)
│   ├── page.tsx            # Landing page (public, live stats)
│   ├── (auth)/             # Auth routes (no navbar)
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/ # Password reset request
│   │   ├── reset-password/  # Password reset form
│   │   └── callback/       # OAuth callback route handler
│   ├── .well-known/        # OAuth discovery endpoints
│   │   ├── oauth-authorization-server/  # RFC 8414 metadata
│   │   └── oauth-protected-resource/    # RFC 9728 resource metadata
│   ├── api/
│   │   ├── mcp/[[...transport]]/ # Remote MCP endpoint (mcp-handler)
│   │   └── oauth/           # OAuth 2.1 endpoints
│   │       ├── register/    # Dynamic Client Registration
│   │       ├── authorize/   # Authorization redirect
│   │       ├── token/       # Token exchange + refresh
│   │       └── code/        # Auth code storage (internal)
│   ├── oauth/               # OAuth consent UI
│   │   ├── authorize/       # Login + consent page
│   │   └── callback/        # OAuth provider callback
│   ├── guide/              # Public guide pages (no auth required)
│   │   ├── layout.tsx      # Navbar + scrollable content + footer
│   │   ├── page.tsx        # Hub with 5 section cards
│   │   ├── getting-started/
│   │   ├── ideas-and-voting/
│   │   ├── collaboration/
│   │   ├── kanban-boards/
│   │   └── mcp-integration/
│   └── (main)/             # Authenticated routes (with navbar)
│       ├── layout.tsx      # Navbar wrapper
│       ├── dashboard/      # Personal dashboard (reorderable two-column grid, collapsible sections, bounded lists)
│       ├── feed/           # Idea feed with search/filter/pagination
│       ├── ideas/new       # Submit idea form
│       ├── ideas/[id]      # Idea detail (votes, comments, collaborators)
│       ├── ideas/[id]/board # Kanban task board (author + collaborators only)
│       ├── ideas/[id]/edit # Edit idea (author only)
│       ├── admin/          # Admin: AI usage analytics + user management (admin only)
│       ├── members/        # User directory with search/sort/pagination
│       └── profile/[id]    # User profile with tabs
├── actions/                # Server Actions (all use server-side validation)
│   ├── ideas.ts            # create, update, updateStatus, delete
│   ├── board.ts            # initializeColumns, create/update/delete columns & tasks, reorder, move, labels (CRUD + assign/remove), checklists (CRUD + toggle), task comments (create/delete)
│   ├── bots.ts             # createBot, updateBot, deleteBot, listMyBots
│   ├── votes.ts            # toggleVote
│   ├── comments.ts         # create, incorporate, delete
│   ├── collaborators.ts    # toggleCollaborator, addCollaborator, removeCollaborator
│   ├── notifications.ts    # markRead, markAllRead, updateNotificationPreferences
│   ├── profile.ts          # updateProfile (including avatar_url)
│   ├── users.ts            # deleteUser (admin only)
│   ├── ai.ts               # enhanceIdeaDescription, applyEnhancedDescription, generateBoardTasks, getAiRemainingCredits + rate limiting + usage logging
│   └── admin.ts            # toggleAiEnabled, setUserAiDailyLimit (admin only)
├── components/
│   ├── ui/                 # shadcn/ui (don't edit manually, except markdown.tsx)
│   ├── layout/             # navbar, theme-toggle, notification-bell
│   ├── auth/               # oauth-buttons
│   ├── ideas/              # card, feed, form, edit-form, vote-button, collaborator-button, add-collaborator-popover, remove-collaborator-button, enhance-idea-button, enhance-idea-dialog, inline-idea-header, inline-idea-body, inline-idea-tags
│   ├── board/              # kanban-board, board-context, board-column, board-task-card, board-toolbar, task-edit-dialog, task-detail-dialog, column-edit-dialog, add-column-button, board-realtime, label-picker, due-date-picker, due-date-badge, task-label-badges, checklist-section, activity-timeline, task-comments-section, task-attachments-section, mention-autocomplete, import-dialog, import-csv-tab, import-json-tab, import-bulk-text-tab, import-column-mapper, import-preview-table, ai-generate-dialog
│   ├── admin/              # ai-usage-dashboard, ai-user-management-row
│   ├── dashboard/          # collapsible-section, dashboard-grid, stats-cards, active-boards, my-bots, bot-activity-dialog, my-tasks-list, activity-feed
│   ├── members/            # member-directory, member-card
│   ├── comments/           # thread, item, form, type-badge
│   ├── pwa/                # service-worker-register, install-prompt
│   └── profile/            # header, tabs, delete-user-button, edit-profile-dialog, notification-settings, complete-profile-banner, bot-management, create-bot-dialog, edit-bot-dialog
├── hooks/
│   ├── use-user.ts         # Client-side auth state
│   └── use-realtime.ts     # Supabase realtime subscription
├── lib/
│   ├── activity.ts         # logTaskActivity() — client-side fire-and-forget activity logging
│   ├── activity-format.ts  # formatActivityDetails(), groupIntoSessions() — shared activity rendering helpers
│   ├── constants.ts        # Status/comment type configs, sort options, tags, board defaults, LABEL_COLORS, ACTIVITY_ACTIONS, BOT_ROLE_TEMPLATES
│   ├── dashboard-order.ts  # Panel reordering utils (PanelPlacement, DEFAULT_PANEL_ORDER, move/reconcile/localStorage helpers)
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
next.config.ts              # Next.js config (SW cache-control headers)
vitest.config.ts            # Vitest config (jsdom, @/ alias, react plugin)
public/
├── sw.js                   # Service worker (cache-first statics, network-first navigation, offline fallback)
├── offline.html            # Standalone offline fallback page (no Next.js dependency)
├── favicon.ico             # Favicon (generated from icon.svg)
├── apple-touch-icon.png    # Apple touch icon (180x180)
└── icons/                  # PWA icons (192, 512, maskable-512)
scripts/generate-icons.mjs  # One-time icon generation script (requires sharp)
supabase/migrations/        # 44 SQL migration files (run in order)
mcp-server/                 # MCP server for Claude Code integration
├── package.json            # ESM, separate deps
├── tsconfig.json           # noEmit, includes ../src/types
├── .env.example
└── src/
    ├── index.ts            # McpServer entry point (stdio transport)
    ├── supabase.ts         # Service-role client + BOT_USER_ID + constants
    ├── activity.ts         # logActivity() helper
    └── tools/
        ├── ideas.ts        # list_ideas, get_idea, update_idea_description, create_idea, delete_idea, update_idea_status, update_idea_tags
        ├── board-read.ts   # get_board, get_task, get_my_tasks
        ├── board-write.ts  # create_task, update_task, move_task, delete_task
        ├── comments.ts     # add_idea_comment, add_task_comment
        ├── labels.ts       # manage_labels, manage_checklist, report_bug
        ├── attachments.ts  # list_attachments, upload_attachment, delete_attachment
        ├── votes.ts        # toggle_vote
        ├── collaborators.ts # add_collaborator, remove_collaborator, list_collaborators
        ├── columns.ts      # create_column, update_column, delete_column, reorder_columns
        ├── notifications.ts # list_notifications, mark_notification_read, mark_all_notifications_read
        ├── profile.ts      # update_profile
        └── bots.ts         # list_bots, get_bot_prompt, set_bot_identity, create_bot
```

## Workflow Rules (MANDATORY)

### Board Task Workflow — MUST DO BEFORE ANY IMPLEMENTATION
At the START of every session where you are asked to implement, fix, or change anything, BEFORE writing any code:

1. **Check the VibeCodes board** for a matching task using the VibeCodes MCP tools (`get_my_tasks` or `get_board`)
2. **If a matching task exists:**
   - Reassign it to yourself using `update_task` (even if already assigned to someone else)
   - Move it to "In Progress" — do this IMMEDIATELY, before writing any code
   - Read all comments on the task via `get_task` — they contain context from previous work
   - Add a comment noting what you're about to do
3. **If no matching task exists:** Proceed normally, but consider whether one should be created
4. **When finished:** Move the task to "Verify" with a summary comment of what was done
5. **Post research/analysis findings as task comments** — detailed findings MUST be added as a comment on the board task so context is preserved for future sessions
6. **NEVER use raw SQL** (`mcp__supabase__execute_sql`) for board operations — always use VibeCodes MCP tools which log activity and maintain consistency

This applies even when:
- A plan is provided from a previous session
- The user says "implement this plan"
- Work seems purely technical with no board context mentioned
- You are resuming from context compaction

### Push to Live = Move Verify to Done
When the user says "push to live" (or "commit and push", "deploy", etc.), after pushing, move ALL tasks in the "Verify" column to "Done" on the VibeCodes board.

### Blocked Tasks
Move tasks to "Blocked/Requires User Input" when blocked for any reason (dependency, technical issue, missing info, design decision needed). Add a comment explaining WHY it's blocked.

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
- Middleware protects `/dashboard`, `/feed`, `/ideas`, `/profile`, `/admin` routes (redirects to `/login`)
- Middleware redirects logged-in users away from `/login`, `/signup`
- OAuth callback at `/callback` exchanges code for session
- Email/password with forgot/reset password flow
- `useUser()` hook for client-side auth state
- Profile picture upload: edit-profile-dialog uploads to `avatars` bucket client-side, saves public URL (with cache-bust `?t=`) to `users.avatar_url` via `updateProfile` server action; supports upload, replace, and remove

### Database
- 18 tables: users, ideas, comments, collaborators, votes, notifications, board_columns, board_tasks, board_labels, board_task_labels, board_checklist_items, board_task_activity, board_task_comments, board_task_attachments, mcp_oauth_clients, mcp_oauth_codes, bot_profiles, ai_usage_log
- Denormalized counts on ideas (upvotes, comment_count, collaborator_count) maintained by triggers
- Users auto-created from auth.users via trigger
- Notifications auto-created via triggers on comments/votes/collaborators (respect user preferences)
- `notification_preferences` JSONB on users controls which notification types are received
- Status change notifications sent to collaborators when idea status updates
- `ideas.visibility` (`public`/`private`) — private ideas only visible to author, collaborators, and admins (enforced by RLS SELECT policy)
- RLS: visibility-aware read, authenticated write, owner-only update/delete; collaborators INSERT/DELETE allows idea author
- Authors can add/remove collaborators directly (solves private idea chicken-and-egg problem)
- Collaborator notifications are bidirectional: author-adds-user notifies user, self-join notifies author
- `users.ai_daily_limit` (integer, default 10) — per-user daily AI call cap; BYOK users exempt
- `ai_usage_log` tracks all AI calls: user_id, action_type, input/output tokens, model, key_type (platform/byok), idea_id; RLS: users read own, admins read all
- Admin role: `users.is_admin` — admins can delete any idea or non-admin user
- `admin_delete_user` RPC (security definer) deletes from auth.users, cascading all data
- `notifications.idea_id` is nullable (ON DELETE SET NULL) so notifications persist after user deletion
- Board tables (board_columns, board_tasks, board_labels, board_task_labels, board_checklist_items) use `is_idea_team_member()` RLS function for team-only access
- Board columns lazy-initialized with "To Do", "In Progress", "Done" (done column) on first visit
- `board_columns.is_done_column` (boolean) marks columns where tasks are considered complete
- Dashboard excludes archived tasks and tasks in done columns
- Dashboard layout: reorderable two-column grid on `lg:` (1024px+), single column below; container `max-w-6xl`
  - Default left column: Active Boards, My Bots (conditional), My Tasks
  - Default right column: My Ideas, Collaborations, Recent Activity
  - "Customize" button toggles configure mode with arrow buttons (up/down within column, left/right between columns)
  - Panel order persisted in `localStorage` (`dashboard-panel-order`); "Reset" restores defaults
  - `DashboardGrid` client component reads order, `dashboard-order.ts` has pure move/reconcile utilities
  - Left/right column arrows hidden on mobile (single-column layout)
- All dashboard sections wrapped in `CollapsibleSection` (client component): chevron toggle, item count badge, collapse state persisted in `localStorage` (`dashboard-collapsed-{sectionId}`), all expanded by default
- My Tasks and Recent Activity bounded to 5 items with "Show all (N)" toggle (session-only, not persisted)
- Dashboard "Active Boards" section shows up to 5 most recently active boards (by task `updated_at`) for ideas the user owns or collaborates on, with per-column task counts
- Dashboard "My Bots" section (conditionally rendered if user has bots): shows each bot's name, role badge, MCP Active badge (if `users.active_bot_id` matches), current task assignment (most recent non-done, non-archived task), last activity action + relative time; inactive bots dimmed; clicking a bot opens bot activity dialog
- Bot activity dialog: assigned tasks, merged activity+comments feed grouped by session (30-min gap), activity details rendered from JSONB (e.g. "moved to In Progress", "added a label "Bug""), comment previews with markdown rendering
- Idea card board icon (`LayoutDashboard`) is a `<Link>` to `/ideas/[id]/board` (shown when `taskCount > 0`)
- Idea detail page uses inline editing for authors: title (borderless input, save on blur), description (click-to-edit markdown, save on blur), tags (TagInput with 300ms debounce auto-save), GitHub URL (click-to-edit), visibility (badge toggle). Non-authors see read-only. Edit page kept as fallback.
- `updateIdeaFields` server action in `src/actions/ideas.ts` — partial updates (any subset of title/description/tags/github_url/visibility), author-only, no redirect
- Board uses `BoardOpsContext` (`board-context.tsx`) for optimistic UI across all mutations — provides `createTask`, `deleteTask`, `createColumn`, `deleteColumn`, `updateColumn`, `archiveColumnTasks` + `incrementPendingOps`/`decrementPendingOps`. Each returns a rollback function for error recovery.
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
- `board_task_attachments` + `task-attachments` storage bucket (private, 10MB limit, accepts images, videos, .pdf, .doc/.docx, .xls/.xlsx, .txt, .csv, .zip, .md)
- `update_attachment_count()` trigger maintains `board_tasks.attachment_count`
- Task comments support @mentions: typing `@` triggers autocomplete for team members, selecting inserts `@Full Name`, submitting creates `task_mention` notifications (fire-and-forget, respects `notification_preferences.task_mentions`)
- @mentions render with primary color styling in markdown via `renderMentions()` in `markdown.tsx`
- Board import: CSV (with header mapping), JSON (Trello export + custom format), bulk text paste
  - Import uses client-side Supabase for batch inserts (avoids N revalidatePath round-trips)
  - Auto-maps column names case-insensitively, supports "Create new column"
  - Max 500 tasks per import, inserted in batches of 50
  - Creates labels/columns on-the-fly, resolves assignees by name/email

### Multi-Bot Support
- `users.is_bot` (boolean) distinguishes bot users from human users
- `users.active_bot_id` (UUID, FK to bot_profiles, ON DELETE SET NULL) persists the active bot identity across sessions
- `bot_profiles` table stores bot metadata: name, role, system_prompt, avatar_url, is_active, owner_id
- `create_bot_user` and `delete_bot_user` SECURITY DEFINER RPCs handle atomic bot creation/deletion
- Bots get their own `users` row for FK compatibility (assignee_id, actor_id, author_id)
- Bot management UI on profile page: create, edit, toggle active/inactive, delete
- `BOT_ROLE_TEMPLATES` in constants provide starter templates (Developer, UX Designer, BA, QA Tester)
- Assignee picker in task detail dialog includes "My Bots" section below team members
- Bot indicators (Bot icon) shown in activity timeline, task comments, task cards, and assignee avatars
- Auto-collaborator: assigning a bot to a task automatically adds it as collaborator on the idea
- MCP `set_bot_identity` tool persists identity to DB (`users.active_bot_id`) — survives reconnections, restarts, and context compaction
- `VIBECODES_BOT_ID` env var overrides DB-persisted identity on local MCP startup
- `McpContext.ownerUserId` distinguishes the real human from the active bot identity (for ownership validation)

### AI Features (Idea Enhancement & Board Generation)
- **Dependencies**: `ai` (Vercel AI SDK) + `@ai-sdk/anthropic` (Claude provider)
- **Access control**: `users.ai_enabled` boolean (default false), admin-toggled — AI buttons hidden entirely when false
- **Rate limiting**: Per-user daily caps via `users.ai_daily_limit` (default 10). BYOK users (with `encrypted_anthropic_key`) exempt from limits. Rate checks count today's `ai_usage_log` rows where `key_type = 'platform'`
- **Usage logging**: All AI calls logged to `ai_usage_log` table with input/output token counts, model, key type, action type, and idea reference
- **Credits display**: `AiCredits` type (`{ used, limit, remaining, isByok }`) passed from server pages to AI components. Shows "X/Y" badge on AI buttons, "Daily limit reached" tooltip when exhausted, credit info bar in dialogs
- **API key**: Platform `ANTHROPIC_API_KEY` stored as Vercel env var, server-side only
- **Model**: Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`)
- **Server actions** in `src/actions/ai.ts`:
  - `enhanceIdeaDescription(ideaId, prompt, personaPrompt?)` — calls `generateText()`, returns original + enhanced
  - `applyEnhancedDescription(ideaId, description)` — updates idea description (author-only)
  - `generateBoardTasks(ideaId, prompt, personaPrompt?)` — calls `generateObject()` with Zod schema, returns `ImportTask[]`
  - `getAiRemainingCredits()` — returns `AiCredits` for current user
- **Admin actions** in `src/actions/admin.ts`:
  - `toggleAiEnabled(userId, enabled)` — toggle AI access for a user
  - `setUserAiDailyLimit(userId, limit)` — set per-user daily cap (null = unlimited)
- **Admin page** at `/admin` — AI usage analytics dashboard with stats cards (total calls, tokens, est. cost, platform vs BYOK), filter bar (date range, action type), user management table (toggle ai_enabled, edit daily limit), recent activity log
- **Enhance flow**: Idea detail page → "Enhance with AI" button (author + ai_enabled) → dialog with persona selector, editable prompt, original vs enhanced comparison → Apply/Try Again/Cancel
- **Generate flow**: Board toolbar → "AI Generate" button (team member + ai_enabled) → dialog with persona selector, prompt, add/replace mode → preview table → Apply All
- **Persona selector**: Uses user's active bot profiles as AI personas (system_prompt injected into AI call)
- **Board generation**: Structured output via `generateObject()` with Zod schema → parsed into `ImportTask[]` → fed into existing `executeBulkImport()` pipeline
- **Replace mode**: Deletes all existing tasks before applying AI-generated ones (with destructive warning)
- **Components**: `enhance-idea-button.tsx`, `enhance-idea-dialog.tsx` (ideas), `ai-generate-dialog.tsx` (board), `ai-usage-dashboard.tsx`, `ai-user-management-row.tsx` (admin)

### PWA (Progressive Web App)
- **Installable** from browser on Android, iOS, and desktop ("Add to Home Screen")
- `src/app/manifest.ts` generates `/manifest.webmanifest` — standalone, dark theme, `/dashboard` start URL
- `public/sw.js` — manual service worker (no build-tool dependency, compatible with Turbopack)
  - **Cache-first** for static assets (`_next/static/`, images, fonts, CSS, JS)
  - **Network-first** for navigation, falling back to `offline.html`
  - **Skips** cross-origin requests, `/api/`, `/oauth/`, `/.well-known/`
  - `skipWaiting()` + `clients.claim()` for immediate activation
  - Versioned cache name (`vibecodes-v3`) — bump version when changing `sw.js` or `offline.html`
- `public/offline.html` — **standalone HTML** (no Next.js, no JS, inline styles + SVG) so link clicks work without hydration
- `src/components/pwa/service-worker-register.tsx` — registers SW on mount, renders null
- `src/components/pwa/install-prompt.tsx` — intercepts `beforeinstallprompt` (Chrome/Edge/Android) + iOS Safari instructions, dismissible per session
- `next.config.ts` sets `Cache-Control: no-cache` on `/sw.js` so browsers always check for updates
- `middleware.ts` excludes `sw.js` from auth middleware
- **Testing**: SW only works in production mode — use `npm run build && npm start`, not `npm run dev`
- **Icons**: generated via `scripts/generate-icons.mjs` (requires `sharp` as temp devDep) from `src/app/icon.svg`
- **Not included**: offline data sync, push notifications, app store listing (separate future tasks)

### Testing
- **Framework**: Vitest + jsdom + @testing-library/react
- **Config**: `vitest.config.ts` (react plugin, `@/` alias, `src/test/setup.ts`)
- **Test files**: Co-located as `*.test.ts` next to source (e.g., `utils.test.ts`, `import.test.ts`)
- **Coverage**: 265 tests across 12 files — utils, validation, types, import parsers, constants integrity, prompt builder, dashboard-order, activity-format, OAuth endpoints (PKCE, registration, authorization, token exchange), well-known metadata, MCP register-tools (incl. bot identity persistence), bot-identity context (human vs bot ID correctness)
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
NEXT_PUBLIC_APP_URL=https://vibecodes.co.uk               # For OAuth discovery endpoints (production)
SUPABASE_SERVICE_ROLE_KEY=eyJ...                   # For OAuth admin operations (Vercel only)
ANTHROPIC_API_KEY=sk-ant-...                       # For AI features (Vercel only, server-side)
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

## MCP Server (Claude Code Integration)

### Overview
The MCP server has two modes:
1. **Local (stdio)**: `mcp-server/src/index.ts` — launched as subprocess, uses service-role client + bot user, bypasses RLS
2. **Remote (HTTP)**: `src/app/api/mcp/[[...transport]]/route.ts` — hosted on Vercel, uses OAuth 2.1 + PKCE, per-user Supabase client with RLS

Both modes share the same 38 tools via `mcp-server/src/register-tools.ts` with dependency injection (`McpContext`).

### Bot User
- **ID**: `a0000000-0000-4000-a000-000000000001`
- **Email**: `bot@vibecodes.local`
- Cannot log in (empty password) — only used by MCP server
- Appears in activity logs, comments, and task assignments

### Running / Config
- **Type check**: `cd mcp-server && npx tsc --noEmit`
- **Config**: `.mcp.json` in project root (gitignored, contains service role key)
- **Transport**: stdio (launched by Claude Code as subprocess via `npx tsx mcp-server/src/index.ts`)
- **Env vars**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VIBECODES_BOT_USER_ID`, `VIBECODES_BOT_ID` (optional, override active bot identity on startup)

### 38 MCP Tools

| Tool | Type | Description |
|------|------|-------------|
| `list_ideas` | Read | List ideas with optional status filter and search |
| `get_idea` | Read | Full idea detail + comments + collaborators + board summary |
| `get_board` | Read | Complete board: columns, tasks, labels (auto-initializes columns) |
| `get_task` | Read | Single task + checklist + comments + activity + attachments |
| `get_my_tasks` | Read | Tasks assigned to bot, grouped by idea |
| `list_attachments` | Read | List task attachments with 1-hour signed download URLs |
| `create_task` | Write | Create task on a board column |
| `update_task` | Write | Update task fields (title, description, assignee, due date, archived) |
| `move_task` | Write | Move task between columns |
| `delete_task` | Write | Delete a task |
| `upload_attachment` | Write | Upload base64-encoded file to task (max 10MB, auto-sets cover) |
| `delete_attachment` | Write | Delete attachment from task (clears cover if applicable) |
| `update_idea_description` | Write | Rewrite an idea's description |
| `create_idea` | Write | Create a new idea with title, description, tags, visibility |
| `delete_idea` | Write | Delete an idea (author or admin only) |
| `update_idea_status` | Write | Update idea status (open, in_progress, completed, archived) |
| `update_idea_tags` | Write | Set/replace tags on an idea |
| `toggle_vote` | Write | Toggle the current user's upvote on an idea |
| `add_collaborator` | Write | Add a user as collaborator on an idea |
| `remove_collaborator` | Write | Remove a collaborator from an idea |
| `list_collaborators` | Read | List all collaborators on an idea |
| `create_column` | Write | Create a new board column |
| `update_column` | Write | Update a column's title or done status |
| `delete_column` | Write | Delete an empty board column |
| `reorder_columns` | Write | Reorder columns by providing IDs in desired order |
| `manage_labels` | Write | Create labels, add/remove from tasks |
| `manage_checklist` | Write | Add/toggle/delete checklist items |
| `add_idea_comment` | Write | Comment on an idea (as bot) |
| `add_task_comment` | Write | Comment on a board task (as bot) |
| `report_bug` | Write | Create task with red "Bug" label, assigned to bot |
| `list_notifications` | Read | List notifications with optional unread-only filter |
| `mark_notification_read` | Write | Mark a single notification as read |
| `mark_all_notifications_read` | Write | Mark all unread notifications as read |
| `update_profile` | Write | Update user profile (name, bio, github, avatar, contact) |
| `list_bots` | Read | List bots owned by the current user |
| `get_bot_prompt` | Read | Get system prompt for a bot or active identity |
| `set_bot_identity` | Write | Switch session to a bot persona (or reset to default) |
| `create_bot` | Write | Create a new bot profile with name, role, prompt |

### Architecture (Dependency Injection)
- `mcp-server/src/context.ts` defines `McpContext` interface: `{ supabase, userId, ownerUserId? }`
- All tool handler functions accept `ctx: McpContext` as first parameter
- `mcp-server/src/register-tools.ts` wires tools to MCP server via `getContext(extra)` callback (sync or async)
- Local mode: mutable context (service-role + bot user, identity switchable via `set_bot_identity`); reads persisted `active_bot_id` from DB on startup if no `VIBECODES_BOT_ID` env var
- Remote mode: per-request context (user JWT + user ID from auth, `ownerUserId` tracks real human); lazily reads persisted `active_bot_id` from DB on first tool call per connection

### Key Details
- All write tools log to `board_task_activity` with `actor_id` from context (bot or real user)
- `get_board` auto-initializes default columns (To Do, In Progress, Done) if none exist
- Position calculation: `MAX(position) + 1000` in target column
- Board changes propagate to UI via Realtime (no revalidatePath needed)
- Types imported from `../../src/types/database` (shared with main app)

### Remote MCP Server
- **Endpoint**: `https://vibecodes.co.uk/api/mcp`
- **Connect**: `claude mcp add --transport http vibecodes https://vibecodes.co.uk/api/mcp`
- **Auth flow**: OAuth 2.1 + PKCE — Claude Code opens browser, user logs in with VibeCodes credentials, tokens exchanged
- **Transport**: `mcp-handler` (Vercel's MCP adapter) with Streamable HTTP
- **Identity**: Supabase JWTs as OAuth access tokens — validated via `supabase.auth.getUser()`
- **Authorization**: Per-request Supabase client with user's JWT → existing RLS policies enforced
- **OAuth routes**: `/api/oauth/register` (DCR), `/api/oauth/authorize`, `/api/oauth/token`, `/api/oauth/code`
- **Discovery**: `/.well-known/oauth-authorization-server` (RFC 8414), `/.well-known/oauth-protected-resource` (RFC 9728)
- **DB tables**: `mcp_oauth_clients` (DCR), `mcp_oauth_codes` (auth codes, 10-min TTL), `bot_profiles` (multi-bot support), `ai_usage_log` (AI usage tracking)
- **Env vars** (Vercel): `NEXT_PUBLIC_APP_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## Local Project Config (.vibecodes/)

When working in a repo linked to a VibeCodes idea, a `.vibecodes/` folder provides context so MCP tools don't require explicit `idea_id` on every call.

### Folder Structure
```
.vibecodes/
├── config.json      # Core project linking config
├── memory/          # Future: session artifacts, research notes
└── .gitignore       # Ignores memory/ contents
```

### Config Schema (`.vibecodes/config.json`)
```json
{
  "ideaId": "62e57071-3645-422f-96c0-b2042e39e6dd",
  "ideaTitle": "VibeCodes",
  "taskId": "abc123...",
  "botId": "def456...",
  "defaultColumn": "82a02910-..."
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `ideaId` | Yes | Links this repo to a VibeCodes idea |
| `ideaTitle` | No | Human-readable reference |
| `taskId` | No | Current working task |
| `botId` | No | Preferred bot identity |
| `defaultColumn` | No | Column ID for new tasks |

### How It Works
1. **Read config at session start** — check for `.vibecodes/config.json` in the repo root
2. **Auto-inject `idea_id`** — when calling MCP tools that require `idea_id`, use the value from config
3. **Update `taskId`** — when starting work on a task, update config to track current context
4. **Use `defaultColumn`** — when creating tasks without explicit column, use this column ID

### Example Workflow
```
User: "Show me my board"
Claude: [reads .vibecodes/config.json → ideaId: 62e57071...]
        [calls get_board with idea_id from config]

User: "Create a task called 'Fix login bug'"
Claude: [uses ideaId + defaultColumn from config]
        [calls create_task with injected values]
```

