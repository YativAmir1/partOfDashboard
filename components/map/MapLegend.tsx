import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/data";

export function MapLegend() {
  return (
    <div className="bg-white/95 border border-[#d0d0d0] rounded-xl p-3 backdrop-blur-sm">
      <p className="text-[10px] font-semibold text-[#585858] uppercase tracking-wider mb-2">קטגוריה</p>
      <div className="space-y-1.5">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: CATEGORY_COLORS[key] }}
            />
            <span className="text-xs text-[#707070]">{label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t border-[#e8e8e8] space-y-1.5">
        <p className="text-[10px] font-semibold text-[#585858] uppercase tracking-wider">סטטוס (שקיפות)</p>
        {[["פתוח", "100%"], ["בטיפול", "75%"], ["טופל", "45%"]].map(([s, o]) => (
          <div key={s} className="flex justify-between text-xs text-[#707070]">
            <span>{s}</span><span>{o}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
