import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { getAdminSessionToken, secureStringEqual, verifyAdminSession } from '@/lib/adminAuth';

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
    answerResults?: Record<string, Record<string, Record<string, boolean>>>;
    verifiedPasskeys?: Record<string, Record<string, boolean>>;
    sessionStartedAt?: Record<string, Record<string, number>>;
    _initialized_from_storage?: boolean;
    _scores_hydrated?: boolean;
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
      "3": "SEASON4-ACCESS",
      "4": "OVERRIDE-INIT"
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
    questions: {},
    answerResults: {},
    verifiedPasskeys: {},
    sessionStartedAt: {}
  };
}

async function initializeState() {
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
              passkeys: { ...globalThis.__cyberhunt_state!.passkeys, ...(parsedState.passkeys || {}) },
              passkeyHints: { ...globalThis.__cyberhunt_state!.passkeyHints, ...(parsedState.passkeyHints || {}) },
              answerResults: parsedState.answerResults || {},
              verifiedPasskeys: parsedState.verifiedPasskeys || {},
              sessionStartedAt: parsedState.sessionStartedAt || {},
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
              passkeys: { ...globalThis.__cyberhunt_state!.passkeys, ...(parsedState.passkeys || {}) },
              passkeyHints: { ...globalThis.__cyberhunt_state!.passkeyHints, ...(parsedState.passkeyHints || {}) },
              answerResults: parsedState.answerResults || {},
              verifiedPasskeys: parsedState.verifiedPasskeys || {},
              sessionStartedAt: parsedState.sessionStartedAt || {},
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
}

async function persistState() {
  if (supabaseUrl !== 'https://placeholder.supabase.co') {
    try {
      const { error } = await supabase.storage.from('cyberhunt-media')
        .upload('state.json', JSON.stringify(globalThis.__cyberhunt_state), {
          contentType: 'application/json',
          upsert: true
        });
      if (error) {
        console.error("Supabase state persist error:", error);
      }
    } catch (e) {
      console.error("Supabase exception:", e);
    }
    return;
  }

  try {
    const localPath = path.join(process.cwd(), '.next', 'local_state.json');
    fs.writeFileSync(localPath, JSON.stringify(globalThis.__cyberhunt_state));
  } catch (e) {
    console.error("Local state persist error:", e);
  }
}

const getPublicState = () => {
  const state = globalThis.__cyberhunt_state!;
  const participantPasskeys = Object.fromEntries(
    Object.entries(state.passkeys).filter(([session]) => ['1', '2', '3'].includes(session))
  );
  const publicQuestions = Object.fromEntries(
    Object.entries(state.questions || {}).map(([session, questions]) => [
      session,
      questions.map(({ answer, ...question }) => question),
    ])
  );
  const publicState = { ...state, passkeys: participantPasskeys, questions: publicQuestions };
  delete publicState.answerResults;
  delete publicState.verifiedPasskeys;
  delete publicState.sessionStartedAt;
  return publicState;
};

const sessionDurations: Record<string, number> = { '1': 600, '2': 1200, '3': 1500, '4': 1500 };

const isSessionOpenForTeam = (teamAlias: string, session: string) => {
  if (globalThis.__cyberhunt_state!.sessions[session] !== 'ACTIVE') return false;
  const startedAt = globalThis.__cyberhunt_state!.sessionStartedAt?.[teamAlias]?.[session];
  return !startedAt || Date.now() - startedAt < sessionDurations[session] * 1000;
};

