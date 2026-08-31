"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Grid3x3,
  Warehouse,
  ShoppingCart,
  Wallet,
  Clock,
  Truck,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useState } from "react";

const mainItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orcamentos", label: "Orçamentos", icon: FileText },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/produtos", label: "Produtos", icon: Package },
];

const moreItems = [
  { href: "/estoque", label: "Estoque", icon: Warehouse },
  { href: "/vendas", label: "Vendas", icon: ShoppingCart },
  { href: "/contas-a-receber", label: "A Receber", icon: Wallet },
  { href: "/pedidos-pendentes", label: "Pedidos", icon: Clock },
  { href: "/fretes", label: "Fretes", icon: Truck },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/configuracoes", label: "Config.", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  function isActive(href: string) {
    return (
      pathname === href ||
      (href !== "/dashboard" && pathname.startsWith(href))
    );
  }

  const isMoreActive = moreItems.some((item) => isActive(item.href));

  return (
    <>
      {/* Backdrop */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More menu sheet */}
      {moreOpen && (
        <div className="fixed bottom-16 left-0 right-0 z-50 md:hidden bg-sidebar-background border-t border-sidebar-border px-4 pt-3 pb-4 shadow-lg">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 mb-2">
            Mais módulos
          </p>
          <div className="grid grid-cols-3 gap-2">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-medium transition-colors",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-sidebar-background border-t border-sidebar-border safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center gap-1 pt-1 pb-0.5 px-2 min-w-0 flex-1"
              >
                <div
                  className={cn(
                    "w-12 h-6 rounded-full flex items-center justify-center transition-colors",
                    active ? "bg-sidebar-primary" : ""
                  )}
                >
                  <Icon
                    className={cn(
                      "w-[18px] h-[18px]",
                      active
                        ? "text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/50"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium truncate w-full text-center",
                    active
                      ? "text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/50"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Mais button */}
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className="flex flex-col items-center gap-1 pt-1 pb-0.5 px-2 min-w-0 flex-1"
          >
            <div
              className={cn(
                "w-12 h-6 rounded-full flex items-center justify-center transition-colors",
                isMoreActive || moreOpen ? "bg-sidebar-primary" : ""
              )}
            >
              <Grid3x3
                className={cn(
                  "w-[18px] h-[18px]",
                  isMoreActive || moreOpen
                    ? "text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/50"
                )}
              />
            </div>
            <span
              className={cn(
                "text-[10px] font-medium",
                isMoreActive || moreOpen
                  ? "text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/50"
              )}
            >
              Mais
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
