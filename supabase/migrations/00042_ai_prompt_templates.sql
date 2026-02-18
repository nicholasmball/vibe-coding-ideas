-- AI prompt templates for BYOK / saved prompts
CREATE TABLE public.ai_prompt_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  prompt_text text NOT NULL,
  type text NOT NULL DEFAULT 'enhance' CHECK (type IN ('enhance', 'generate')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE public.ai_prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own templates"
  ON public.ai_prompt_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
  ON public.ai_prompt_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON public.ai_prompt_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_ai_prompt_templates_user_id ON public.ai_prompt_templates(user_id);
