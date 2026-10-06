export interface Question {
  id: number;
  text: string;
  options: string[];
  answer: string;
  mediaUrl?: string;
}
import { fetchSessionQuestions, broadcastSessionQuestions } from "@/lib/stateSync";

export const getQuestions = async (sessionNumber: number): Promise<Question[]> => {
  const remote = await fetchSessionQuestions(sessionNumber);
  if (remote !== null) {
    return remote; // Returns [] if explicitly empty
  }
  
  // Fallback to local storage if API is completely dead
  const local = localStorage.getItem(`cyberhunt_questions_${sessionNumber}`);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error(e);
    }
  }

  // Final fallback to empty if nothing exists
  return [];
};

export const saveQuestions = async (sessionNumber: number, questions: Question[]) => {
  // Save to DB and API
  await broadcastSessionQuestions(sessionNumber, questions);
  
  // Also save locally as a last-resort fallback
  localStorage.setItem(`cyberhunt_questions_${sessionNumber}`, JSON.stringify(questions));
};
