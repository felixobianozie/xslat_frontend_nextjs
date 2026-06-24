"use client";

// Makes session provider available within a 'use client' wrapper

import { SessionProvider } from "next-auth/react";

function CustomSessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SessionProvider>{children}</SessionProvider>
    </>
  );
}

export default CustomSessionProvider;
