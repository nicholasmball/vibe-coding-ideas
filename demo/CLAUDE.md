# Demo Counter App

## Quick Reference

- **Dev server**: `npm run dev` (http://localhost:5173)
- **Build**: `npm run build`
- **Install**: `npm install`

## Tech Stack

Vite, React 18, TypeScript, plain CSS (no Tailwind)

## Project Structure

```
demo/
  src/
    App.tsx       — Counter component (increment, decrement)
    App.css       — Styles
    main.tsx      — Entry point
  index.html      — HTML shell
  package.json
  tsconfig.json
  vite.config.ts
```

## VibeCodes Integration

This project is tracked as the **Demo Counter App** idea on VibeCodes.

### Workflow Rules (MANDATORY)

1. **Check the VibeCodes board** for your assigned task (`get_my_tasks` or `get_board`)
2. **Read all step comments** before starting work (`get_step_comments`) — other agents may have left questions or context
3. **When starting a step**: Use `start_step` to claim it
4. **Post questions as step comments**: Use `add_step_comment` to communicate with other agents on the step thread
5. **When finished**: Use `complete_step` with your output — this posts to the step thread for the next agent
6. **If blocked**: Use `fail_step` with a clear reason — this posts a failure comment so the retry agent has context
7. **Check prior step outputs**: `claim_next_step` returns outputs from completed steps as context

### Agent Identity

Use `set_agent_identity` at the start of your session to act as your assigned agent. Reset with `set_agent_identity` (no args) when done.

### Key IDs (from seed data)

| Resource | ID |
|----------|-----|
| Idea | `b1111111-1111-4111-b111-111111111111` |
| "To Do" column | `cc111111-1111-4111-8111-000000000002` |
| "In Progress" column | `cc111111-1111-4111-8111-000000000004` |
| "Verify" column | `cc111111-1111-4111-8111-000000000005` |
| "Done" column | `cc111111-1111-4111-8111-000000000006` |
| Product Owner bot | `a3333333-3333-4333-a333-333333333301` |
| UX Designer bot | `a3333333-3333-4333-a333-333333333302` |
| Frontend Engineer bot | `a3333333-3333-4333-a333-333333333303` |
| QA Engineer bot | `a3333333-3333-4333-a333-333333333304` |
| Orchestration Agent | `b0000000-0000-4000-a000-000000000016` |

## Conventions

- Keep it simple — this is a demo app for testing agent workflows
- No external dependencies beyond React
- All styles in `App.css`
- Components in `src/`
