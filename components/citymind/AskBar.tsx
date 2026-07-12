"use client";

// ─── CityMind AI — natural-language Q&A bar ("שאל את CityMind") ────────────────
// Turns the cockpit into something you can talk to: the manager asks a free-text
// question and gets an answer grounded STRICTLY in the live city snapshot (RAG over
// the structured data) via the secure /api/ai/ask streaming route.
import { useEffect, useRef, useState } from "react";
import { Search, SendHorizontal, X } from "lucide-react";
import type { LLMEntry } from "@/context/CityMindContext";
import { useCityMind } from "@/context/CityMindContext";
import { streamLLM } from "@/lib/ai/sseClient";
import { GeneratedTextCard } from "./GeneratedTextCard";

const SUGGESTIONS = [
  "מה הכי דחוף עכשיו?",
  "למה הפארק הלאומי מסומן?",
  "באילו אזורים תחושת השירות הכי נמוכה?",
  "מה כדאי לאשר קודם ולמה?",
];

export function AskBar() {
  const { activeActions } = useCityMind();
  const [question, setQuestion] = useState("");
  const [entry, setEntry] = useState<LLMEntry | undefined>();
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const busy = entry?.status === "loading" || entry?.status === "streaming";

  const ask = (q: string) => {
    const query = q.trim();
    if (!query || busy) return;
    setQuestion(query);
    setOpen(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    void streamLLM("/api/ai/ask", { question: query, actions: activeActions }, setEntry, controller.signal);
  };

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative mx-3 hidden min-w-0 flex-1 md:block lg:max-w-lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
        className="flex items-center gap-2 rounded-xl border border-[#1e293b] bg-[#0b1220] px-3 py-1.5 focus-within:border-[#0ea5b7]/60"
      >
        <Search size={14} className="shrink-0 text-slate-500" />
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="שאל את CityMind — מה דחוף עכשיו?"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!question.trim() || busy}
          className="shrink-0 rounded-md p-1 text-[#0ea5b7] transition-colors hover:bg-[#0ea5b7]/15 disabled:opacity-40"
          aria-label="שלח שאלה"
        >
          <SendHorizontal size={15} className="-scale-x-100" />
        </button>
      </form>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 rounded-2xl border border-[#1e293b] bg-[#0f1729] p-3 shadow-2xl shadow-black/40">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">שאל את CityMind</span>
            <button
              onClick={() => setOpen(false)}
              className="rounded p-0.5 text-slate-500 hover:text-slate-200"
              aria-label="סגור"
            >
              <X size={13} />
            </button>
          </div>

          {!entry && (
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-[#1e293b] bg-[#0b1220] px-2.5 py-1 text-[11px] text-slate-300 transition-colors hover:border-[#0ea5b7]/50 hover:text-[#0ea5b7]"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {entry && <GeneratedTextCard entry={entry} />}
        </div>
      )}
    </div>
  );
}
