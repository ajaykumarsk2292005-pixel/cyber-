import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';
const supabase = createClient(supabaseUrl, supabaseKey);

declare global {
  var __cyberhunt_state: {
    sessions: Record<string, string>;
    passkeys: Record<string, string>;
    teams: any[];
    deleted_teams: string[];
    progress: Record<string, { session: number, question: number, timestamp: number }>;
    scores: Record<string, Record<string, { score: number, time_taken: number }>>;
    questions: Record<string, any[]>;
    passkeyHints?: Record<string, string>;
    _initialized_from_storage?: boolean;
  } | undefined;
}

if (!globalThis.__cyberhunt_state) {
  globalThis.__cyberhunt_state = {
    sessions: {
      "1": "STANDBY",
      "2": "STANDBY",
      "3": "STANDBY",
      "4": "STANDBY"
    },
    passkeys: {
      "1": "SEASON2-ACCESS",
      "2": "SEASON3-ACCESS",
      "3": "SEASON4-ACCESS"
    },
    passkeyHints: {
      "1": "All logic gates bypassed. The inner network is sealed. Awaiting Season 2 authentication passkey from Administrator.",
      "2": "Visual reconnaissance complete. Target located. Awaiting Season 3 authentication passkey.",
      "3": "Critical infrastructure reached. System lockdown initiated. Final authentication required.",
      "4": "All subsystems compromised. Awaiting final master override sequence to capture the flag."
    },
    teams: [],
    deleted_teams: [],
    progress: {},
    scores: {},
    questions: {}
  };
}

