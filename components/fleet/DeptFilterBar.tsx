import type { MunicipalDept } from "@/lib/types";

interface Props {
  depts: MunicipalDept[];
  activeDeptId: string | null;
  onChange: (id: string | null) => void;
}

export function DeptFilterBar({ depts, activeDeptId, onChange }: Props) {
  const allCount = depts.flatMap((d) => d.teams).length;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => onChange(null)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
          activeDeptId === null
            ? "bg-[#1f5fa6] text-white border-[#1f5fa6]"
            : "bg-white text-[#585858] border-[#d0d0d0] hover:border-[#1f5fa6] hover:text-[#1f5fa6]"
        }`}
      >
        הכל
        <span
          className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold ${
            activeDeptId === null ? "bg-white/20 text-white" : "bg-[#f0f0f0] text-[#585858]"
          }`}
        >
          {allCount}
        </span>
      </button>

      {depts.map((dept) => {
        const active = activeDeptId === dept.id;
        return (
          <button
            key={dept.id}
            onClick={() => onChange(active ? null : dept.id)}
            style={
              active
                ? { backgroundColor: dept.color, borderColor: dept.color, color: "#fff" }
                : {
                    backgroundColor: dept.colorLight,
                    borderColor: dept.borderColor,
                    color: dept.color,
                  }
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors hover:opacity-90"
          >
            {dept.shortName}
            <span
              style={
                active
                  ? { backgroundColor: "rgba(255,255,255,0.25)", color: "#fff" }
                  : { backgroundColor: dept.borderColor, color: dept.color }
              }
              className="text-[10px] rounded-full px-1.5 py-0.5 font-bold"
            >
              {dept.teams.length}
            </span>
          </button>
        );
      })}
    </div>
  );
}
