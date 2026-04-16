"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Swords, User, ShieldCheck } from "lucide-react";
import { useCurrentRole } from "@/hooks/use-current-role";
import { UserRole } from "@prisma/client";

const baseLinks = [
  { href: "/dashboard", label: "Home", Icon: Home },
  { href: "/match", label: "Partite", Icon: Swords },
  { href: "/settings", label: "Profilo", Icon: User },
];

export function MobileNavbar() {
  const pathname = usePathname();
  const role = useCurrentRole();

  const links = [
    ...baseLinks,
    ...(role === UserRole.ADMIN ? [{ href: "/admin", label: "Admin", Icon: ShieldCheck }] : []),
  ];

  return (
    <footer className="fixed bottom-0 inset-x-0 flex items-center justify-around h-14 bg-background border-t border-border shadow-t">
      {links.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center w-full text-xs font-medium transition-colors ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            {label}
          </Link>
        );
      })}
    </footer>
  );
}
