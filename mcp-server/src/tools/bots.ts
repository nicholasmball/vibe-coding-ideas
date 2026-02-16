import { z } from "zod";
import type { McpContext } from "../context";

// --- Schemas ---

export const listBotsSchema = z.object({
  owner_id: z
    .string()
    .uuid()
    .optional()
    .describe("Filter by owner user ID. Defaults to current user."),
});

export const getBotPromptSchema = z.object({
  bot_id: z
    .string()
    .uuid()
    .optional()
    .describe("Bot ID to get prompt for. Defaults to active bot identity."),
});

export const setBotIdentitySchema = z.object({
  bot_id: z
    .string()
    .uuid()
    .optional()
    .describe("Bot ID to switch to. Omit both bot_id and bot_name to reset to default."),
  bot_name: z
    .string()
    .optional()
    .describe("Bot name to search for (if bot_id not provided)."),
});

export const createBotSchema = z.object({
  name: z.string().min(1).max(100).describe("Bot display name"),
  role: z.string().max(50).optional().describe("Bot role (e.g. Developer, QA Tester)"),
  system_prompt: z
    .string()
    .max(10000)
    .optional()
    .describe("System prompt for the bot persona"),
  avatar_url: z.string().url().optional().describe("Avatar URL for the bot"),
});

// --- Handlers ---

export async function listBots(
  ctx: McpContext,
  args: z.infer<typeof listBotsSchema>
) {
  const ownerId = args.owner_id ?? ctx.userId;

  const { data, error } = await ctx.supabase
    .from("bot_profiles")
    .select("*, user:users!bot_profiles_id_fkey(avatar_url, full_name)")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((bot) => ({
    id: bot.id,
    name: bot.name,
    role: bot.role,
    system_prompt: bot.system_prompt,
    is_active: bot.is_active,
    avatar_url: bot.avatar_url ?? (bot.user as any)?.avatar_url ?? null,
    created_at: bot.created_at,
  }));
}

export async function getBotPrompt(
  ctx: McpContext,
  args: z.infer<typeof getBotPromptSchema>
) {
  const botId = args.bot_id ?? ctx.userId;

  const { data, error } = await ctx.supabase
    .from("bot_profiles")
    .select("id, name, role, system_prompt")
    .eq("id", botId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Bot profile not found");

  return data;
}

export async function setBotIdentity(
  ctx: McpContext,
  args: z.infer<typeof setBotIdentitySchema>,
  onIdentityChange: (botId: string | null) => void
) {
  const persistUserId = ctx.ownerUserId ?? ctx.userId;

  // Reset to default if neither provided
  if (!args.bot_id && !args.bot_name) {
    onIdentityChange(null);

    // Persist null to DB
    await ctx.supabase
      .from("users")
      .update({ active_bot_id: null })
      .eq("id", persistUserId);

    return {
      active_bot: null,
      instruction:
        "Identity reset to default. You are no longer acting as a specific bot persona. " +
        "Stop following any previous bot system prompt and return to your normal behavior. " +
        "This change has been persisted and will survive reconnections.",
    };
  }

  let botId = args.bot_id;

  // Look up by name if no ID provided
  if (!botId && args.bot_name) {
    const { data, error } = await ctx.supabase
      .from("bot_profiles")
      .select("id, name, is_active")
      .ilike("name", args.bot_name)
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error(`No bot found with name "${args.bot_name}"`);
    botId = data.id;
  }

  // Fetch the bot profile
  const { data: bot, error } = await ctx.supabase
    .from("bot_profiles")
    .select("id, name, role, system_prompt, is_active")
    .eq("id", botId!)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!bot) throw new Error("Bot not found");
  if (!bot.is_active) throw new Error("Bot is inactive. Activate it first.");

  onIdentityChange(bot.id);

  // Persist to DB
  await ctx.supabase
    .from("users")
    .update({ active_bot_id: bot.id })
    .eq("id", persistUserId);

  const result: Record<string, unknown> = {
    active_bot: {
      id: bot.id,
      name: bot.name,
      role: bot.role,
    },
  };

  if (bot.system_prompt) {
    result.system_prompt = bot.system_prompt;
    result.instruction =
      `You are now acting as "${bot.name}"${bot.role ? ` (${bot.role})` : ""}. ` +
      `All your actions (comments, task updates, activity) will be attributed to this bot. ` +
      `This identity has been persisted and will survive reconnections. ` +
      `IMPORTANT: You MUST follow the system_prompt above for the rest of this session. ` +
      `It defines your persona, behavior, and how you should approach tasks.`;
  } else {
    result.instruction =
      `You are now acting as "${bot.name}"${bot.role ? ` (${bot.role})` : ""}. ` +
      `All your actions (comments, task updates, activity) will be attributed to this bot. ` +
      `This identity has been persisted and will survive reconnections.`;
  }

  return result;
}

export async function createBot(
  ctx: McpContext,
  args: z.infer<typeof createBotSchema>
) {
  const ownerId = ctx.ownerUserId ?? ctx.userId;

  const { data, error } = await ctx.supabase.rpc("create_bot_user", {
    p_name: args.name,
    p_owner_id: ownerId,
    p_role: args.role ?? null,
    p_system_prompt: args.system_prompt ?? null,
    p_avatar_url: args.avatar_url ?? null,
  });

  if (error) throw new Error(error.message);

  // Fetch the created profile
  const { data: profile } = await ctx.supabase
    .from("bot_profiles")
    .select("id, name, role, system_prompt, is_active, avatar_url")
    .eq("id", data)
    .single();

  return profile;
}
