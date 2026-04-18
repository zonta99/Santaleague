"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Swords, User, ShieldCheck, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentRole } from "@/hooks/use-current-role";
import { useNotifications } from "@/hooks/use-notifications";
import { UserRole } from "@prisma/client";

const baseLinks = [
  { href: "/dashboard", label: "Home", Icon: Home },
  { href: "/match", label: "Partite", Icon: Swords },
  { href: "/leaderboard", label: "Classifica", Icon: Trophy },
  { href: "/players", label: "Giocatori", Icon: Users },
  { href: "/settings", label: "Profilo", Icon: User },
];

export function MobileNavbar() {
  const pathname = usePathname();
  const role = useCurrentRole();
  const { unreadCount } = useNotifications();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const links = [
    ...baseLinks,
    ...(role === UserRole.ADMIN || role === UserRole.MODERATOR
      ? [{ href: "/admin", label: role === UserRole.ADMIN ? "Admin" : "Gestione", Icon: ShieldCheck }]
      : []),
  ];

  return (
    <footer className="md:hidden fixed bottom-0 inset-x-0 flex items-center justify-around h-14 bg-background/90 backdrop-blur-md border-t border-border">
      {links.map(({ href, label, Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center flex-1 py-1"
          >
            <span
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-full transition-colors",
                active ? "bg-primary/15 text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              {href === "/settings" && unreadCount > 0 && (
                <span className="absolute -top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500" />
              )}
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </span>
          </Link>
        );
      })}
    </footer>
  );
}
