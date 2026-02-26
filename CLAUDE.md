# VibeCodes - Project Guide

## Quick Reference

- **Dev server**: `npm run dev` (http://localhost:3000)
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Test**: `npm run test` (Vitest) / `npm run test:watch` / `npm run test:e2e` (Playwright)
- **Docker**: `npm run docker:supabase` / `npm run docker:reset` / `npm run docker:seed`

## Tech Stack

Next.js 16 (App Router), TypeScript, Tailwind CSS v4 (`@import "tailwindcss"`), shadcn/ui (New York, Zinc), Supabase (Auth, Postgres, Realtime, RLS), next-themes (dark default), @dnd-kit (kanban), sonner (toasts), Vitest + Playwright, Vercel AI SDK (`ai` + `@ai-sdk/anthropic`), mcp-handler (remote MCP + OAuth 2.1), Sentry (`@sentry/nextjs` for error tracking), Resend (email notifications), Vercel Analytics + Speed Insights

## Workflow Rules (MANDATORY)

### Board Task Workflow — BEFORE ANY IMPLEMENTATION
1. **Check the VibeCodes board** for a matching task (`get_my_tasks` or `get_board`)
2. **If task exists:** Reassign to yourself, move to "In Progress", read all comments (`get_task`), add a comment
3. **If no task exists:** Proceed normally, consider creating one
4. **When finished:** Move to "Verify" with summary comment
5. **Post research/analysis as task comments** — preserve context for future sessions
6. **NEVER use raw SQL** for board ops — always use VibeCodes MCP tools

Applies even when resuming from context compaction or implementing a provided plan.

### Push to Live = Move Verify to Done
After pushing, move ALL "Verify" tasks to "Done" on the VibeCodes board.

### Blocked Tasks
Move to "Blocked/Requires User Input" with a comment explaining why.

## Key Patterns (Bug Prevention)

### Supabase Types
- `src/types/database.ts` is **manually maintained** — each table MUST have `Row`, `Insert`, `Update`, AND `Relationships`
- Without `Relationships`, Supabase JS v2.95+ resolves insert/update/delete to `never`
- Use `.maybeSingle()` instead of `.single()` when row might not exist
- Foreign key joins: `users!ideas_author_id_fkey(*)`

### Next.js 16
- `params`, `searchParams`, `cookies()` are all `Promise` types — must `await`
- Server Actions in `src/actions/` with `"use server"`
- `redirect()` throws — re-throw errors with `digest` starting with `NEXT_REDIRECT` in client catch blocks
- All client catch blocks should `toast.error()` — never fail silently
- Error boundaries (`error.tsx`) report to Sentry via `Sentry.captureException()`; root uses `global-error.tsx`

### Auth
- Middleware protects `/dashboard`, `/ideas`, `/profile`, `/admin`, `/agents`
- Middleware excludes `.well-known`, `api/mcp`, `api/oauth`, `oauth`, `monitoring`, `sw.js`
- `useUser()` hook for client-side auth state
- OAuth (GitHub + Google) + email/password with forgot/reset flow + Cloudflare Turnstile CAPTCHA

### Board
- `BoardOpsContext` (`board-context.tsx`) for optimistic UI — returns rollback functions
- Board columns lazy-initialized on first visit; uses `users.default_board_columns` preference or defaults ("To Do", "In Progress", "Done")
- `board_columns.is_done_column` marks complete columns; dashboard excludes these + archived tasks
- Activity logged client-side via `logTaskActivity()` fire-and-forget
- Position calculation: `MAX(position) + 1000` in target column
- Public boards have read-only guest access; non-team guests see `GuestBoardBanner` with option to request collaboration

### Collaboration Requests
- `collaboration_requests` table with `pending`/`accepted`/`declined` status enum
- Users request access → author accepts/rejects from idea detail page (`pending-requests.tsx`)
- Actions: `requestCollaboration`, `withdrawRequest`, `respondToRequest`, `leaveCollaboration` in `src/actions/collaborators.ts`
- Guards against concurrent responses via `.eq("status", "pending")`

### Discussions
- `idea_discussions` + `idea_discussion_replies` tables for titled, threaded planning conversations per idea
- Three statuses: `open` → `resolved` (concluded) or `converted` (promoted to board task)
- Pinnable threads, denormalized `reply_count` + `last_activity_at` via triggers
- `board_tasks.discussion_id` back-links converted discussions to their resulting tasks
- `ideas.discussion_count` denormalized via trigger
- Routes: `/ideas/[id]/discussions` (list), `/ideas/[id]/discussions/[discussionId]` (thread), `/ideas/[id]/discussions/new`
- Server actions in `src/actions/discussions.ts`: createDiscussion, updateDiscussion, deleteDiscussion, createDiscussionReply, updateDiscussionReply, deleteDiscussionReply, convertDiscussionToTask
- RLS: team members can write; authenticated users can read public idea discussions
- Notification types: `discussion`, `discussion_reply` (trigger-based, follows comment notification pattern)

### Email Notifications
- `/api/notifications/email` webhook endpoint, verified via `NOTIFICATION_WEBHOOK_SECRET`
- Triggered by Supabase pg_net webhook on notification inserts
- Sends via Resend API for high-signal types (comment, collaborator, status_change, task_mention, discussion, discussion_reply)
- Respects `users.email_notifications` preference; skips bot users
- Template: `src/lib/email-template.ts` (`buildEmailHtml`)

### Validation
- `src/lib/validation.ts` — all server actions validate before DB ops
- Limits: title 200, description 50K, comment 5K, discussion body 10K, discussion reply 5K, bio 500, tags 50 chars / 10 max

## Database

23 tables with RLS (57 migrations in `supabase/migrations/`):
- **Core**: users, ideas, comments, collaborators, votes, notifications, feedback
- **Board**: board_columns, board_tasks, board_labels, board_task_labels, board_checklist_items, board_task_activity, board_task_comments, board_task_attachments
- **Discussions**: idea_discussions, idea_discussion_replies
- **Agents**: bot_profiles
- **AI**: ai_usage_log, ai_prompt_templates
- **MCP/OAuth**: mcp_oauth_clients, mcp_oauth_codes
- **Collaboration**: collaboration_requests

Key columns:
- `users.is_bot`, `users.is_admin`, `users.ai_daily_limit` (default 10), `users.ai_enabled`, `users.default_board_columns`, `users.email_notifications`, `users.active_bot_id`, `users.encrypted_anthropic_key`
- `ideas.visibility` (public/private) enforced by RLS
- Denormalized counts on ideas (upvotes, comment_count, collaborator_count, discussion_count) via triggers
- `admin_delete_user` RPC cascades from auth.users
- Board tables use `is_idea_team_member()` RLS function

## Server Actions (src/actions/)

14 files, 64 exported functions:
- `ideas.ts` — create, update, updateStatus, updateIdeaFields (partial inline edit), delete
- `board.ts` — columns (init, CRUD, reorder), tasks (CRUD, move, archive), labels (CRUD, assign), checklists (CRUD, toggle), task comments (create, update, delete)
- `collaborators.ts` — requestCollaboration, withdrawRequest, respondToRequest, leaveCollaboration, addCollaborator, removeCollaborator
- `ai.ts` — enhanceIdeaDescription, generateClarifyingQuestions, enhanceIdeaWithContext, applyEnhancedDescription, generateBoardTasks, enhanceTaskDescription, getAiRemainingCredits
- `comments.ts` — create, incorporate, delete, update
- `votes.ts` — toggleVote
- `notifications.ts` — markNotificationsRead, markAllNotificationsRead, updateNotificationPreferences
- `profile.ts` — updateProfile, updateDefaultBoardColumns, saveApiKey, removeApiKey
- `bots.ts` — createBot, updateBot, deleteBot, listMyBots
- `admin.ts` — toggleAiEnabled, setUserAiDailyLimit
- `users.ts` — deleteUser (admin only)
- `prompt-templates.ts` — list, create, delete
- `discussions.ts` — createDiscussion, updateDiscussion, deleteDiscussion, createDiscussionReply, updateDiscussionReply, deleteDiscussionReply, convertDiscussionToTask
- `feedback.ts` — submitFeedback, updateFeedbackStatus, deleteFeedback

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL
SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, API_KEY_ENCRYPTION_KEY
NOTIFICATION_WEBHOOK_SECRET
```

## Deployment

- **Platform**: Vercel (zero-config Next.js, auto-deploys on push to `master`)
- **Production domain**: `vibecodes.co.uk`
- **CI**: GitHub Actions E2E tests (`.github/workflows/e2e.yml`) — 3-browser matrix (Desktop Chrome, Desktop Firefox, Mobile Chrome)
- **Monitoring**: Sentry (`@sentry/nextjs` with source maps), Vercel Analytics + Speed Insights
- **No deployment gates** — E2E runs in parallel but doesn't block Vercel deployment

## Adding DB Tables

1. Migration in `supabase/migrations/`
2. Types in `src/types/database.ts` (include `Relationships`)
3. Export in `src/types/index.ts`
4. Run via Supabase MCP or SQL Editor

## Adding shadcn/ui: `npx shadcn@latest add <name>` → `src/components/ui/` (don't edit manually, except `markdown.tsx`)

## MCP Server

Two modes sharing 38 tools via `mcp-server/src/register-tools.ts` + `McpContext` DI:
- **Local (stdio)**: `mcp-server/src/index.ts` — service-role client, bypasses RLS
- **Remote (HTTP)**: `src/app/api/mcp/[[...transport]]/route.ts` — OAuth 2.1 + PKCE, per-user RLS

Default agent: `a0000000-0000-4000-a000-000000000001` (`bot@vibecodes.local`)

Identity: `set_agent_identity` persists to DB (`users.active_bot_id`). `VIBECODES_BOT_ID` env var overrides on startup. `ctx.userId` = active identity, `ctx.ownerUserId` = real human (for votes, notifications, idea authorship).

Remote endpoint: `https://vibecodes.co.uk/api/mcp` — must exclude MCP/OAuth paths from Next.js middleware.

## .vibecodes/ Config

```json
{ "ideaId": "...", "ideaTitle": "...", "taskId": "...", "botId": "...", "defaultColumn": "..." }
```

Auto-inject `idea_id` into MCP tool calls from `.vibecodes/config.json`.

## Testing Convention

Write tests for all new pure logic, validators, parsers, utilities. Tests co-located as `*.test.ts`. Component changes verified via build + manual testing. Currently 16 unit test files (14 in `src/` + 2 in `mcp-server/`) and 42 E2E spec files across 15 directories.
