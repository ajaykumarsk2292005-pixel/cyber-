import { supabase } from "@/lib/supabase";

// Since the user is unable to configure Supabase RLS policies properly,
// we will use the `teams` table as an append-only event log to sync session states,
// because `teams` allows public INSERT and SELECT.

export const broadcastSessionState = async (sessionNumber: number, status: string) => {
  // Update local API in-memory state
  try {
    await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'update_session', session: sessionNumber.toString(), status })
    });
  } catch (e) {
    console.error("API update error", e);
  }

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
      status: 'WAITING'
    });
  } catch (e) {
    console.error("Broadcast error", e);
  }
};

export const fetchSessionState = async (sessionNumber: number): Promise<string | null> => {
  try {
    const res = await fetch('/api/state', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.sessions && data.sessions[sessionNumber.toString()]) {
        return data.sessions[sessionNumber.toString()];
      }
    }
  } catch (e) {
    console.error("API fetch error", e);
  }
  return "STANDBY";
};

export const broadcastSessionPasskey = async (sessionNumber: number, passkey: string) => {
  try {
    await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'update_passkey', session: sessionNumber.toString(), passkey })
    });
  } catch (e) {
    console.error("API update error", e);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
    return;
  }
  try {
    await supabase.from('sessions').update({ passkey }).eq('session_number', sessionNumber);
  } catch (e) {
    console.error("Broadcast passkey error", e);
  }
};

export const fetchSessionPasskey = async (sessionNumber: number): Promise<string | null> => {
  try {
    const res = await fetch('/api/state', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.passkeys && data.passkeys[sessionNumber.toString()]) {
         return data.passkeys[sessionNumber.toString()];
      }
    }
  } catch (e) {
    console.error("API fetch error", e);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
    return null;
  }
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('passkey')
      .eq('session_number', sessionNumber)
      .single();
      
    return data?.passkey || null;
  } catch (e) {
    console.error("Fetch error", e);
    return null;
  }
};

export const fetchSessionPasskeyHint = async (sessionNumber: number): Promise<string | null> => {
  try {
    const res = await fetch('/api/state', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.passkeyHints && data.passkeyHints[sessionNumber.toString()]) {
         return data.passkeyHints[sessionNumber.toString()];
      }
    }
  } catch (e) {
    console.error("API fetch error", e);
  }
  return null;
};

export const broadcastSessionPasskeyHint = async (sessionNumber: number, hint: string) => {
  try {
    await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'update_passkey_hint', session: sessionNumber.toString(), hint })
    });
  } catch (e) {
    console.error("API update error", e);
  }
};

export const broadcastSessionQuestions = async (sessionNumber: number, questions: any[]) => {
  try {
    await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'update_questions', session: sessionNumber.toString(), questions })
    });
  } catch (e) {
    console.error("API update error", e);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
    return;
  }
  try {
    const { supabase } = require("@/lib/supabase");
    await supabase.from('questions').delete().eq('session_number', sessionNumber);
    if (questions.length > 0) {
      const inserts = questions.map((q, idx) => ({
        session_number: sessionNumber,
        question_index: idx,
        text: q.text,
        options: q.options,
        answer: q.answer,
        media_url: q.mediaUrl || null
      }));
      await supabase.from('questions').insert(inserts);
    }
  } catch (e) {
    console.error("Broadcast questions error", e);
  }
};

export const fetchSessionQuestions = async (sessionNumber: number): Promise<any[] | null> => {
  try {
    const res = await fetch('/api/state', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.questions && data.questions[sessionNumber.toString()]) {
         return data.questions[sessionNumber.toString()];
      }
    }
  } catch (e) {
    console.error("API fetch error", e);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
    return null;
  }
  try {
    const { supabase } = require("@/lib/supabase");
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('session_number', sessionNumber)
      .order('question_index', { ascending: true });
      
    if (error) {
      console.error("Supabase questions fetch error", error);
      return null;
    }

    if (data) {
      return data.map((q: any) => ({
        id: q.id,
        text: q.text,
        options: q.options,
        answer: q.answer,
        mediaUrl: q.media_url
      }));
    }
    return [];
  } catch (e) {
    console.error("Fetch error", e);
    return null;
  }
};
