"use client";

import { useEffect, useRef, useState } from "react";

export function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    const start = prevRef.current;
    const diff = target - start;
    if (diff === 0) return;

    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const frac = Math.min(elapsed / duration, 1);
      setValue(Math.round(start + diff * frac));
      if (frac < 1) requestAnimationFrame(tick);
      else prevRef.current = target;
    };

    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
}
