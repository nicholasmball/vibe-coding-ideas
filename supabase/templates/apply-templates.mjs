// One-time script to apply email templates to Supabase via Management API
// Usage: node supabase/templates/apply-templates.mjs

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROJECT_REF = "irqbqxspxxzvuczhujzg";
const API_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!API_TOKEN) {
  console.error("Set SUPABASE_ACCESS_TOKEN env var (management API token)");
  process.exit(1);
}

const read = (file) => readFileSync(resolve(__dirname, file), "utf8");

const payload = {
  // Subject lines
  mailer_subjects_confirmation: "Confirm your VibeCodes account",
  mailer_subjects_recovery: "Reset your VibeCodes password",
  mailer_subjects_magic_link: "Your VibeCodes login link",
  mailer_subjects_invite: "You're invited to VibeCodes",
  mailer_subjects_email_change: "Confirm your new email address",

  // Template content
  mailer_templates_confirmation_content: read("confirm-signup.html"),
  mailer_templates_recovery_content: read("reset-password.html"),
  mailer_templates_magic_link_content: read("magic-link.html"),
  mailer_templates_invite_content: read("invite.html"),
  mailer_templates_email_change_content: read("email-change.html"),
};

console.log("Applying email templates to Supabase project:", PROJECT_REF);
console.log("Templates:", Object.keys(payload).filter(k => k.includes("content")).map(k => k.replace("mailer_templates_", "").replace("_content", "")).join(", "));

const res = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }
);

if (!res.ok) {
  const text = await res.text();
  console.error(`Failed (${res.status}):`, text);
  process.exit(1);
}

console.log("All email templates applied successfully!");
