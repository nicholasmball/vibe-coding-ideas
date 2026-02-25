# VibeCodes UX Review & Recommendations

**Date:** 2026-02-21
**Reviewer:** Claude (Senior UX Designer perspective)

---

## Priority 1: High Impact, Low Effort

### 1.1 Add active state to navbar links
**File:** `src/components/layout/navbar.tsx`
**Issue:** All nav links render as `variant="ghost"` with no visual distinction for the current page. Users can't tell where they are.
**Fix:** Use `usePathname()` and conditionally apply `variant="secondary"` or a bottom-border accent to the current route's button.

### 1.2 Add `loading.tsx` skeleton files
**Files:** `src/app/(main)/dashboard/`, `src/app/(main)/ideas/`, `src/app/(main)/ideas/[id]/`, `src/app/(main)/ideas/[id]/board/`
**Issue:** No loading states for server-rendered pages. While the server runs 10+ queries (dashboard has 3 sequential phases), users see a frozen screen with no feedback.
**Fix:** Add `loading.tsx` with skeleton UI in each route directory:
- Dashboard: skeleton stats cards (2x2 grid) + skeleton section cards
- Feed: skeleton search bar + 3 skeleton idea cards
- Idea detail: skeleton title + skeleton description block
- Board: skeleton column headers + placeholder task rectangles

### 1.3 Mark notifications as read on click
**File:** `src/components/layout/notification-bell.tsx`
**Issue:** Clicking a notification navigates to the idea but doesn't mark it as read. The only option is "Mark all read."
**Fix:** Fire `markNotificationRead(id)` as a fire-and-forget call when a notification link is clicked.

### 1.4 Fix feed filter bar mobile overflow
**File:** `src/components/ideas/idea-feed.tsx` (lines 87-123)
**Issue:** Status dropdown (`w-[150px]`) + Sort dropdown (`w-[180px]`) = 330px, leaving no room for the title on screens <375px.
**Fix:** Stack vertically on mobile: `flex-col sm:flex-row` on the container, `w-full sm:w-[150px]` on the selects.

### 1.5 Add `aria-label` to mobile menu button
**File:** `src/components/layout/navbar.tsx` (lines 179-188)
**Issue:** Hamburger button wraps a `Menu` icon with only a Tooltip (not accessible to screen readers).
**Fix:** Add `aria-label="Open navigation menu"` to the button element.

---

## Priority 2: High Impact, Medium Effort

### 2.1 Add product screenshot to landing page hero
**File:** `src/app/page.tsx` (lines 51-86)
**Issue:** Hero section is text-only with gradient blurs. No visual showing what the product looks like. This is the single biggest conversion improvement.
**Fix:** Add a hero screenshot or animated mockup of the kanban board below the copy. Consider a browser-frame wrapper with a subtle shadow/glow effect.

### 2.2 Collapse idea detail action buttons on mobile
**File:** `src/app/(main)/ideas/[id]/page.tsx` (line 215)
**Issue:** Up to 6 action buttons (Edit, Delete, Board, Collaborate, Enhance, etc.) in a single row. Overflows on mobile.
**Fix:** Keep primary actions visible (Vote, Collaborate, Board). Collapse Edit, Delete, and other secondary actions into a "More" dropdown menu (using shadcn `DropdownMenu`).

### 2.3 First-time user onboarding
**Files:** `src/app/(main)/dashboard/page.tsx`, `src/components/dashboard/`
**Issue:** After signup, users land on an empty dashboard with zero stats and no guidance. The "Complete profile" banner only shows on the feed page, not the dashboard.
**Fix:**
1. Show the "Complete profile" banner on the dashboard too
2. Add a "Welcome" card at the top of the dashboard for first-time users with quick actions:
   - "Create your first idea"
   - "Browse the feed"
   - "Read the guide"
3. Dismiss permanently after the user creates their first idea (check `myIdeasCount === 0`)

### 2.4 Debounce feed search
**File:** `src/components/ideas/idea-feed.tsx` (lines 75-83)
**Issue:** Search requires pressing Enter or clicking "Search." Modern feeds search on keystroke with debounce.
**Fix:** Add a 300ms debounced `onChange` handler to auto-submit. Keep Enter-key submission. Remove the explicit "Search" button to save horizontal space.

### 2.5 Mobile board toolbar filter drawer
**File:** `src/components/board/board-toolbar.tsx`
**Issue:** 7-8 toolbar items (search, assignee filter, label filter, due date filter, archived toggle, clear, AI Generate, Import) wrap chaotically on mobile.
**Fix:** On mobile (`md:hidden`), collapse filters into a "Filters" sheet/drawer (using shadcn `Sheet`). Keep only search input + action buttons (Import, AI Generate) visible by default. Show a badge on the Filters button indicating active filter count.

---

## Priority 3: Medium Impact, Medium Effort

### 3.1 Add breadcrumbs to deep pages
**Files:** `src/app/(main)/ideas/[id]/page.tsx`, `src/app/(main)/ideas/[id]/board/page.tsx`
**Issue:** Board page has only "Back to idea." Idea detail has no path back to feed. Users lose context on deep pages.
**Fix:** Add a lightweight breadcrumb component: "Feed > Idea Title > Board". Use shadcn `Breadcrumb` component. Show on idea detail and board pages.