export async function GET() {
  if (globalThis.__cyberhunt_state && !globalThis.__cyberhunt_state._initialized_from_storage) {
    if (supabaseUrl !== 'https://placeholder.supabase.co') {
      try {
        const { data, error } = await supabase.storage.from('cyberhunt-media').download('state.json');
        if (data) {
          const text = await data.text();
          const parsedState = JSON.parse(text);
          if (parsedState && parsedState.sessions) {
            globalThis.__cyberhunt_state = {
              ...parsedState,
              _initialized_from_storage: true
            };
          }
        } else {
           globalThis.__cyberhunt_state!._initialized_from_storage = true;
        }
      } catch (e) {
        console.error("Storage state fetch error:", e);
        globalThis.__cyberhunt_state!._initialized_from_storage = true;
      }
    } else {
      // Local development fallback
      try {
        const localPath = path.join(process.cwd(), '.next', 'local_state.json');
        if (fs.existsSync(localPath)) {
          const text = fs.readFileSync(localPath, 'utf8');
          const parsedState = JSON.parse(text);
          if (parsedState && parsedState.sessions) {
            globalThis.__cyberhunt_state = {
              ...parsedState,
              _initialized_from_storage: true
            };
          }
        } else {
          globalThis.__cyberhunt_state!._initialized_from_storage = true;
        }
      } catch(e) {
        globalThis.__cyberhunt_state!._initialized_from_storage = true;
      }
    }
  }

  if (supabaseUrl !== 'https://placeholder.supabase.co') {
    try {
      const [sessionsResult, teamsResult, scoresResult, questionsResult] = await Promise.all([
        supabase.from('sessions').select('session_number, status, passkey'),
        supabase.from('teams').select('*'),
        supabase.from('scores').select('team_alias, session_number, score, time_taken'),
        supabase.from('questions').select('id, session_number, question_index, text, options, answer, media_url').order('question_index', { ascending: true })
      ]);

      if (!sessionsResult.error && sessionsResult.data) {
        for (const session of sessionsResult.data) {
          globalThis.__cyberhunt_state!.sessions[String(session.session_number)] = session.status;
          if (session.passkey) {
            globalThis.__cyberhunt_state!.passkeys[String(session.session_number)] = session.passkey;
          }
        }
      }

      if (!teamsResult.error && teamsResult.data) {
        globalThis.__cyberhunt_state!.teams = teamsResult.data;
      }

      if (!scoresResult.error && scoresResult.data) {
        const scores: Record<string, Record<string, { score: number, time_taken: number }>> = {
          ...globalThis.__cyberhunt_state!.scores
        };
        for (const entry of scoresResult.data) {
          if (!scores[entry.team_alias]) {
            scores[entry.team_alias] = {};
          } else {
            scores[entry.team_alias] = { ...scores[entry.team_alias] };
          }
          scores[entry.team_alias][String(entry.session_number)] = {
            score: Number(entry.score) || 0,
            time_taken: Number(entry.time_taken) || 0
          };
        }
        if (scoresResult.data.length > 0) {
          globalThis.__cyberhunt_state!.scores = scores;
        }
      }

      if (!questionsResult.error && questionsResult.data) {
        const questions: Record<string, any[]> = {};
        for (const question of questionsResult.data) {
          const session = String(question.session_number);
          if (!questions[session]) questions[session] = [];
          questions[session].push({
            id: question.id,
            text: question.text,
            options: question.options,
            answer: question.answer,
            mediaUrl: question.media_url
          });
        }
        if (questionsResult.data.length > 0) {
          globalThis.__cyberhunt_state!.questions = questions;
        }
      }
    } catch (error) {
      console.error("Persistent state fetch error:", error);
    }
  }
  
  return NextResponse.json(globalThis.__cyberhunt_state);
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (data.type === 'update_session') {
      globalThis.__cyberhunt_state!.sessions[data.session] = data.status;
    } 
    else if (data.type === 'update_questions') {
      if (!globalThis.__cyberhunt_state!.questions) globalThis.__cyberhunt_state!.questions = {};
      globalThis.__cyberhunt_state!.questions[data.session] = data.questions;
    }
    else if (data.type === 'update_passkey') {
      if (!globalThis.__cyberhunt_state!.passkeys) globalThis.__cyberhunt_state!.passkeys = {};
      globalThis.__cyberhunt_state!.passkeys[data.session] = data.passkey;
    }
    else if (data.type === 'update_passkey_hint') {
      if (!globalThis.__cyberhunt_state!.passkeyHints) globalThis.__cyberhunt_state!.passkeyHints = {};
      globalThis.__cyberhunt_state!.passkeyHints[data.session] = data.hint;
    }
    else if (data.type === 'register_team') {
      const alias = data.team.team_alias || data.team.teamAlias;
      const exists = globalThis.__cyberhunt_state!.teams.find(
        t => t.team_alias === alias || t.teamAlias === alias
      );
      if (!exists) {
        globalThis.__cyberhunt_state!.teams.push(data.team);
      }
      
      // If team was previously deleted, un-delete them upon re-registration
      if (globalThis.__cyberhunt_state!.deleted_teams) {
        globalThis.__cyberhunt_state!.deleted_teams = globalThis.__cyberhunt_state!.deleted_teams.filter(
          d => String(d).toLowerCase() !== String(alias).toLowerCase()
        );
      }
    }
    else if (data.type === 'delete_team') {
      if (!globalThis.__cyberhunt_state!.deleted_teams) globalThis.__cyberhunt_state!.deleted_teams = [];
      globalThis.__cyberhunt_state!.deleted_teams.push(data.team_alias);
      
      globalThis.__cyberhunt_state!.teams = globalThis.__cyberhunt_state!.teams.filter(
        t => t.team_alias !== data.team_alias && t.teamAlias !== data.team_alias
      );
    }
    else if (data.type === 'sync_deleted_teams') {
      globalThis.__cyberhunt_state!.deleted_teams = data.deleted_teams;
    }
    else if (data.type === 'update_team') {
      const idx = globalThis.__cyberhunt_state!.teams.findIndex(
        t => t.team_alias === data.team.team_alias || t.teamAlias === data.team.teamAlias
      );
      if (idx !== -1) {
        globalThis.__cyberhunt_state!.teams[idx] = {
          ...globalThis.__cyberhunt_state!.teams[idx],
          ...data.team
        };
      }
    }
    else if (data.type === 'ping_progress') {
      if (!globalThis.__cyberhunt_state!.progress) globalThis.__cyberhunt_state!.progress = {};
      globalThis.__cyberhunt_state!.progress[data.team_alias] = {
        session: data.session,
        question: data.question,
        timestamp: Date.now()
      };
    }
    else if (data.type === 'submit_score') {
      if (!globalThis.__cyberhunt_state!.scores) globalThis.__cyberhunt_state!.scores = {};
      if (!globalThis.__cyberhunt_state!.scores[data.team_alias]) globalThis.__cyberhunt_state!.scores[data.team_alias] = {};
      
      if (!globalThis.__cyberhunt_state!.scores[data.team_alias][data.session]) {
        globalThis.__cyberhunt_state!.scores[data.team_alias][data.session] = {
          score: data.score,
          time_taken: data.time_taken
        };
      }
    }

    if (supabaseUrl !== 'https://placeholder.supabase.co') {
      try {
        if (data.type === 'submit_score') {
          const { error } = await supabase.from('scores').upsert({
            team_alias: data.team_alias,
            session_number: Number(data.session),
            score: Number(data.score) || 0,
            time_taken: Number(data.time_taken) || 0
          }, { onConflict: 'team_alias,session_number' });
          if (error) throw error;
        }

        await supabase.storage.from('cyberhunt-media')
          .upload('state.json', JSON.stringify(globalThis.__cyberhunt_state), {
            contentType: 'application/json',
            upsert: true
          });
      } catch (err) {
        console.error("Storage state sync error:", err);
      }
    } else {
      // Local development fallback
      try {
        const localPath = path.join(process.cwd(), '.next', 'local_state.json');
        fs.writeFileSync(localPath, JSON.stringify(globalThis.__cyberhunt_state));
      } catch(e) {}
    }

    return NextResponse.json({ success: true, state: globalThis.__cyberhunt_state });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