async function hydrateDatabaseScores() {
  if (supabaseUrl === 'https://placeholder.supabase.co') return;
  if (globalThis.__cyberhunt_state?._scores_hydrated) return;

  try {
    const { data, error } = await supabase
      .from('scores')
      .select('team_alias, session_number, score, time_taken');
    
    globalThis.__cyberhunt_state!._scores_hydrated = true;
    
    if (error || !data) return;

    if (!globalThis.__cyberhunt_state!.scores) globalThis.__cyberhunt_state!.scores = {};
    for (const entry of data) {
      const teamAlias = String(entry.team_alias);
      if (!globalThis.__cyberhunt_state!.scores[teamAlias]) globalThis.__cyberhunt_state!.scores[teamAlias] = {};
      globalThis.__cyberhunt_state!.scores[teamAlias][String(entry.session_number)] = {
        score: Number(entry.score) || 0,
        time_taken: Number(entry.time_taken) || 0,
      };
    }
  } catch (e) {
    globalThis.__cyberhunt_state!._scores_hydrated = true;
    console.error("Hydrate error", e);
  }
}

export async function GET(request: Request) {
  await initializeState();
  await hydrateDatabaseScores();

  if (verifyAdminSession(getAdminSessionToken(request.headers.get('cookie')))) {
    return NextResponse.json(globalThis.__cyberhunt_state);
  }

  return NextResponse.json(getPublicState());
}

