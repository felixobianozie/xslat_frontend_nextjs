"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface LeftbarContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const LeftbarContext = createContext<LeftbarContextValue | null>(null);

export function LeftbarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <LeftbarContext.Provider
      value={{
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </LeftbarContext.Provider>
  );
}

export function useLeftbar() {
  const ctx = useContext(LeftbarContext);
  if (!ctx) {
    throw new Error("useLeftbar must be used within a LeftbarProvider");
  }
  return ctx;
}
