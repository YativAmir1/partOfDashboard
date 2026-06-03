"use client";

import type { TopCategory } from "@/lib/types";
import { issueCategoryLabel } from "@/lib/hebrew";

const BAR_COLORS = [
  "#1f5fa6", "#f37d00", "#ffbb00", "#459524", "#009dc3", "#cf4761",
];

interface Props {
  categories: TopCategory[];
  selectedCategory: string | null;
  onCategoryClick: (category: string | null) => void;
  title?: string;
}

export function TopCategoriesWidget({
  categories,
  selectedCategory,
  onCategoryClick,
  title = "קטגוריות פנייה מובילות",
}: Props) {
  const maxCount = categories[0]?.count ?? 1;

  return (
    <div className="bg-white border border-[#d0d0d0] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-[#585858] uppercase tracking-wider">
          {title}
        </p>
        {selectedCategory && (
          <button
            onClick={() => onCategoryClick(null)}
            className="text-[10px] text-[#1f5fa6] hover:underline"
          >
            נקה סינון
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {categories.map((cat, i) => {
          const isActive = !selectedCategory || selectedCategory === cat.name;
          const label    = issueCategoryLabel(cat.name);
          const barW     = Math.round((cat.count / maxCount) * 100);
          const color    = BAR_COLORS[i % BAR_COLORS.length];

          return (
            <button
              key={cat.name}
              className="w-full text-right group"
              onClick={() =>
                onCategoryClick(cat.name === selectedCategory ? null : cat.name)
              }
            >
              <div
                className="flex items-center justify-between mb-0.5 transition-opacity"
                style={{ opacity: isActive ? 1 : 0.35 }}
              >
                <span className="text-xs text-[#1a1a1a] font-medium group-hover:text-[#1f5fa6] transition-colors">
                  {label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#707070]">{cat.percentage}%</span>
                  <span className="text-xs font-bold" style={{ color }}>
                    {cat.count}
                  </span>
                </div>
              </div>
              <div
                className="h-1.5 bg-[#e8e8e8] rounded-full overflow-hidden"
                style={{ opacity: isActive ? 1 : 0.25 }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${barW}%`, background: color }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
