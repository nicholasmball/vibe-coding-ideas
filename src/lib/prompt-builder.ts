export interface StructuredPromptFields {
  goal: string;
  constraints: string;
  approach: string;
}

const CONSTRAINTS_MARKER = "You must not:";
const APPROACH_MARKER = "Your approach:";
const ROLE_PREFIX = "You are a";

export function generatePromptFromFields(
  role: string,
  fields: StructuredPromptFields
): string {
  const { goal, constraints, approach } = fields;
  const parts: string[] = [];

  // Role + goal paragraph
  const rolePart = role.trim() ? `${ROLE_PREFIX} ${role.trim()}.` : "";
  const goalPart = goal.trim();
  if (rolePart && goalPart) {
    parts.push(`${rolePart} ${goalPart}`);
  } else if (rolePart) {
    parts.push(rolePart);
  } else if (goalPart) {
    parts.push(goalPart);
  }

  if (constraints.trim()) {
    parts.push(`${CONSTRAINTS_MARKER} ${constraints.trim()}`);
  }

  if (approach.trim()) {
    parts.push(`${APPROACH_MARKER} ${approach.trim()}`);
  }

  return parts.join("\n\n");
}

export function parsePromptToFields(
  prompt: string
): StructuredPromptFields | null {
  if (!prompt || !prompt.trim()) return null;

  const text = prompt.trim();

  const constraintsIdx = text.indexOf(CONSTRAINTS_MARKER);
  const approachIdx = text.indexOf(APPROACH_MARKER);

  // Need at least one section marker to consider it structured
  if (constraintsIdx === -1 && approachIdx === -1) return null;

  let goal = "";
  let constraints = "";
  let approach = "";

  // Extract constraints
  if (constraintsIdx !== -1) {
    const start = constraintsIdx + CONSTRAINTS_MARKER.length;
    const end = approachIdx > constraintsIdx ? approachIdx : text.length;
    constraints = text.slice(start, end).trim();
  }

  // Extract approach
  if (approachIdx !== -1) {
    approach = text.slice(approachIdx + APPROACH_MARKER.length).trim();
  }

  // Extract goal: everything before the first section marker, minus the role prefix
  const firstMarkerIdx =
    constraintsIdx !== -1 && approachIdx !== -1
      ? Math.min(constraintsIdx, approachIdx)
      : constraintsIdx !== -1
        ? constraintsIdx
        : approachIdx;

  let goalSection = text.slice(0, firstMarkerIdx).trim();

  // Strip "You are a [role]." prefix from goal
  const rolePrefixMatch = goalSection.match(
    /^You are (?:a |an )?[^.]+\.\s*/i
  );
  if (rolePrefixMatch) {
    goalSection = goalSection.slice(rolePrefixMatch[0].length).trim();
  }

  goal = goalSection;

  return { goal, constraints, approach };
}

export function isStructuredPrompt(prompt: string): boolean {
  return parsePromptToFields(prompt) !== null;
}
