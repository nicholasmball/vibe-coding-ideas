-- Add encrypted API key storage for BYOK (Bring Your Own Key)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS encrypted_anthropic_key text;

-- Only the user can read/write their own key (RLS already covers users table)
COMMENT ON COLUMN public.users.encrypted_anthropic_key IS 'AES-256-GCM encrypted Anthropic API key (iv:ciphertext:authTag)';
