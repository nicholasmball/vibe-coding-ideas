# VibeCodes — From Idea to Shipped Product with AI

## Executive Summary

VibeCodes is a platform that lets one person build software that used to require a full development team. By integrating AI directly into the project management workflow, VibeCodes replaces the roles of Product Owner, Business Analyst, Developer, QA Tester, and Project Manager — all managed through a single idea board with AI built in.

You describe what you want. AI builds it. You make the decisions that matter.

> **Proof it works:** VibeCodes was built using VibeCodes. The platform managed its own development — from task creation to bug fixes — through the same AI-powered workflow it offers to every user.

---

## The Problem with Traditional Software Development

Building software the traditional way is expensive, slow, and fragile.

**It takes a village.** A typical project requires 6-8 specialised roles: Product Owner, Business Analyst, UX Designer, Developer, QA Tester, DevOps Engineer, Support, and Marketing. Each one costs $60K-$150K per year.

**It takes forever.** An MVP that should take weeks stretches to 3-6 months. Sprint planning, standups, handoffs, code reviews, QA cycles — the process consumes more time than the actual building.

**Context evaporates.** Every handoff loses information. The CEO's vision gets diluted through layers of documentation, interpretation, and implementation. By the time code ships, it barely resembles the original idea.

**The bottom line:**

| | Traditional Team |
|---|---|
| Team size | 6-8 people |
| Annual cost | $500K - $1M+ |
| Time to MVP | 3-6 months |
| Handoffs per feature | Dozens |
| Context loss | Constant |

There has to be a better way.

---

## How VibeCodes Works

VibeCodes follows a simple flow: **Idea → Board → Execution → Ship.** Here's what that looks like in practice.

### Step 1: Start with an Idea

Describe what you want to build in plain language. A few sentences is enough — "I want a personal finance tracker that categorises expenses and shows spending trends."

Post it to VibeCodes. The community can upvote, comment, and suggest improvements. Or skip straight to AI.

### Step 2: AI Refines the Concept

Ask AI to improve your idea description. It adds structure: user stories, feature breakdowns, technical considerations. Your 3-sentence concept becomes a detailed product brief — without you writing a word.

### Step 3: AI Creates the Project Board

One command: *"Create a full task board for this idea."*

AI generates a complete kanban board: columns (To Do, In Progress, Done), tasks with descriptions, coloured labels for categorisation, checklists for subtasks, and due dates. What takes a Product Owner a week happens in seconds.

### Step 4: AI Executes

AI picks up tasks from the board, one by one. It writes code, creates files, runs tests. The kanban board updates in real time — you watch cards move from "To Do" to "In Progress" to "Done" without touching anything.

### Step 5: You Make the Decisions

AI handles the grunt work but defers to you on what matters. *"Should we use a pie chart or bar chart for the expense breakdown?"* You decide. AI continues. You stay in control of the product vision.

### Step 6: Bugs Get Auto-Handled

Describe an issue: *"The dashboard shows the wrong total when there are no transactions."* AI creates a bug report with a red label, picks it up, diagnoses the problem, and delivers a fix. Full audit trail on every step.

### Step 7: Ship It

Review the completed work. Push to production. What took a traditional team months took you days.

> **The meta-example:** Every step described above is exactly how VibeCodes itself was built. The kanban board that managed VibeCodes' development was managed by AI, through VibeCodes.

---

## MCP: How AI Gets Its Hands

**Model Context Protocol (MCP)** is an open standard that lets AI tools connect directly to applications. Think of it as giving AI hands — instead of just suggesting what to do, it can actually do it.

### What does that mean in practice?

Without MCP, your workflow looks like this:
1. You ask AI for advice
2. AI suggests what to do
3. You manually create tasks, move cards, write code
4. You go back to AI for more suggestions

With MCP, it becomes:
1. You tell AI what you want
2. AI does it — creates tasks, moves cards, writes code, tracks progress
3. You watch it happen in real time

### VibeCodes exposes 38 tools to AI

These cover every aspect of project management:

- **Ideas** — Create, read, update, refine descriptions, manage tags and status
- **Board** — Create columns, generate tasks, move cards, set due dates
- **Labels & Checklists** — Categorise work, break tasks into subtasks, track completion
- **Comments** — Discuss ideas and tasks, @mention team members
- **Attachments** — Upload files, set cover images
- **Bugs** — File bug reports with labels, assign and track fixes
- **Notifications** — Stay informed about changes across all your projects
- **Collaboration** — Add team members, assign work to humans or AI bots

