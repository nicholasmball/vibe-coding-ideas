# Remote MCP Server — Test Plan

## Prerequisites

- `vibecodes-remote` MCP server connected and authenticated
- VibeCodes account logged in via OAuth flow
- A "Claude to Code" label created on the VibeCodes board
- A "Ready to Test" column on the VibeCodes board

## 1. Connection & Discovery

### 1.1 Discovery endpoint returns metadata
- Visit `https://vibe-coding-ideas.vercel.app/.well-known/oauth-authorization-server`
- Should return JSON with issuer, endpoints, supported methods

### 1.2 Protected resource metadata
- Visit `https://vibe-coding-ideas.vercel.app/.well-known/oauth-protected-resource`
- Should return JSON pointing to `/api/mcp` resource

### 1.3 MCP connection via Claude Code
- Run `claude mcp add --transport http vibecodes-remote https://vibe-coding-ideas.vercel.app/api/mcp`
- Restart Claude Code
- `/mcp` should show `vibecodes-remote` as connected after browser OAuth login

---

## 2. Read Operations

### 2.1 List ideas
- Prompt: "List all my ideas on VibeCodes"
- Expected: Calls `list_ideas`, returns all ideas with titles, statuses, tags, counts

### 2.2 Get idea details
- Prompt: "Show me the details of the VibeCodes idea"
- Expected: Calls `get_idea`, returns description, recent comments, collaborators, board summary

### 2.3 Get board
- Prompt: "Show me the VibeCodes kanban board"
- Expected: Calls `get_board`, returns columns with tasks, labels, checklist progress

### 2.4 Get assigned tasks
- Prompt: "What are my assigned tasks across all ideas?"
- Expected: Calls `get_my_tasks`, returns tasks assigned to the authenticated user grouped by idea

### 2.5 Get task details
- Prompt: "Show me the details of task [task name]"
- Expected: Calls `get_task`, returns full task with checklist items, comments, activity log

---

## 3. Write Operations

### 3.1 Create a task
- Prompt: "Create a task on the VibeCodes board called 'Add dark mode toggle to landing page' in the To Do column"
- Expected: Calls `create_task`, task appears in the UI in the To Do column

### 3.2 Move a task
- Prompt: "Move that task to In Progress"
- Expected: Calls `move_task`, task moves to In Progress column in UI

### 3.3 Update a task
- Prompt: "Update that task description to include 'Should use next-themes toggle'"
- Expected: Calls `update_task`, description updated

### 3.4 Add an idea comment
- Prompt: "Add a comment on the VibeCodes idea saying 'Testing remote MCP access'"
- Expected: Calls `add_idea_comment`, comment appears in UI

### 3.5 Add a task comment
- Prompt: "Add a comment on that task saying 'Starting work on this'"
- Expected: Calls `add_task_comment`, comment appears in task detail dialog

### 3.6 Report a bug
- Prompt: "Create a bug report on the VibeCodes board: 'Login button unresponsive on Safari'"
- Expected: Calls `report_bug`, creates task with red "Bug" label

### 3.7 Manage labels
- Prompt: "Add the 'Claude to Code' label to that task"
- Expected: Calls `manage_labels` with `add_to_task` action

### 3.8 Manage checklist
- Prompt: "Add a checklist item 'Write unit tests' to that task"
- Expected: Calls `manage_checklist` with `add` action

### 3.9 Delete a task
- Prompt: "Delete the test task we just created"
- Expected: Calls `delete_task`, task removed from board

---

## 4. Attribution Verification

### 4.1 Comments show real user name
- After test 3.4, check the VibeCodes idea comments in the browser
- Comment should show as posted by "Nick Ball" (your account), NOT "Claude Code Bot"

### 4.2 Task activity shows real user
- After test 3.1, open the task detail dialog and check the activity timeline
- Activity should show "Nick Ball created this task", not the bot

### 4.3 Task comments show real user
- After test 3.5, check the task comment in the detail dialog
- Should show your name as the author

---

## 5. RLS / Permissions Verification

### 5.1 Private idea not visible
- Have another user create a private idea
- Prompt: "Show me idea {their-private-idea-id}"
- Expected: Returns empty/error — RLS blocks access

### 5.2 Non-collaborator board access blocked
- Try to access a board for an idea you're not a collaborator or author on
- Expected: Blocked by `is_idea_team_member()` RLS policy

### 5.3 Cannot modify others' ideas
- Try: "Update the description of idea {someone-else's-idea-id}"
- Expected: Fails due to RLS owner-only update policy

---

## 6. Autonomous Workflow (the real value)

### 6.1 Pick up a labelled task
- Setup: Create a task labelled "Claude to Code" with a clear description
- Prompt: "Check the VibeCodes board for any tasks labelled 'Claude to Code'"
- Expected: Reads board, identifies the labelled task(s), reports back

### 6.2 Full task lifecycle
- Setup: A "Claude to Code" task with description and checklist
- Prompt: "Pick up the 'Claude to Code' task, move it to In Progress, implement it, add a comment with what you did, then move it to Ready to Test"
- Expected flow:
  1. `get_board` — reads the board
  2. `get_task` — reads task details, checklist, comments
  3. `move_task` — moves to In Progress
  4. `add_task_comment` — "Starting work on this"
  5. (writes code in the codebase)
  6. `add_task_comment` — summarizes changes
  7. `move_task` — moves to Ready to Test

### 6.3 Batch task processing
- Setup: Multiple tasks labelled "Claude to Code"
- Prompt: "Check the VibeCodes board, pick up all tasks labelled 'Claude to Code', and work through them one by one"
- Expected: Reads board, identifies multiple tasks, processes them sequentially with the lifecycle above

### 6.4 Bug fixing workflow
- Setup: Tasks labelled "Bug" with reproduction steps in description
- Prompt: "Look at the bug reports on the VibeCodes board and fix them"
- Expected: Filters for Bug-labelled tasks, reads details, implements fixes, moves to Ready to Test

### 6.5 Task refinement
- Setup: A vague task like "Improve the landing page"
- Prompt: "Read the task 'Improve the landing page', break it down into subtasks using the checklist, then start working on the first item"
- Expected: `get_task` → `manage_checklist` (adds items) → implements first checklist item → `manage_checklist` (toggles complete)

### 6.6 Cross-idea awareness
- Prompt: "List all in-progress ideas, check their boards, and give me a status update on what's left to do"
- Expected: `list_ideas` (filtered by in_progress) → `get_board` for each → summarizes remaining tasks

