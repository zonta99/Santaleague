"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MapPin,
  Trophy,
  Users,
  Shield,
  Globe,
  UserCog,
  Settings,
  Menu,
  X,
} from "lucide-react";

const ALL_TABS = [
  { value: "overview", label: "Panoramica", icon: LayoutDashboard },
  { value: "matches", label: "Campi", icon: MapPin },
  { value: "seasons", label: "Stagioni", icon: Trophy },
  { value: "members", label: "Membri", icon: Users, leagueOnly: true },
  { value: "league", label: "Lega", icon: Shield, leagueOnly: true },
  { value: "leagues", label: "Leghe", icon: Globe, adminOnly: true },
  { value: "users", label: "Utenti", icon: UserCog, adminOnly: true },
  { value: "settings", label: "Impostazioni", icon: Settings, adminOnly: true },
] as const;

interface AdminTabsProps {
  isGlobalAdmin: boolean;
  isLeagueAdmin: boolean;
  title: string;
  children: React.ReactNode;
}

export function AdminTabs({ isGlobalAdmin, isLeagueAdmin, title, children }: AdminTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("tab") ?? "overview";
  const [drawerOpen, setDrawerOpen] = useState(false);

  const tabs = ALL_TABS.filter((t) => {
    if ("adminOnly" in t && t.adminOnly) return isGlobalAdmin;
    if ("leagueOnly" in t && t.leagueOnly) return isLeagueAdmin && !isGlobalAdmin;
    return true;
  });

  const currentTab = tabs.find((t) => t.value === current) ?? tabs[0];

  function navigate(value: string) {
    router.push(`?tab=${value}`);
    setDrawerOpen(false);
  }

  const navItems = tabs.map((t) => {
    const Icon = t.icon;
    const isActive = t.value === current;
    return (
      <button
        key={t.value}
        onClick={() => navigate(t.value)}
        className={cn(
          "flex items-center gap-2.5 px-3 py-1.5 rounded-full text-sm font-medium w-full text-left transition-colors",
          isActive
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <Icon size={15} className="shrink-0" />
        {t.label}
      </button>
    );
  });

  return (
    <div className="flex w-full gap-0">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-border pr-4 space-y-1">
        <p className="text-xs text-muted-foreground px-3 pb-2 pt-1 uppercase tracking-wider font-medium">
          {title}
        </p>
        {navItems}
      </aside>

      {/* Mobile: top bar with hamburger */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-4 md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Apri menu"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-medium text-foreground">{currentTab?.label}</span>
        </div>

        {/* Mobile drawer overlay */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setDrawerOpen(false)}
            />
            <aside className="absolute left-0 top-0 bottom-0 w-60 bg-card border-r border-border flex flex-col p-4 space-y-1">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
                <span className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  {title}
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="Chiudi menu"
                >
                  <X size={16} />
                </button>
              </div>
              {navItems}
            </aside>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 md:pl-6">
          {children}
        </div>
      </div>
    </div>
  );
}
