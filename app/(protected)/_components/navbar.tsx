"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserButton } from "@/components/auth/user-button";
import { NotificationBell } from "@/app/(protected)/_components/notification-bell";
import { useCurrentRole } from "@/hooks/use-current-role";
import { UserRole, LeagueRole } from "@prisma/client";
import { useLeague } from "@/components/league/league-provider";
import { LeagueSwitcher } from "@/components/league/league-switcher";

export const Navbar = () => {
  const pathname = usePathname();
  const role = useCurrentRole();
  const { role: leagueRole } = useLeague();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const showAdmin =
    role === UserRole.ADMIN ||
    leagueRole === LeagueRole.OWNER ||
    leagueRole === LeagueRole.MANAGER;

  const links = [
    { href: "/dashboard", label: "Home" },
    { href: "/match", label: "Partite" },
    { href: "/leaderboard", label: "Classifica" },
    { href: "/players", label: "Giocatori" },
    { href: "/settings", label: "Profilo" },
    ...(showAdmin
      ? [{ href: "/admin", label: role === UserRole.ADMIN ? "Admin" : "Gestione" }]
      : []),
  ];

  return (
    <nav className="relative flex items-center w-full px-6 h-14">
      <div className="flex-1">
        <Link
          href="/dashboard"
          className="text-base font-bold tracking-tight text-foreground hover:text-primary transition-colors"
        >
          Santaleague
        </Link>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-x-1">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              isActive(href)
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="flex-1 flex items-center justify-end gap-x-2">
        <LeagueSwitcher />
        <NotificationBell />
        <UserButton />
      </div>
    </nav>
  );
};
