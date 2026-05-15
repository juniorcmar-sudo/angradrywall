"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  Warehouse,
  FileText,
  ShoppingCart,
  Clock,
  Truck,
  Settings,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMobileNav } from "./mobile-nav-context";

const navItems = [
  { href: "/dashboard",         label: "Dashboard",         icon: LayoutDashboard },
  { href: "/clientes",          label: "Clientes",          icon: Users },
  { href: "/produtos",          label: "Produtos",          icon: Package },
  { href: "/estoque",           label: "Estoque",           icon: Warehouse },
  { href: "/orcamentos",        label: "Orçamentos",        icon: FileText },
  { href: "/vendas",            label: "Vendas",            icon: ShoppingCart },
  { href: "/pedidos-pendentes", label: "Pedidos Pendentes", icon: Clock },
  { href: "/fretes",            label: "Fretes",            icon: Truck },
  { href: "/relatorios",        label: "Relatórios",        icon: BarChart3 },
  { href: "/configuracoes",     label: "Configurações",     icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { close: closeMobile } = useMobileNav();

  async function handleSignOut() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar-background border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center justify-center border-b border-sidebar-border min-h-[72px]",
        collapsed ? "px-2 py-3" : "px-4 py-3"
      )}>
        {collapsed ? (
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center overflow-hidden shadow-sm">
            <Image src="/logo.png" alt="AD" width={32} height={32} className="object-contain" />
          </div>
        ) : (
          <div className="bg-white rounded-xl px-3 py-2 w-full flex items-center justify-center shadow-sm">
            <Image
              src="/logo.png"
              alt="Angra Drywall"
              width={160}
              height={52}
              className="object-contain h-11 w-auto"
              priority
            />
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
        <ul className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  onClick={closeMobile}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white/60 rounded-r-full" />
                  )}
                  <Icon className={cn(
                    "flex-shrink-0 w-[18px] h-[18px]",
                    isActive ? "opacity-100" : "opacity-50 group-hover:opacity-80"
                  )} />
                  {!collapsed && (
                    <span className="truncate tracking-tight">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={handleSignOut}
          title={collapsed ? "Sair" : undefined}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
        >
          <LogOut className="flex-shrink-0 w-[18px] h-[18px]" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>

      {/* Collapse toggle — desktop only */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar-background border border-sidebar-border flex items-center justify-center text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors z-50 shadow-sm"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
