CREATE TABLE IF NOT EXISTS public.scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_alias TEXT NOT NULL REFERENCES public.teams(team_alias) ON DELETE CASCADE,
    session_number INT NOT NULL,
    score INT NOT NULL DEFAULT 0,
    time_taken INT NOT NULL DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (team_alias, session_number)
);

ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read scores" ON public.scores;
DROP POLICY IF EXISTS "Allow public score submissions" ON public.scores;
DROP POLICY IF EXISTS "Allow public score updates" ON public.scores;

CREATE POLICY "Allow public read scores" ON public.scores FOR SELECT TO public USING (true);
CREATE POLICY "Allow public score submissions" ON public.scores FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public score updates" ON public.scores FOR UPDATE TO public USING (true) WITH CHECK (true);
