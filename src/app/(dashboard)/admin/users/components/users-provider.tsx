"use client";

import React, { useState } from "react";
import useDialogState from "@/hooks/use-dialog-state";

export type UsersDialogType = "delete";

type UsersContextType = {
  open: UsersDialogType | null;
  setOpen: (type: UsersDialogType | null) => void;
  currentRow: {
    id: string;
    full_name: string | null;
    email: string;
    role: string;
  } | null;
  setCurrentRow: React.Dispatch<
    React.SetStateAction<UsersContextType["currentRow"]>
  >;
};

const UsersContext = React.createContext<UsersContextType | null>(null);

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<UsersDialogType>(null);
  const [currentRow, setCurrentRow] =
    useState<UsersContextType["currentRow"]>(null);

  return (
    <UsersContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </UsersContext>
  );
}

export function useUsers() {
  const ctx = React.useContext(UsersContext);
  if (!ctx) throw new Error("useUsers must be used within <UsersProvider>");
  return ctx;
}