export async function POST(req: Request) {
  try {
    await initializeState();
    const data = await req.json();

    const adminOnlyTypes = new Set([
      'update_session',
      'update_questions',
      'update_passkey',
      'update_passkey_hint',
      'delete_team',
      'sync_deleted_teams',
      'update_team',
    ]);
    if (adminOnlyTypes.has(data.type) && !verifyAdminSession(getAdminSessionToken(req.headers.get('cookie')))) {
      return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
    }

    if (data.type === 'verify_passkey') {
      const session = String(data.session);
      if (!['1', '2', '3', '4'].includes(session)) {
        return NextResponse.json({ error: "Invalid session" }, { status: 400 });
      }
      const teamAlias = String(data.team_alias ?? '').trim();
      if (!teamAlias) return NextResponse.json({ error: "Team is required" }, { status: 400 });
      const expectedPasskey = globalThis.__cyberhunt_state!.passkeys[session] || '';
      const submittedPasskey = String(data.passkey ?? '').trim().toUpperCase();
      const correct = isSessionOpenForTeam(teamAlias, session) &&
        secureStringEqual(submittedPasskey, expectedPasskey.trim().toUpperCase());
      if (correct) {
        if (!globalThis.__cyberhunt_state!.verifiedPasskeys) globalThis.__cyberhunt_state!.verifiedPasskeys = {};
        if (!globalThis.__cyberhunt_state!.verifiedPasskeys![teamAlias]) globalThis.__cyberhunt_state!.verifiedPasskeys![teamAlias] = {};
        globalThis.__cyberhunt_state!.verifiedPasskeys![teamAlias][session] = true;
        await persistState();
      }
      return NextResponse.json({ correct });
    }

    if (data.type === 'verify_question_answer') {
      const session = String(data.session);
      const questionIndex = Number(data.question_index);
      if (!['1', '2', '3'].includes(session) || !Number.isInteger(questionIndex) || questionIndex < 0) {
        return NextResponse.json({ error: "Invalid question" }, { status: 400 });
      }

      const question = globalThis.__cyberhunt_state!.questions[session]?.[questionIndex];
      if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

      const teamAlias = String(data.team_alias ?? '').trim();
      if (!teamAlias) return NextResponse.json({ error: "Team is required" }, { status: 400 });
      const submittedAnswer = String(data.answer ?? '').trim().toUpperCase();
      const correct = isSessionOpenForTeam(teamAlias, session) &&
        secureStringEqual(submittedAnswer, String(question.answer ?? '').trim().toUpperCase());
      if (correct) {
        if (!globalThis.__cyberhunt_state!.answerResults) globalThis.__cyberhunt_state!.answerResults = {};
        if (!globalThis.__cyberhunt_state!.answerResults![teamAlias]) globalThis.__cyberhunt_state!.answerResults![teamAlias] = {};
        if (!globalThis.__cyberhunt_state!.answerResults![teamAlias][session]) globalThis.__cyberhunt_state!.answerResults![teamAlias][session] = {};
        globalThis.__cyberhunt_state!.answerResults![teamAlias][session][String(questionIndex)] = true;
        await persistState();
      }
      return NextResponse.json({
        correct,
      });
    }
    
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
      const session = String(data.session);
      if (globalThis.__cyberhunt_state!.sessions[session] === 'ACTIVE') {
        if (!globalThis.__cyberhunt_state!.sessionStartedAt) globalThis.__cyberhunt_state!.sessionStartedAt = {};
        if (!globalThis.__cyberhunt_state!.sessionStartedAt![data.team_alias]) globalThis.__cyberhunt_state!.sessionStartedAt![data.team_alias] = {};
        if (!globalThis.__cyberhunt_state!.sessionStartedAt![data.team_alias][session]) {
          globalThis.__cyberhunt_state!.sessionStartedAt![data.team_alias][session] = Date.now();
        }
      }
      globalThis.__cyberhunt_state!.progress[data.team_alias] = {
        session: data.session,
        question: data.question,
        timestamp: Date.now()
      };
    }
    else if (data.type === 'submit_score') {
      const teamAlias = String(data.team_alias ?? '').trim();
      const session = String(data.session);
      if (!teamAlias || !['1', '2', '3', '4'].includes(session)) {
        return NextResponse.json({ error: "Invalid score submission" }, { status: 400 });
      }
      if (!globalThis.__cyberhunt_state!.verifiedPasskeys?.[teamAlias]?.[session]) {
        return NextResponse.json({ error: "Session passkey has not been verified" }, { status: 403 });
      }
      if (!isSessionOpenForTeam(teamAlias, session)) {
        return NextResponse.json({ error: "Session time has expired" }, { status: 403 });
      }
      if (!globalThis.__cyberhunt_state!.scores) globalThis.__cyberhunt_state!.scores = {};
      if (!globalThis.__cyberhunt_state!.scores[teamAlias]) globalThis.__cyberhunt_state!.scores[teamAlias] = {};
      
      if (!globalThis.__cyberhunt_state!.scores[teamAlias][session]) {
        const questionCount = globalThis.__cyberhunt_state!.questions[session]?.length || 0;
        const correctCount = Object.values(globalThis.__cyberhunt_state!.answerResults?.[teamAlias]?.[session] || {}).filter(Boolean).length;
        const score = session === '1' ? 5 + correctCount
          : session === '2' ? 5 + correctCount * 5
          : session === '3' ? 5 + correctCount * 10
          : 10;
        const duration = sessionDurations[session];
        const startedAt = globalThis.__cyberhunt_state!.sessionStartedAt?.[teamAlias]?.[session];
        const timeTaken = Math.min(duration, Math.max(0, startedAt ? Math.floor((Date.now() - startedAt) / 1000) : duration));
        globalThis.__cyberhunt_state!.scores[teamAlias][session] = { score: Math.min(score, session === '1' ? 5 + questionCount : session === '2' ? 5 + questionCount * 5 : session === '3' ? 5 + questionCount * 10 : 10), time_taken: timeTaken };
      }
    }

    if (supabaseUrl !== 'https://placeholder.supabase.co') {
      try {
        if (data.type === 'submit_score') {
          const teamAlias = String(data.team_alias);
          const session = String(data.session);
          const score = globalThis.__cyberhunt_state!.scores[teamAlias][session];
          const { error } = await supabase.from('scores').upsert({
            team_alias: teamAlias,
            session_number: Number(session),
            score: score.score,
            time_taken: score.time_taken
          }, { onConflict: 'team_alias,session_number' });
          if (error) throw error;
        }
      } catch (error) {
        console.error("Score table persistence error:", error);
        // Fallback to memory, don't return 500
      }
    }

    try {
      await persistState();
    } catch (err) {
      console.error("Storage state sync error:", err);
    }

    const responseState = verifyAdminSession(getAdminSessionToken(req.headers.get('cookie')))
      ? globalThis.__cyberhunt_state
      : getPublicState();
    return NextResponse.json({ success: true, state: responseState });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
