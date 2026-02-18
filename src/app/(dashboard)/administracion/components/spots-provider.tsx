"use client";

import React, { useState } from "react";
import useDialogState from "@/hooks/use-dialog-state";
import type { Spot } from "@/lib/supabase/types";

export type SpotsDialogType = "add" | "edit" | "delete";

type SpotsContextType = {
  open: SpotsDialogType | null;
  setOpen: (type: SpotsDialogType | null) => void;
  currentRow: Spot | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<Spot | null>>;
};

const SpotsContext = React.createContext<SpotsContextType | null>(null);

export function SpotsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<SpotsDialogType>(null);
  const [currentRow, setCurrentRow] = useState<Spot | null>(null);

  return (
    <SpotsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </SpotsContext>
  );
}

export function useSpots() {
  const ctx = React.useContext(SpotsContext);
  if (!ctx) throw new Error("useSpots must be used within <SpotsProvider>");
  return ctx;
}
