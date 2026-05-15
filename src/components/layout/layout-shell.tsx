"use client";

import { MobileNavProvider } from "./mobile-nav-context";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { ReactNode } from "react";

function ShellInner({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── Desktop sidebar — normal flow, nunca aparece no mobile ── */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>

      {/* ── Conteúdo principal ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* pb-16 reserva espaço para o bottom nav no mobile */}
        <div className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</div>
      </main>

      {/* ── Bottom nav — mobile only ── */}
      <BottomNav />

    </div>
  );
}

export function LayoutShell({ children }: { children: ReactNode }) {
  return (
    <MobileNavProvider>
      <ShellInner>{children}</ShellInner>
    </MobileNavProvider>
  );
}
