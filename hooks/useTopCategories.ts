import { complaints } from "@/lib/data";
import type { District, TopCategory } from "@/lib/types";

interface TopCategoriesResult {
  categories: TopCategory[];
}

export function useTopCategories(
  selectedDistrict?: District,
  filters?: { status?: string },
): TopCategoriesResult {
  let filtered = selectedDistrict
    ? complaints.filter((c) => c.district === selectedDistrict)
    : complaints;

  if (filters?.status) {
    filtered = filtered.filter((c) => c.status === filters.status);
  }

  const counts: Record<string, number> = {};
  filtered.forEach((c) => {
    counts[c.category] = (counts[c.category] ?? 0) + 1;
  });

  const total = filtered.length;
  const categories: TopCategory[] = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

  return { categories };
}
