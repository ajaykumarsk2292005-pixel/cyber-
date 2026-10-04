import { NextResponse } from 'next/server';

declare global {
  var __cyberhunt_state: {
    sessions: Record<string, string>;
    teams: any[];
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
    teams: []
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
    else if (data.type === 'register_team') {
      const exists = globalThis.__cyberhunt_state!.teams.find(
        t => t.team_alias === data.team.team_alias || t.teamAlias === data.team.teamAlias
      );
      if (!exists) {
        globalThis.__cyberhunt_state!.teams.push(data.team);
      }
    }
    else if (data.type === 'delete_team') {
      globalThis.__cyberhunt_state!.teams = globalThis.__cyberhunt_state!.teams.filter(
        t => t.team_alias !== data.team_alias && t.teamAlias !== data.team_alias
      );
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

    return NextResponse.json({ success: true, state: globalThis.__cyberhunt_state });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
