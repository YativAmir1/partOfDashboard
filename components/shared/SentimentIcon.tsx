export function SentimentIcon({ sentiment }: { sentiment: string }) {
  if (sentiment === "positive") return <span title="חיובי" className="text-[#459524] text-base">●</span>;
  if (sentiment === "negative") return <span title="שלילי" className="text-[#d96350] text-base">●</span>;
  return <span title="ניטרלי" className="text-[#707070] text-base">●</span>;
}
