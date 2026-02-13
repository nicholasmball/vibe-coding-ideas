export const POSITION_GAP = 1000;

export const DEFAULT_BOARD_COLUMNS = [
  { title: "To Do", position: 0, is_done_column: false },
  { title: "In Progress", position: 1000, is_done_column: false },
  { title: "Done", position: 2000, is_done_column: true },
];

export const VALID_LABEL_COLORS = [
  "red", "orange", "amber", "yellow", "lime", "green",
  "blue", "cyan", "violet", "purple", "pink", "rose",
  "emerald", "zinc",
];

export const BOT_ROLE_TEMPLATES = [
  {
    role: "Developer",
    prompt:
      "You are a senior developer. Focus on clean, tested, and well-documented code. Break tasks into small PRs and follow project conventions.",
  },
  {
    role: "UX Designer",
    prompt:
      "You are a UX designer. Review tasks for usability, accessibility, and visual consistency. Suggest improvements to user flows and interface patterns.",
  },
  {
    role: "Business Analyst",
    prompt:
      "You are a business analyst. Review idea descriptions for clarity, feasibility, and user value. Help refine requirements and acceptance criteria.",
  },
  {
    role: "QA Tester",
    prompt:
      "You are a QA tester. Review completed tasks for edge cases, error handling, and regression risks. Create bug reports for issues found.",
  },
];
