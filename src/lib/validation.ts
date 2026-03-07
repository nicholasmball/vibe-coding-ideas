// Server-side input validation for server actions

export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 50000;
export const MAX_COMMENT_LENGTH = 5000;
export const MAX_BIO_LENGTH = 500;
export const MAX_TAG_LENGTH = 50;
export const MAX_TAGS = 10;
export const MAX_LABEL_NAME_LENGTH = 50;
export const MAX_IDEA_ATTACHMENTS = 10;
export const MAX_IDEA_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_IDEA_ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "text/markdown",
] as const;

const VALID_LABEL_COLORS = [
  "red", "orange", "amber", "yellow", "lime", "green",
  "emerald", "blue", "cyan", "violet", "purple", "pink",
  "rose", "zinc",
];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const GITHUB_URL_PATTERN = /^https:\/\/github\.com\/.+/;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validateTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) throw new ValidationError("Title is required");
  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new ValidationError(`Title must be ${MAX_TITLE_LENGTH} characters or less`);
  }
  return trimmed;
}

export function validateDescription(description: string): string {
  const trimmed = description.trim();
  if (!trimmed) throw new ValidationError("Description is required");
  if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
    throw new ValidationError(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`);
  }
  return trimmed;
}

export function validateOptionalDescription(description: string | null): string | null {
  if (!description) return null;
  const trimmed = description.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
    throw new ValidationError(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`);
  }
  return trimmed;
}

