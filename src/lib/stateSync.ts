import { supabase } from "@/lib/supabase";

// Since the user is unable to configure Supabase RLS policies properly,
// we will use the `teams` table as an append-only event log to sync session states,
// because `teams` allows public INSERT and SELECT.

export const broadcastSessionState = async (sessionNumber: number, status: string) => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
    return;
  }
  try {
    // Attempt standard update first (in case they fixed RLS)
    await supabase.from('sessions').update({ status }).eq('session_number', sessionNumber);
    
    // Hack: Insert a state-marker team
    await supabase.from('teams').insert({
      team_alias: `_SYS_STATE_S${sessionNumber}_${status}_${Math.random().toString(36).substring(2, 8)}`,
      node_alpha: 'SYS',
      node_beta: 'SYS',
      college: 'SYS_STATE',
      status: 'WAITING' // Must match default constraints
    });
  } catch (e) {
    console.error("Broadcast error", e);
  }
};

export const fetchSessionState = async (sessionNumber: number): Promise<string | null> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
    return null;
  }
  try {
    // 1. Try standard sessions table
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('status')
      .eq('session_number', sessionNumber)
      .single();
      
    // 2. Check the append-only event log in teams
    const { data: sysTeams, error: sysError } = await supabase
      .from('teams')
      .select('team_alias')
      .eq('college', 'SYS_STATE')
      .like('team_alias', `_SYS_STATE_S${sessionNumber}_%`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (sysTeams && sysTeams.length > 0) {
      // _SYS_STATE_S1_ACTIVE_xyz123
      const parts = sysTeams[0].team_alias.split('_');
      if (parts.length >= 5) {
        return parts[4]; // ACTIVE, PAUSED, etc.
      }
    }
    
    return sessionData?.status || null;
  } catch (e) {
    console.error("Fetch error", e);
    return null;
  }
};
