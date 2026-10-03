-- Supabase SQL Schema for CyberHunt

-- Create Teams table
CREATE TABLE public.teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_alias TEXT UNIQUE NOT NULL,
    node_alpha TEXT NOT NULL,
    node_beta TEXT NOT NULL,
    college TEXT NOT NULL,
    status TEXT DEFAULT 'WAITING' NOT NULL, -- WAITING, ACTIVE, DISQUALIFIED, COMPLETED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Sessions (for admin to control states)
CREATE TABLE public.sessions (
    id SERIAL PRIMARY KEY,
    session_number INT UNIQUE NOT NULL,
    status TEXT DEFAULT 'STANDBY' NOT NULL, -- STANDBY, ACTIVE, PAUSED, ENDED
    passkey TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert initial sessions
INSERT INTO public.sessions (session_number, status, passkey) VALUES
(1, 'STANDBY', 'SEASON1-ACCESS'),
(2, 'STANDBY', 'SEASON2-ACCESS'),
(3, 'STANDBY', 'SEASON3-ACCESS'),
(4, 'STANDBY', 'SEASON4-ACCESS'),
(5, 'STANDBY', 'SEASON5-ACCESS');

-- Create Answers table for teams to submit
CREATE TABLE public.answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    session_number INT NOT NULL,
    question_index INT NOT NULL,
    answer TEXT NOT NULL,
    is_correct BOOLEAN,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Allow public inserts to teams (Registration)
CREATE POLICY "Allow public registration" ON public.teams FOR INSERT TO public WITH CHECK (true);

-- Allow teams to read their own data based on alias (or id)
CREATE POLICY "Allow team read" ON public.teams FOR SELECT TO public USING (true); -- In a real app, use auth, but here we can just query by alias

-- Allow everyone to read sessions (so they know if it's active)
CREATE POLICY "Allow public read sessions" ON public.sessions FOR SELECT TO public USING (true);

-- Admin policies (requires auth)
-- (You would create specific policies for authenticated admins here)
CREATE POLICY "Admin full access teams" ON public.teams FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access sessions" ON public.sessions FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access answers" ON public.answers FOR ALL TO authenticated USING (true);
