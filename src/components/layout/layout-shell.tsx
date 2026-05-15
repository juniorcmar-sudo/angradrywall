"use client";

import { MobileNavProvider, useMobileNav } from "./mobile-nav-context";
import { Sidebar } from "./sidebar";
import { ReactNode } from "react";

function ShellInner({ children }: { children: ReactNode }) {
  const { isOpen, close } = useMobileNav();

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── Desktop sidebar — normal flow, nunca aparece no mobile ── */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>

      {/* ── Mobile overlay — só renderiza quando aberto ── */}
      {isOpen && (
        <div className="md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={close}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 flex">
            <Sidebar />
          </div>
        </div>
      )}

      {/* ── Conteúdo principal ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>

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
