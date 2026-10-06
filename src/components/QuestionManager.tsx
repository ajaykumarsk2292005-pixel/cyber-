"use client";

import { useState, useEffect } from "react";
import { getQuestions, saveQuestions, Question } from "@/lib/questions";
import { fetchSessionPasskey, broadcastSessionPasskey } from "@/lib/stateSync";
import { FileText, Save, Plus, Trash2, Edit2, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function QuestionManager({ sessionNumber }: { sessionNumber: number }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Question | null>(null);

  const [passkey, setPasskey] = useState("");
  const [isEditingPasskey, setIsEditingPasskey] = useState(false);
  const [tempPasskey, setTempPasskey] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingData) return;
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('cyberhunt-media')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('cyberhunt-media')
        .getPublicUrl(fileName);

      setEditingData({...editingData, mediaUrl: publicUrl});
    } catch (error: any) {
      alert("Error uploading media: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    const fetchQ = async () => {
      const q = await getQuestions(sessionNumber);
      setQuestions(q);
    };
    fetchQ();
    const loadPasskey = async () => {
      const savedPasskey = await fetchSessionPasskey(sessionNumber);
      if (savedPasskey) {
        setPasskey(savedPasskey);
      } else {
        const local = localStorage.getItem(`passkey_${sessionNumber}`);
        if (local) {
          setPasskey(local);
        } else {
          // Defaults
          if (sessionNumber === 1) setPasskey("SEASON2-ACCESS");
          if (sessionNumber === 2) setPasskey("SEASON3-ACCESS");
          if (sessionNumber === 3) setPasskey("SEASON4-ACCESS");
        }
      }
    };
    loadPasskey();
  }, [sessionNumber]);

  const [passkeySuccess, setPasskeySuccess] = useState(false);

  const handleSavePasskey = async () => {
    setPasskey(tempPasskey);
    await broadcastSessionPasskey(sessionNumber, tempPasskey);
    localStorage.setItem(`passkey_${sessionNumber}`, tempPasskey);
    setIsEditingPasskey(false);
    setPasskeySuccess(true);
    setTimeout(() => setPasskeySuccess(false), 2000);
  };

  const handleSave = async (index: number) => {
    if (!editingData) return;
    const newQs = [...questions];
    newQs[index] = editingData;
    setQuestions(newQs);
    await saveQuestions(sessionNumber, newQs);
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this question?")) return;
    const newQs = questions.filter(q => q.id !== id);
    setQuestions(newQs);
    await saveQuestions(sessionNumber, newQs);
  };

  const handleAdd = async () => {
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
    await saveQuestions(sessionNumber, newQs);
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
                    <div className="flex gap-2">
                      <input type="text" className="flex-1 bg-black border border-zinc-700 px-3 py-2 text-white" value={editingData?.mediaUrl || ""} onChange={e => setEditingData({...editingData!, mediaUrl: e.target.value})} placeholder="https://..." />
                      <label className="cursor-pointer bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors">
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Upload
                        <input type="file" accept="image/*,video/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                      </label>
                    </div>
                  </div>
                )}

                {sessionNumber === 1 ? (
                  <>
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

                    <div className="space-y-2 mt-4">
                      <label className="text-xs text-zinc-500 uppercase tracking-widest">Correct Answer</label>
                      <select className="w-full bg-black border border-zinc-700 px-3 py-2 text-white" value={editingData?.answer} onChange={e => setEditingData({...editingData!, answer: e.target.value})}>
                        {editingData?.options.map((opt, oIdx) => (
                          <option key={oIdx} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2 mt-4">
                    <label className="text-xs text-zinc-500 uppercase tracking-widest">Passkey (Correct Answer)</label>
                    <input 
                      type="text" 
                      className="w-full bg-black border border-zinc-700 px-3 py-2 text-white font-mono uppercase tracking-widest" 
                      value={editingData?.answer} 
                      onChange={e => setEditingData({...editingData!, answer: e.target.value})}
                      placeholder="ENTER PASSKEY"
                    />
                  </div>
                )}

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
                    
                    {sessionNumber === 1 ? (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className={`px-3 py-2 border ${opt === q.answer ? 'border-green-500/50 bg-green-950/20 text-green-400' : 'border-zinc-800 bg-black text-zinc-500'}`}>
                            {opt}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 px-3 py-2 border border-green-500/50 bg-green-950/20 text-green-400 font-mono text-sm inline-block">
                        Passkey: <span className="font-bold">{q.answer}</span>
                      </div>
                    )}
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
      <div className="mt-8 pt-6 border-t border-zinc-800 bg-black/50 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-100 mb-1">
              Unlock Passkey (Hint)
            </h3>
            <p className="text-xs text-zinc-500 font-mono">
              The secret passkey required to unlock the next session.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            {passkeySuccess && (
              <span className="text-green-500 text-xs mr-4 animate-pulse">Saved successfully!</span>
            )}
            {isEditingPasskey ? (
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={tempPasskey} 
                  onChange={(e) => setTempPasskey(e.target.value)}
                  className="bg-black border border-green-500/50 text-green-400 font-mono text-sm px-3 py-2 outline-none tracking-widest uppercase"
                />
                <button onClick={handleSavePasskey} className="bg-green-950/50 border border-green-500/30 text-green-500 hover:text-green-400 transition-colors p-2"><Save className="w-4 h-4"/></button>
                <button onClick={() => setIsEditingPasskey(false)} className="bg-zinc-900 border border-zinc-700 text-zinc-500 hover:text-white transition-colors p-2"><Trash2 className="w-4 h-4"/></button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 border border-zinc-800 bg-black">
                  <span className="text-sm font-bold font-mono tracking-widest text-green-400">{passkey}</span>
                </div>
                <button 
                  onClick={() => { setIsEditingPasskey(true); setTempPasskey(passkey); }} 
                  className="bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white transition-colors p-2"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
