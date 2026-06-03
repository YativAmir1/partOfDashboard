"use client";

import { createContext, useContext } from "react";

interface HazardContextValue {
  hazardRevealed: boolean;
}

const HazardContext = createContext<HazardContextValue>({ hazardRevealed: false });

export function HazardProvider({ children }: { children: React.ReactNode }) {
  return (
    <HazardContext.Provider value={{ hazardRevealed: false }}>
      {children}
    </HazardContext.Provider>
  );
}

export function useHazard() {
  return useContext(HazardContext);
}
