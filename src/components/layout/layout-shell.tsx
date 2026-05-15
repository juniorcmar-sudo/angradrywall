"use client";

import { MobileNavProvider, useMobileNav } from "./mobile-nav-context";
import { Sidebar } from "./sidebar";
import { ReactNode } from "react";

function ShellInner({ children }: { children: ReactNode }) {
  const { isOpen, close } = useMobileNav();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar — desktop: always visible | mobile: drawer overlay */}
      <div
        className={[
          "fixed inset-y-0 left-0 z-50 md:relative md:flex md:flex-shrink-0",
          "transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        <Sidebar />
      </div>

      {/* Main content */}
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
