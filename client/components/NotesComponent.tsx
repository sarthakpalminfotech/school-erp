import React, { useState, useRef } from "react";
import { Camera, Mic, Square, Trash2, Image as ImageIcon, Play, Pause } from "lucide-react";
import { Note } from "@/hooks/useAppState";
import { Button } from "@/components/ui/button";

interface NotesComponentProps {
  notes: Note[];
  onAddNote: (text: string, photo?: string, voiceNote?: string) => void;
  readOnly?: boolean;
}

export const NotesComponent: React.FC<NotesComponentProps> = ({ notes, onAddNote, readOnly = false }) => {
  const [text, setText] = useState("");
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>(null);
  const [attachedVoice, setAttachedVoice] = useState<string | null>(null);
  
  // Voice recording mock state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio player mock state per note
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [playProgress, setPlayProgress] = useState(0);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleStartRecord = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    timerRef.current = setInterval(() => {
      setRecordingSeconds(s => s + 1);
    }, 1000);
  };

  const handleStopRecord = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    // save a simulated voice note with the duration
    setAttachedVoice(`Voice Note (${Math.floor(recordingSeconds / 60)}:${(recordingSeconds % 60).toString().padStart(2, "0")}s)`);
  };

  // Simulates photo attach by using a random stock unsplash photo
  const handleAttachPhoto = () => {
    const randoms = [
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80", // Compressor/machinery like
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=300&q=80", 
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=300&q=80",
    ];
    const picked = randoms[Math.floor(Math.random() * randoms.length)];
    setAttachedPhoto(picked);
  };

  const handleSave = () => {
    if (!text.trim() && !attachedPhoto && !attachedVoice) return;
    onAddNote(text, attachedPhoto || undefined, attachedVoice || undefined);
    setText("");
    setAttachedPhoto(null);
    setAttachedVoice(null);
  };

  const handlePlayVoice = (noteId: string) => {
    if (playingVoiceId === noteId) {
      // Pause
      setPlayingVoiceId(null);
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    } else {
      // Play
      setPlayingVoiceId(noteId);
      setPlayProgress(0);
      playTimerRef.current = setInterval(() => {
        setPlayProgress(p => {
          if (p >= 100) {
            setPlayingVoiceId(null);
            if (playTimerRef.current) clearInterval(playTimerRef.current);
            return 0;
          }
          return p + 10;
        });
      }, 300);
    }
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type operational notes here..."
          className="w-full min-h-[80px] bg-transparent text-sm outline-none resize-none placeholder-slate-400"
        />

        {/* Attachments preview */}
        {(attachedPhoto || attachedVoice || isRecording) && (
          <div className="mt-2.5 flex flex-wrap gap-2.5 border-t border-slate-100 pt-2.5">
            {attachedPhoto && (
              <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white p-1">
                <img src={attachedPhoto} alt="Attached" className="h-14 w-20 object-cover rounded" />
                <button
                  onClick={() => setAttachedPhoto(null)}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}

            {attachedVoice && (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600">
                <Mic size={14} className="text-red-500 animate-pulse" />
                <span>{attachedVoice}</span>
                <button onClick={() => setAttachedVoice(null)} className="text-slate-400 hover:text-red-500">
                  <Trash2 size={12} />
                </button>
              </div>
            )}

            {isRecording && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-600 font-medium">
                <div className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                <span>Recording... {recordingSeconds}s</span>
                <button onClick={handleStopRecord} className="ml-1 bg-red-600 text-white rounded px-1.5 py-0.5 text-[10px] hover:bg-red-700">
                  Stop
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
          <div className="flex items-center gap-1.5 text-slate-500">
            <button
              onClick={handleAttachPhoto}
              title="Attach Photo"
              className="p-2 hover:bg-white rounded-lg hover:text-slate-800 transition"
            >
              <Camera size={16} />
            </button>
            {!isRecording && (
              <button
                onClick={handleStartRecord}
                title="Record Voice Memo"
                className="p-2 hover:bg-white rounded-lg hover:text-slate-800 transition"
              >
                <Mic size={16} />
              </button>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={!text.trim() && !attachedPhoto && !attachedVoice}
            className="rounded-lg bg-[#173c2d] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#204a3a] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition"
          >
            Save Note
          </button>
        </div>
      </div>
      )}

      {/* Notes List */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-4">No notes logged yet.</p>
        ) : (
          notes.map(note => (
            <div key={note.id} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">{note.user}</span>
                <span className="text-[10px] text-slate-400">{note.timestamp}</span>
              </div>
              
              {note.text && <p className="text-sm text-slate-600 whitespace-pre-wrap">{note.text}</p>}
              
              {note.photo && (
                <div className="relative mt-1 max-w-[200px] rounded-lg overflow-hidden border">
                  <img src={note.photo} alt="Note Attachment" className="w-full object-cover max-h-32" />
                </div>
              )}

              {note.voiceNote && (
                <div className="flex items-center gap-3 rounded-lg bg-slate-50 border p-2 mt-1.5 max-w-[240px]">
                  <button
                    onClick={() => handlePlayVoice(note.id)}
                    className="grid h-7 w-7 place-items-center rounded-full bg-[#173c2d] text-white hover:bg-[#204a3a]"
                  >
                    {playingVoiceId === note.id ? <Square size={10} fill="white" /> : <Play size={10} fill="white" className="translate-x-0.5" />}
                  </button>
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold text-slate-600">{note.voiceNote}</p>
                    <div className="h-1 w-full bg-slate-200 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-[#b5e36c] transition-all"
                        style={{ width: `${playingVoiceId === note.id ? playProgress : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
