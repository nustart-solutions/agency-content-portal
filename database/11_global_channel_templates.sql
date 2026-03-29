-- 1. Create the Global Channel Templates table
CREATE TABLE IF NOT EXISTS public.global_channel_templates (
    channel_name VARCHAR(50) PRIMARY KEY,
    template_instructions TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp
);

-- 2. Turn on Row Level Security
ALTER TABLE public.global_channel_templates ENABLE ROW LEVEL SECURITY;

-- 3. Service Role Policy (Modal/Backend needs full read access)
CREATE POLICY "Service Role Full Access for Global Templates"
ON public.global_channel_templates FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Authenticated Users (Admins) Policies
CREATE POLICY "Authenticated users can view global templates"
ON public.global_channel_templates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update global templates"
ON public.global_channel_templates FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can insert global templates"
ON public.global_channel_templates FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete global templates"
ON public.global_channel_templates FOR DELETE
TO authenticated
USING (true);

-- 5. Seed Initial Default Templates
INSERT INTO public.global_channel_templates (channel_name, template_instructions)
VALUES
  ('gmb_post', '- STRICT CONSTRAINT: Must be under 1,500 characters total.
- Format: Highly local, direct, and action-oriented.
- Focus: Drive immediate local awareness or foot traffic based on the article''s core value.
- Do NOT use hashtags (they do not work on GMB).'),

  ('twitter', '- STRICT CONSTRAINT: Must be under 280 characters.
- Format: An engaging hook followed by a punchy summary.
- Focus: Spark curiosity and drive clicks.
- Include 1-2 highly relevant hashtags.'),

  ('linkedin', '- Format: "Broetry" style with frequent single-sentence line breaks for maximum scroll-stopping readability. 
- Tone: Professional, thought-leadership, industry-focused.
- Focus: Start with a contrarian or insight-driven hook. Outline the main takeaways from the article.
- Include 3-5 relevant hashtags at the bottom.'),

  ('email_newsletter', '- Format: Compelling subject line at the top, followed by a conversational greeting.
- Tone: Engaging and narrative-driven. Make it feel like an exclusive update.
- Focus: Tease the article''s most interesting pain point or solution, making the reader *need* to click the link to read the full story.'),

  ('facebook', '- Format: Casual, engaging community-focused post.
- Tone: Conversational, asking questions to drive comments.
- Focus: Relate the article''s topic to everyday problems or community interests.')
ON CONFLICT (channel_name) DO NOTHING;
