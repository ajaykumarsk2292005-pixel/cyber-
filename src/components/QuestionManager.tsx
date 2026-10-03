"use client";

import { useState, useEffect } from "react";
import { getQuestions, saveQuestions, Question } from "@/lib/questions";
import { FileText, Save, Plus, Trash2, Edit2 } from "lucide-react";

export function QuestionManager({ sessionNumber }: { sessionNumber: number }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Question | null>(null);

  useEffect(() => {
    setQuestions(getQuestions(sessionNumber));
  }, [sessionNumber]);

  const handleSave = (index: number) => {
    if (!editingData) return;
    const newQs = [...questions];
    newQs[index] = editingData;
    setQuestions(newQs);
    saveQuestions(sessionNumber, newQs);
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this question?")) return;
    const newQs = questions.filter(q => q.id !== id);
    setQuestions(newQs);
    saveQuestions(sessionNumber, newQs);
  };

  const handleAdd = () => {
    const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    const newQ: Question = {
      id: newId,
      text: "New Question",
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
      answer: "Option 1",
      mediaUrl: ""
    };
    const newQs = [...questions, newQ];
    setQuestions(newQs);
    saveQuestions(sessionNumber, newQs);
    setEditingId(newId);
    setEditingData(newQ);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-black/50 p-4 border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-100">Session {sessionNumber} Questions</h2>
          <p className="text-xs text-zinc-500 font-mono">Manage challenge set for phase {sessionNumber}</p>
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 bg-zinc-100 text-black px-4 py-2 text-xs font-bold uppercase hover:bg-zinc-300">
          <Plus className="w-4 h-4" /> Add Question
        </button>
      </div>

      <div className="space-y-4">
        {questions.length === 0 && <p className="text-zinc-500 font-mono text-sm">No questions available.</p>}
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-zinc-900/50 border border-zinc-800 p-4 font-mono text-sm flex flex-col gap-4">
            {editingId === q.id ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-widest">Question Text</label>
                  <input type="text" className="w-full bg-black border border-zinc-700 px-3 py-2 text-white" value={editingData?.text} onChange={e => setEditingData({...editingData!, text: e.target.value})} />
                </div>
                
                {sessionNumber !== 1 && (
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-widest">Media URL (Image/Video)</label>
                    <input type="text" className="w-full bg-black border border-zinc-700 px-3 py-2 text-white" value={editingData?.mediaUrl || ""} onChange={e => setEditingData({...editingData!, mediaUrl: e.target.value})} />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {editingData?.options.map((opt, oIdx) => (
                    <div key={oIdx} className="space-y-2">
                      <label className="text-xs text-zinc-500 uppercase tracking-widest">Option {oIdx + 1}</label>
                      <input 
                        type="text" 
                        className="w-full bg-black border border-zinc-700 px-3 py-2 text-white" 
                        value={opt} 
                        onChange={e => {
                          const newOpts = [...editingData.options];
                          newOpts[oIdx] = e.target.value;
                          setEditingData({...editingData, options: newOpts});
                        }} 
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-widest">Correct Answer</label>
                  <select className="w-full bg-black border border-zinc-700 px-3 py-2 text-white" value={editingData?.answer} onChange={e => setEditingData({...editingData!, answer: e.target.value})}>
                    {editingData?.options.map((opt, oIdx) => (
                      <option key={oIdx} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4 justify-end mt-4">
                  <button onClick={() => setEditingId(null)} className="text-zinc-500 hover:text-white uppercase text-xs font-bold tracking-widest">Cancel</button>
                  <button onClick={() => handleSave(idx)} className="text-green-500 hover:text-green-400 uppercase text-xs font-bold tracking-widest flex items-center gap-2"><Save className="w-4 h-4"/> Save</button>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-zinc-200 text-lg mb-2"><span className="text-zinc-500">Q{idx + 1}.</span> {q.text}</p>
                    {q.mediaUrl && <p className="text-xs text-blue-400 truncate max-w-lg mb-4">{q.mediaUrl}</p>}
                    
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className={`px-3 py-2 border ${opt === q.answer ? 'border-green-500/50 bg-green-950/20 text-green-400' : 'border-zinc-800 bg-black text-zinc-500'}`}>
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button onClick={() => { setEditingId(q.id); setEditingData(q); }} className="text-blue-500 hover:text-blue-400 p-2 border border-zinc-800 bg-black"><Edit2 className="w-4 h-4"/></button>
                    <button onClick={() => handleDelete(q.id)} className="text-red-500 hover:text-red-400 p-2 border border-zinc-800 bg-black"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