### 3.2 Empty board column placeholder
**File:** `src/components/board/board-column.tsx`
**Issue:** Empty columns show just the header and "Add task" button. No visual hint for drag-and-drop.
**Fix:** Add a subtle "No tasks yet — drag here or click + to add" placeholder in empty columns. Use muted text with a dashed border drop zone indicator.

### 3.3 Add icons to status badges (accessibility)
**File:** `src/lib/constants.ts` (lines 3-27)
**Issue:** Status badges use color alone: emerald (Open), blue (In Progress), purple (Completed), zinc (Archived). Not accessible for color-blind users.
**Fix:** Add icon prefixes:
- Open: `Circle` icon
- In Progress: `Loader` or `ArrowRight` icon
- Completed: `CheckCircle` icon
- Archived: `Archive` icon

### 3.4 Delay PWA install prompt
**File:** `src/components/pwa/install-prompt.tsx`
**Issue:** Shows immediately on page load if `beforeinstallprompt` fires. Jarring for first-time visitors.
**Fix:** Gate on either:
- Minimum session duration (5 minutes), or
- Visit count threshold (3+ visits, stored in localStorage)

### 3.5 Reduce dashboard/ideas/profile data overlap
**Files:** `src/app/(main)/dashboard/page.tsx`, `src/components/ideas/idea-feed.tsx`, `src/app/(main)/profile/[id]/page.tsx`
**Issue:** "My Ideas" appears on dashboard, feed ("My Ideas" tab), and profile. Three places, slightly different presentations.
**Fix:** Make dashboard sections "View all" links route to the feed with pre-applied filters (e.g., `/ideas?view=mine`). Dashboard becomes a summary hub, feed is the canonical list view.

### 3.6 Widen task detail dialog
**File:** `src/components/board/task-detail-dialog.tsx` (line 381)
**Issue:** `sm:max-w-lg` is tight for tasks with cover images, labels, description, checklists, and 4 tabs.
**Fix:** Bump to `sm:max-w-xl`. On `lg:` screens, consider a split-pane layout (task details left, comments/activity right).

### 3.7 Lower landing page stats threshold
**File:** `src/app/page.tsx` (line 141)
**Issue:** Stats section hidden until 50+ ideas. Too high for an early-stage product.
**Fix:** Lower to 10, or show when 2+ of the 3 stat values are > 0.

### 3.8 Fix notification message inconsistency
**File:** `src/components/layout/notification-bell.tsx` (lines 73-79)
**Issue:** "wants to build" doesn't follow the "[actor] [action] [idea]" pattern. Reads oddly: "John wants to build My Cool Project."
**Fix:** Change to "joined as collaborator on" for consistency.

---

## Priority 4: Performance Quick Wins

### 4.1 Merge dashboard Phase 3 query into Phase 2
**File:** `src/app/(main)/dashboard/page.tsx` (lines 329-337)
**Issue:** Third sequential query phase for task counts could be parallel with Phase 2.
**Fix:** Merge the `allDisplayedIdeaIds` task count query into the Phase 2 `Promise.all()` block.

### 4.2 Batch board cover image signed URLs
**File:** `src/components/board/board-task-card.tsx` (lines 100-114)
**Issue:** Each task card with a cover image fires an individual `createSignedUrl()` call. 20 covers = 20 sequential API calls.
**Fix:** Create signed URLs in batch on the server side (in the board page component) and pass pre-signed URLs as props.

### 4.3 Cache navbar admin check
**File:** `src/components/layout/navbar.tsx` (lines 32-41)
**Issue:** Queries `users.is_admin` on every navigation (client component remounts).
**Fix:** Include `is_admin` in user metadata at signup/login, or cache in a React context at the layout level.

### 4.4 Close mobile menu on route change
**File:** `src/components/layout/navbar.tsx` (line 193)
**Issue:** Mobile menu stays open if user navigates via browser back/forward.
**Fix:** Add a `usePathname()` effect that resets `mobileMenuOpen` to `false` on path change.

---

## Priority 5: Nice-to-Have Enhancements

### 5.1 Undo for destructive actions
Show a toast with "Undo" button that delays actual deletion by 5 seconds for non-critical destructive actions (idea deletion, collaborator removal).

### 5.2 Guide promotion post-signup
Include a link to `/guide/getting-started` in the signup confirmation flow or first-time dashboard experience.

### 5.3 GitHub connect nudge
On the idea form, if `githubUsername` is null, show a subtle message: "Connect your GitHub to auto-fill repository URLs" linking to profile settings.

### 5.4 Group profile settings buttons on mobile
Replace 4-5 settings buttons with a "Settings" dropdown on mobile. Keep only "Edit Profile" as a visible button.

### 5.5 Board horizontal scroll indicator
Add a fade-out gradient on the right edge of the kanban board on mobile to hint at horizontal scrolling. Consider scroll-snap for column alignment.

### 5.6 Activity feed day grouping
Add day headers ("Today," "Yesterday," "This Week") to the dashboard Recent Activity section for better scanability.

### 5.7 Focus management after dialog close
Verify that `TaskDetailDialog` returns focus to the triggering task card after close. Radix Dialog usually handles this, but custom `open` state management may bypass it.

### 5.8 Label accessibility patterns
Add optional pattern fills or always show label names alongside color swatches for color-blind users.