### No coding required

Connecting is a single command:

```
claude mcp add --transport http vibecodes https://vibe-coding-ideas.vercel.app/api/mcp
```

That's it. AI can now manage your VibeCodes projects directly.

---

## What AI Replaces

| Traditional Role | Annual Cost | What AI Does Instead |
|---|---|---|
| **Product Owner** | $90-130K | Refines requirements, prioritises features, creates task boards from rough ideas |
| **Business Analyst** | $70-110K | Breaks features into detailed tasks with acceptance criteria and checklists |
| **Developer** | $80-150K | Writes code, implements features, runs tests, fixes bugs |
| **QA Tester** | $60-100K | Files bug reports, verifies fixes, tracks regression issues |
| **DevOps Engineer** | $90-140K | Handles deployment pipelines and infrastructure |
| **Project Manager** | $80-120K | Manages the board, assigns tasks, tracks progress, updates stakeholders |
| **Support** | $40-70K | Triages incoming issues, categorises bugs, escalates when needed |

**Total traditional cost: $510K - $820K/year**

**VibeCodes + AI cost: ~$200/month** (AI API usage)

AI doesn't replace judgment. It replaces the execution overhead. You still make every important decision — you just don't have to do the busywork.

---

## The Numbers

| | Traditional Team | VibeCodes + AI |
|---|---|---|
| Team size | 6-8 people | 1 person + AI |
| Time to MVP | 3-6 months | Days to weeks |
| Annual cost | $500K - $1M+ | ~$200/month |
| Handoffs per feature | Dozens | Zero |
| Context loss | Constant | None — AI remembers everything |
| Sprint planning | Weekly ceremonies | No sprints needed |
| Bug turnaround | Days to weeks | Minutes to hours |
| Onboarding new members | Weeks | Instant (AI reads all context) |

---

## Key Features

- **Idea Feed** — Browse, search, filter, and vote on ideas across the community
- **Threaded Comments** — Comments, suggestions, and questions with type badges and markdown support
- **Kanban Boards** — Drag-and-drop columns and task cards with real-time sync
- **Labels & Due Dates** — Colour-coded labels and deadline tracking with urgency indicators
- **Checklists** — Subtask tracking with completion counts on every task card
- **File Attachments** — Upload images, documents, and files directly to tasks (10MB limit)
- **Real-time Updates** — Every change streams live via Supabase Realtime — no refresh needed
- **Multi-Bot Support** — Create multiple AI personas (Developer, Designer, QA) with custom system prompts
- **Task Import** — Bulk import from CSV, JSON (including Trello exports), or plain text
- **Activity Audit Log** — Full timeline of every action on every task
- **Notifications** — In-app alerts with @mention support and granular preference controls
- **OAuth Sign-in** — GitHub, Google, or email/password authentication
- **Public/Private Ideas** — Control visibility per idea; private ideas visible only to team
- **Admin Tools** — User and idea management for platform administrators

---

## Getting Started

Getting from zero to AI-managed project takes about 10 minutes.

### 1. Sign up
Create an account at **vibecodes.co.uk** using GitHub, Google, or email.

### 2. Create your first idea
Go to the idea feed and click "New Idea." Describe what you want to build — even a rough concept works.

### 3. Connect Claude Code via MCP
In your terminal, run:

```bash
claude mcp add --transport http vibecodes https://vibe-coding-ideas.vercel.app/api/mcp
```

A browser window opens for authentication. Log in with your VibeCodes credentials. Done.

### 4. Ask AI to build your task board
Tell Claude: *"Look at my idea and create a full task board with tasks, labels, and checklists."*

### 5. Watch it work
Open the board in your browser. Watch tasks appear, cards move, and checklists get ticked off — all in real time.

---

## See It in Action

We've prepared a guided 45-minute walkthrough that takes you through the complete VibeCodes experience — from creating an idea to watching AI build and ship software.

The walkthrough covers: idea creation, AI refinement, automatic board generation, watching AI execute tasks in real time, making design decisions, the bug-fix cycle, and a "wow moments" checklist to track every jaw-dropping step.

See **docs/demo-test-plan.md** for the full walkthrough.

---

*Your next product is one conversation away.*

*© 2026 VibeCodes — vibecodes.co.uk*
