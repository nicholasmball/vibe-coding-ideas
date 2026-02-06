# VibeCodes

A collaborative idea board for vibe coding projects. Share ideas, find collaborators, and build together.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Backend**: Supabase (Auth, Database, Realtime)
- **Theming**: next-themes (dark/light mode)

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Get your project URL and anon key from the [Supabase Dashboard](https://supabase.com/dashboard) under Settings > API.

### 3. Set Up the Database

Run the SQL migration files in `supabase/migrations/` in order (00001 through 00007) in the Supabase SQL Editor.

### 4. Configure OAuth Providers

In your Supabase Dashboard under Authentication > Providers, enable:

- **GitHub**: Add your GitHub OAuth app's client ID and secret
- **Google**: Add your Google OAuth client ID and secret

Set the redirect URL to: `http://localhost:3000/callback`

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Auth pages (login, signup, callback)
│   └── (main)/             # Authenticated pages (feed, ideas, profile)
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Navbar, theme toggle
│   ├── auth/               # OAuth buttons
│   ├── ideas/              # Idea card, feed, form, voting
│   ├── comments/           # Comment thread, form, items
│   └── profile/            # Profile header, tabs
├── actions/                # Server Actions (ideas, votes, comments, etc.)
├── hooks/                  # Custom hooks (useUser, useRealtime)
├── lib/                    # Utilities, constants, Supabase clients
└── types/                  # TypeScript types
```

## Features

- **OAuth Authentication** via GitHub and Google
- **Idea Feed** with sorting (newest, popular, most discussed)
- **Idea Submission** with tags and optional GitHub link
- **Voting** with optimistic updates
- **Threaded Comments** with comment types (comment, suggestion, question)
- **Collaborator System** - join/leave projects
- **Real-time Updates** via Supabase Realtime
- **Dark/Light Theme** toggle
- **Responsive Design** for mobile and desktop
