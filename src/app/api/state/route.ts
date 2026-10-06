import { NextResponse } from 'next/server';

declare global {
  var __cyberhunt_state: {
    sessions: Record<string, string>;
    passkeys: Record<string, string>;
    teams: any[];
    deleted_teams: string[];
    progress: Record<string, { session: number, question: number, timestamp: number }>;
    scores: Record<string, Record<string, { score: number, time_taken: number }>>;
    questions: Record<string, any[]>;
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
    teams: [],
    deleted_teams: [],
    progress: {},
    scores: {},
    questions: {}
  };
}

export async function GET() {
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
    else if (data.type === 'register_team') {
      const exists = globalThis.__cyberhunt_state!.teams.find(
        t => t.team_alias === data.team.team_alias || t.teamAlias === data.team.teamAlias
      );
      if (!exists) {
        globalThis.__cyberhunt_state!.teams.push(data.team);
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

    return NextResponse.json({ success: true, state: globalThis.__cyberhunt_state });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
