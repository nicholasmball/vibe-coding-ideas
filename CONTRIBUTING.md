# Contributing to VibeCodes

Thanks for your interest in contributing! This guide will help you get set up and understand our workflow.

## Local Development Setup

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (or Docker for local Supabase)

### Option A: Supabase Cloud

```bash
git clone https://github.com/nicholasgriffintn/vibe-coding-ideas.git
cd vibe-coding-ideas
npm install
cp .env.example .env.local
# Fill in your Supabase project URL and anon key
npm run dev
```

Run the SQL migration files in `supabase/migrations/` in order in the Supabase SQL Editor.

### Option B: Docker (Local Supabase)

```bash
git clone https://github.com/nicholasgriffintn/vibe-coding-ideas.git
cd vibe-coding-ideas
npm install
cp .env.example .env.local
npm run docker:supabase   # Start local Supabase
npm run docker:seed       # Seed with sample data
npm run dev
```

## Branch Naming

Use a prefix that describes the type of change:

- `feat/` — new feature
- `fix/` — bug fix
- `docs/` — documentation only
- `refactor/` — code restructuring without behaviour change

Examples: `feat/task-dependencies`, `fix/realtime-disconnect`, `docs/api-guide`

## Pull Request Process

1. **Fork** the repo and create a branch from `master`
2. Make your changes
3. **Write tests** for any new logic (see Testing below)
4. Run `npm run lint` and `npm run build` to check for errors
5. Open a PR against `master` with a clear title and description
6. Fill in the PR template — include a summary and test plan

Keep PRs focused. One feature or fix per PR is easier to review.

## Code Style

- **Linting**: ESLint is configured — run `npm run lint` before committing
- **Formatting**: Follow the existing patterns in the codebase
- **Tailwind CSS v4**: Use utility classes, follow the shadcn/ui (New York, Zinc) conventions
- **shadcn/ui**: Add new components via `npx shadcn@latest add <name>` — don't hand-edit files in `src/components/ui/` (except `markdown.tsx`)
- **TypeScript**: Strict mode. No `any` unless absolutely necessary
- **Server Actions**: All mutations go through `src/actions/` with `"use server"` directive

## Testing

- **Unit tests** (Vitest): Required for all new utilities, validators, parsers, and pure logic. Tests are co-located as `*.test.ts` next to the source file
- **E2E tests** (Playwright): Required for new user-facing flows. Specs live in `e2e/`
- Run unit tests: `npm run test`
- Run E2E tests: `npm run test:e2e`

## Project Patterns

For detailed patterns, database schema, auth setup, and architectural decisions, see [CLAUDE.md](./CLAUDE.md). Key things to know:

- Database types in `src/types/database.ts` are manually maintained — include `Relationships` for every table
- `params`, `searchParams`, and `cookies()` are all `Promise` types in Next.js 16 — must `await`
- Use `.maybeSingle()` instead of `.single()` when a row might not exist
- Validation lives in `src/lib/validation.ts` — all server actions validate before DB operations

## Finding Work

- **GitHub Issues**: Check for open issues labelled `good first issue` or `help wanted`
- **VibeCodes Board**: The project manages its own tasks on [vibecodes.co.uk](https://vibecodes.co.uk) — browse the public board for ideas

## Questions?

Open an issue or start a discussion. We're happy to help you get started.
