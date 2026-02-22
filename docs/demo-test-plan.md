# VibeCodes: The "Be Amazed" Walkthrough

**Estimated time:** ~45 minutes
**What you'll need:** A browser, Claude Code (or Claude Desktop), and 45 minutes of uninterrupted time
**What you'll experience:** Going from a rough idea to a managed project with AI doing the heavy lifting — no team, no sprint planning, no project manager

---

## Prerequisites (5 minutes)

Before we start, let's get everything set up. This only takes a few minutes.

### 1. Create your VibeCodes account

Go to [vibecodes.co.uk](https://vibecodes.co.uk) and sign up using GitHub, Google, or email/password. Whatever is fastest for you.

### 2. Complete your profile

Click your avatar in the top-right corner, go to your profile, and fill in your name and a short bio. This is how AI and other users will identify you on the platform.

### 3. Install Claude Code CLI

If you don't already have it, install Claude Code:

```bash
npm install -g @anthropic-ai/claude-code
```

Full installation docs: [https://docs.anthropic.com/en/docs/claude-code](https://docs.anthropic.com/en/docs/claude-code)

### 4. Connect VibeCodes as a remote MCP server

Run this command in your terminal:

```bash
claude mcp add --transport http vibecodes https://vibe-coding-ideas.vercel.app/api/mcp
```

A browser window will open. Log in with the same VibeCodes account you just created. Authorize the connection when prompted.

### 5. Verify the connection

Open Claude Code and ask:

```
List my VibeCodes ideas
```

**Expected:** Claude responds with your idea list (which will be empty if you just signed up). If it responds without errors, you're connected. You're ready to go.

---

## Phase 1: Idea to Board (10 minutes)

This is where things start to get interesting. You're going to go from a vague concept to a fully planned project.

### Step 1: Create an idea in the browser

1. Go to [vibecodes.co.uk/ideas/new](https://vibecodes.co.uk/ideas/new)
2. Fill in the form:
   - **Title:** "Personal Finance Tracker" (or whatever project excites you)
   - **Description:** Write 2-3 sentences about what you want to build. Keep it rough — that's the point. For example: *"A web app that helps people track their income and expenses. It should have a dashboard with charts showing spending categories. Users should be able to set monthly budgets and get alerts when they're close to the limit."*
   - **Tags:** Pick 2-3 relevant tags (e.g., "Web App", "Finance", "Dashboard")
   - **Visibility:** Public
3. Click **Submit**

**Expected:** Your idea appears on the feed. You can see it, vote on it, and share the link. Right now it's a rough sketch — three sentences and some tags. That's about to change.

### Step 2: Ask AI to refine your idea

Switch to Claude Code and say:

```
Look at my idea "Personal Finance Tracker" and improve the description. Add more detail,
user stories, technical scope, and a clear vision for what this product should be.
```

**Expected:** Claude reads your idea via MCP, thinks about it, and rewrites the description with structured detail — user stories, technical requirements, feature breakdowns, and a clear product vision.

Now switch back to your browser. Refresh the idea page.

**Expected:** The description has been updated. What was 3 sentences is now a comprehensive product spec. You didn't write any of it. The AI read your intent and expanded it into something you could hand to a development team.

### Step 3: Ask AI to create the full task board

This is the big one. Back in Claude Code, say:

```
Create a full task board for my "Personal Finance Tracker" idea. Break the project down
into well-organized columns and tasks. Add labels for priority and category, checklists
for subtasks, and due dates where appropriate. Make it comprehensive.
```

**Expected:** Claude creates columns (e.g., "To Do", "In Progress", "Done", or more specific ones like "Backend", "Frontend", "Design"), then populates them with 10-20 tasks. Each task has:
- A clear title and description
- Colored labels (e.g., "High Priority" in red, "Frontend" in blue)
- Checklists with specific subtasks
- Due dates for time-sensitive items

Now open the board in your browser: click on your idea, then click the board icon.

> **WOW MOMENT:** A full project plan — with tasks, labels, checklists, and due dates — materialized from a 3-sentence idea. No one sat in a planning meeting. No one wrote tickets. AI read your vision and broke it down into actionable work.

---

## Phase 2: Watch AI Work (15 minutes)

Now you're going to sit back and watch AI execute against the plan it just created.

### Step 4: Assign a task to AI

In Claude Code, say:

```
Pick up the first task in the To Do column and start working on it.
```

**Expected:** Claude assigns itself to the task, moves it to "In Progress", and begins working. You'll see it read the task details, check the checklists, and start executing.

Switch to your browser and watch the board.

**Expected:** The task card moves from "To Do" to "In Progress" in real time. You didn't touch anything. The assignee avatar appears on the card. The activity timeline on the task shows every action AI took.

### Step 5: Watch multiple tasks get completed

Let Claude continue working. You can either watch in real time or check back periodically. As it finishes each task, tell it:

```
Great, pick up the next task.
```

Or let it work autonomously through several tasks. After 3-5 tasks:

1. **Check the board** — tasks have moved from "To Do" through "In Progress" to "Done"
2. **Click on a completed task** — open the detail dialog and look at:
   - The **activity timeline**: every change is logged with timestamps (assigned, moved, checklist items completed, comments added)
   - The **checklists**: subtasks are ticked off as AI completed each one
   - The **comments**: AI left notes about decisions it made and work it completed

> **WOW MOMENT:** Tasks are visibly moving across the board without you touching anything. Checklists fill up. Comments appear. The activity log captures everything. It's like watching an invisible team work.

### Step 6: Check the code

While AI was "completing tasks", it was writing actual code in your local project directory. Take a look:

```bash
ls -la src/
```

Review the files Claude created. These aren't stubs or placeholders — they're real, functional implementations based on the task descriptions and checklists.

> **WOW MOMENT:** Working software emerged from a conversation. You described what you wanted, AI planned it, and then AI built it. The code is in your project, ready to run.

---

## Phase 3: Decision Points (5 minutes)

AI doesn't just execute blindly. It knows when to ask you for input.

### Step 7: AI asks for your opinion

As Claude works through tasks, it will encounter design decisions that require your judgment. For example, it might ask:

- *"Should we use a pie chart or bar chart for the expense breakdown?"*
- *"Do you want email notifications for budget alerts, or just in-app?"*
- *"Should the dashboard default to monthly or weekly view?"*

You decide. Give a one-sentence answer. AI incorporates your decision and keeps going.

**Expected:** You stay in control of the product vision. AI handles the execution. You make the calls that matter — the ones about what the product should feel like — without writing a single line of code.

### Step 8: Reprioritize instantly

Now test something that would normally derail a team's sprint. In Claude Code, say:

```
Actually, pause what you're doing. The user authentication feature is more important --
pick that up first and come back to the current task later.
```

**Expected:** Claude moves its current task back to "To Do" (or a "Paused" state), picks up the authentication task, assigns itself, moves it to "In Progress", and starts working on it. All of this happens on the board in real time.

> **WOW MOMENT:** Reprioritization is instant. No stand-ups. No renegotiating the sprint. No hurt feelings. You say "this matters more now" and work shifts immediately. This is what agility was supposed to feel like.

---

## Phase 4: Bug Cycle (5 minutes)

Every project has bugs. Let's see how fast the cycle can be.

### Step 9: Report a bug in plain English

In Claude Code, say:

```
There's a bug: the dashboard shows the wrong total when there are no transactions.
It should show $0 but it shows NaN.
```

**Expected:** Claude creates a new task on the board with:
- A clear title describing the bug
- A red **"Bug"** label
- A description with reproduction steps
- Self-assigned so it can start working immediately

Switch to the browser. Look at the board.

**Expected:** A new card has appeared with a red "Bug" label. It's already in the "In Progress" column because AI picked it up immediately.

### Step 10: Watch the fix

Claude will:
1. Read the bug description
2. Locate the relevant code
3. Diagnose the root cause
4. Implement the fix
5. Update the task checklist
6. Move the task to "Done"
7. Leave a comment explaining what was wrong and how it was fixed

Click on the completed bug task and check the activity log. Every step is documented.

> **WOW MOMENT:** Bug report to diagnosis to fix to done — all from one sentence. The entire cycle that normally takes hours of context-switching happened in minutes. And there's a full audit trail of exactly what happened.

---

## Phase 5: Ship It (5 minutes)

Step back and look at what you've built.

### Step 11: Review the board

1. Look at the **Done column** — multiple completed tasks with green checkmarks
2. Click on each completed task and review:
   - The activity timeline showing every action taken
   - The checklist items, all ticked off
   - The comments AI left about its work
3. Check the code in your project — real, reviewable, functional code

### Step 12: Reflect on what just happened

In approximately 45 minutes, you went from *"I want a finance tracker"* to a project with:

- A **detailed, refined idea description** that reads like a proper product spec
- A **full kanban board** with organized columns, tasks, colored labels, checklists, and due dates
- **Multiple tasks completed** with real, working code in your project
- A **bug filed and fixed** from a single sentence
- A **full activity audit trail** documenting every decision and action
- **Real-time board updates** reflecting every change as it happened

With a traditional team, getting to this point typically takes 2-4 weeks: writing requirements, sprint planning, ticket creation, daily standups, code reviews, and status meetings. You did it in under an hour with one conversation.

---

## "Wow" Moments Checklist

How many did you experience?

- [ ] AI refined your idea description — transforming 3 sentences into a comprehensive product spec
- [ ] A full project board appeared from a rough concept — columns, tasks, labels, checklists, due dates
- [ ] Tasks moved across the board in real time without you touching them
- [ ] AI wrote real, working code — not stubs, not pseudocode, actual implementations
- [ ] AI asked YOU for decisions — you stayed in control of the vision
- [ ] You reprioritized the entire project with one sentence
- [ ] A bug was filed, diagnosed, and fixed from a single plain-English description
- [ ] Every action was tracked in the activity timeline — full audit trail
- [ ] Total time from idea to working prototype: under 1 hour

---

## What You Just Experienced

This is what software development looks like when AI is a first-class participant, not just an autocomplete in your editor.

VibeCodes doesn't replace developers — it amplifies them. One person with a clear vision and an AI assistant can accomplish what used to require a full team of product managers, project managers, and engineers just to get organized. The planning, the ticket writing, the status tracking, the context switching — all of that overhead collapses into a conversation.

The platform captures everything: every idea, every task, every decision, every change. Nothing is lost in Slack threads or forgotten in meetings. And because it's built on MCP, any AI tool that supports the protocol can plug in and participate.

This is the future of building software. You just lived it.

---

## Next Steps

Now that you've seen what's possible, here's where to go from here:

- **Explore the idea feed** — see what other people are building and vote on ideas that inspire you
- **Try a more ambitious project** — pick something you've been putting off and let AI help you plan it
- **Invite collaborators** — add team members to your idea. Humans and AI working on the same board, in real time
- **Connect your own projects** — use the MCP integration with your existing codebases
- **Create custom bot personas** — set up specialised AI assistants (a QA tester, a UX designer, a backend engineer) that each bring different expertise to your board
- **Go deeper on the board** — try importing tasks from CSV or JSON, filtering by labels or assignees, archiving completed work, and using the search and filter toolbar
