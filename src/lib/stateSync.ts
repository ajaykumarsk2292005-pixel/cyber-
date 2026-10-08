import { supabase } from "@/lib/supabase";

const getCurrentTeamAlias = () => {
  try {
    const team = JSON.parse(localStorage.getItem("cyberhunt_team") || "{}");
    return team.teamAlias || team.team_alias || "";
  } catch {
    return "";
  }
};

export const broadcastSessionState = async (sessionNumber: number, status: string) => {
  // Update local API in-memory state
  try {
    const response = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'update_session', session: sessionNumber.toString(), status })
    });
    if (!response.ok) throw new Error('Session state could not be persisted');
  } catch (e) {
    console.error("API update error", e);
    throw e;
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
  return null;
};

export const broadcastSessionPasskey = async (sessionNumber: number, passkey: string) => {
  try {
    const response = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'update_passkey', session: sessionNumber.toString(), passkey })
    });
    if (!response.ok) throw new Error('Passkey could not be persisted');
  } catch (e) {
    console.error("API update error", e);
    throw e;
  }

};

export const verifySessionPasskey = async (sessionNumber: number, passkey: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'verify_passkey',
        session: sessionNumber.toString(),
        passkey,
        team_alias: getCurrentTeamAlias(),
      })
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result.correct === true;
  } catch (e) {
    console.error("Passkey verification error", e);
    return false;
  }
};

export const verifyQuestionAnswer = async (sessionNumber: number, questionIndex: number, answer: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'verify_question_answer',
        session: sessionNumber.toString(),
        question_index: questionIndex,
        answer,
        team_alias: getCurrentTeamAlias(),
      })
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result.correct === true;
  } catch (e) {
    console.error("Question answer verification error", e);
    return false;
  }
};

export const submitSessionScore = async (teamAlias: string, sessionNumber: number) => {
  const response = await fetch('/api/state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'submit_score',
      team_alias: teamAlias,
      session: sessionNumber,
    })
  });

  if (!response.ok) throw new Error('Score could not be saved');
};

export const fetchSessionPasskey = async (sessionNumber: number): Promise<string | null> => {
  try {
    const res = await fetch('/api/state', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.passkeys && data.passkeys[sessionNumber.toString()]) {
         return data.passkeys[sessionNumber.toString()];
      }
      if (sessionNumber === 4) return null;
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
    const response = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'update_passkey_hint', session: sessionNumber.toString(), hint })
    });
    if (!response.ok) throw new Error('Passkey hint could not be persisted');
  } catch (e) {
    console.error("API update error", e);
    throw e;
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
        mediaUrl: q.media_url
      }));
    }
    return [];
  } catch (e) {
    console.error("Fetch error", e);
    return null;
  }
};