export function validateComment(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) throw new ValidationError("Comment cannot be empty");
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    throw new ValidationError(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`);
  }
  return trimmed;
}

export function validateGithubUrl(url: string | null): string | null {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  if (!GITHUB_URL_PATTERN.test(trimmed)) {
    throw new ValidationError("GitHub URL must start with https://github.com/");
  }
  return trimmed;
}

export function validateTags(tagsRaw: string): string[] {
  if (!tagsRaw) return [];
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  if (tags.length > MAX_TAGS) {
    throw new ValidationError(`Maximum ${MAX_TAGS} tags allowed`);
  }
  for (const tag of tags) {
    if (tag.length > MAX_TAG_LENGTH) {
      throw new ValidationError(`Tag "${tag}" exceeds ${MAX_TAG_LENGTH} characters`);
    }
  }
  return tags;
}

export function validateLabelColor(color: string): string {
  if (!VALID_LABEL_COLORS.includes(color)) {
    throw new ValidationError(`Invalid label color: ${color}`);
  }
  return color;
}

export function validateLabelName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new ValidationError("Label name is required");
  if (trimmed.length > MAX_LABEL_NAME_LENGTH) {
    throw new ValidationError(`Label name must be ${MAX_LABEL_NAME_LENGTH} characters or less`);
  }
  return trimmed;
}

export const MAX_DISCUSSION_BODY_LENGTH = 10000;
export const MAX_DISCUSSION_REPLY_LENGTH = 5000;

export function validateDiscussionTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) throw new ValidationError("Discussion title is required");
  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new ValidationError(`Discussion title must be ${MAX_TITLE_LENGTH} characters or less`);
  }
  return trimmed;
}

export function validateDiscussionBody(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) throw new ValidationError("Discussion body is required");
  if (trimmed.length > MAX_DISCUSSION_BODY_LENGTH) {
    throw new ValidationError(`Discussion body must be ${MAX_DISCUSSION_BODY_LENGTH} characters or less`);
  }
  return trimmed;
}

export function validateDiscussionReply(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) throw new ValidationError("Reply cannot be empty");
  if (trimmed.length > MAX_DISCUSSION_REPLY_LENGTH) {
    throw new ValidationError(`Reply must be ${MAX_DISCUSSION_REPLY_LENGTH} characters or less`);
  }
  return trimmed;
}

export const MAX_TEAM_NAME_LENGTH = 200;
export const MAX_TEAM_DESCRIPTION_LENGTH = 1000;

export function validateTeamName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new ValidationError("Team name is required");
  if (trimmed.length > MAX_TEAM_NAME_LENGTH) {
    throw new ValidationError(`Team name must be ${MAX_TEAM_NAME_LENGTH} characters or less`);
  }
  return trimmed;
}

export function validateTeamDescription(description: string | null): string | null {
  if (!description) return null;
  const trimmed = description.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_TEAM_DESCRIPTION_LENGTH) {
    throw new ValidationError(`Team description must be ${MAX_TEAM_DESCRIPTION_LENGTH} characters or less`);
  }
  return trimmed;
}

export const MAX_AVATAR_URL_LENGTH = 2000;

export function validateAvatarUrl(url: string | null): string | null {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.length > MAX_AVATAR_URL_LENGTH) {
    throw new ValidationError("Avatar URL is too long");
  }
  try {
    new URL(trimmed);
  } catch {
    throw new ValidationError("Invalid avatar URL");
  }
  return trimmed;
}

export function validateUuid(value: string, label = "ID"): string {
  const trimmed = value.trim();
  if (!trimmed) throw new ValidationError(`${label} is required`);
  if (!UUID_PATTERN.test(trimmed)) {
    throw new ValidationError(`${label} must be a valid UUID`);
  }
  return trimmed;
}

export function validateBio(bio: string | null): string | null {
  if (!bio) return null;
  const trimmed = bio.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_BIO_LENGTH) {
    throw new ValidationError(`Bio must be ${MAX_BIO_LENGTH} characters or less`);
  }
  return trimmed;
}

export const MAX_SKILLS = 10;
export const MAX_SKILL_LENGTH = 30;

export function validateSkills(skills: string[]): string[] {
  if (!skills || skills.length === 0) return [];
  const cleaned = skills
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const unique = [...new Set(cleaned)];
  if (unique.length > MAX_SKILLS) {
    throw new ValidationError(`Maximum ${MAX_SKILLS} skills allowed`);
  }
  for (const skill of unique) {
    if (skill.length > MAX_SKILL_LENGTH) {
      throw new ValidationError(`Skill "${skill}" exceeds ${MAX_SKILL_LENGTH} characters`);
    }
  }
  return unique;
}

export const MAX_DELIVERABLES = 10;
export const MAX_DELIVERABLE_LENGTH = 100;

export function validateDeliverables(deliverables: string[]): string[] {
  if (!deliverables || deliverables.length === 0) return [];
  const cleaned = deliverables
    .map((d) => d.trim())
    .filter(Boolean);
  const unique = [...new Set(cleaned)];
  if (unique.length > MAX_DELIVERABLES) {
    throw new ValidationError(`Maximum ${MAX_DELIVERABLES} deliverables allowed`);
  }
  for (const d of unique) {
    if (d.length > MAX_DELIVERABLE_LENGTH) {
      throw new ValidationError(`Deliverable "${d}" exceeds ${MAX_DELIVERABLE_LENGTH} characters`);
    }
  }
  return unique;
}

export const MAX_WORKFLOW_TEMPLATES = 10;
export const MAX_WORKFLOW_TEMPLATE_STEPS = 20;

export function validateWorkflowTemplates(
  templates: unknown[]
): { name: string; steps: { agent_role: string; title?: string; description?: string; human_check_required?: boolean }[] }[] {
  if (!templates || templates.length === 0) return [];
  if (templates.length > MAX_WORKFLOW_TEMPLATES) {
    throw new ValidationError(`Maximum ${MAX_WORKFLOW_TEMPLATES} workflow templates allowed`);
  }

  return templates.map((t, i) => {
    const tmpl = t as Record<string, unknown>;
    if (!tmpl.name || typeof tmpl.name !== "string" || !tmpl.name.trim()) {
      throw new ValidationError(`Workflow template ${i + 1} must have a name`);
    }
    if (tmpl.name.length > 100) {
      throw new ValidationError(`Workflow template name "${tmpl.name}" exceeds 100 characters`);
    }
    const steps = tmpl.steps;
    if (!Array.isArray(steps) || steps.length === 0) {
      throw new ValidationError(`Workflow template "${tmpl.name}" must have at least one step`);
    }
    if (steps.length > MAX_WORKFLOW_TEMPLATE_STEPS) {
      throw new ValidationError(`Workflow template "${tmpl.name}" exceeds ${MAX_WORKFLOW_TEMPLATE_STEPS} steps`);
    }

    const validatedSteps = steps.map((s, j) => {
      const step = s as Record<string, unknown>;
      if (!step.agent_role || typeof step.agent_role !== "string" || !step.agent_role.trim()) {
        throw new ValidationError(`Step ${j + 1} in "${tmpl.name}" must have an agent_role`);
      }
      if (step.agent_role.length > 50) {
        throw new ValidationError(`Agent role "${step.agent_role}" exceeds 50 characters`);
      }
      const result: { agent_role: string; title?: string; description?: string; human_check_required?: boolean } = {
        agent_role: (step.agent_role as string).trim(),
      };
      if (step.title && typeof step.title === "string") result.title = step.title.trim().slice(0, 200);
      if (step.description && typeof step.description === "string") result.description = step.description.trim().slice(0, 1000);
      if (typeof step.human_check_required === "boolean") result.human_check_required = step.human_check_required;
      return result;
    });

    return { name: tmpl.name.trim(), steps: validatedSteps };
  });
}
