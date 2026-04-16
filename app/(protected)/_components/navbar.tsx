"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { UserButton } from "@/components/auth/user-button";
import { useCurrentRole } from "@/hooks/use-current-role";
import { UserRole } from "@prisma/client";

export const Navbar = () => {
  const pathname = usePathname();
  const role = useCurrentRole();

  const links = [
    { href: "/dashboard", label: "Home" },
    { href: "/match", label: "Partite" },
    { href: "/settings", label: "Profilo" },
    ...(role === UserRole.ADMIN ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <nav className="bg-secondary flex justify-between items-center p-4 rounded-xl w-full max-w-3xl shadow-sm">
      <div className="flex gap-x-2">
        {links.map(({ href, label }) => (
          <Button
            key={href}
            asChild
            variant={pathname === href ? "default" : "outline"}
          >
            <Link href={href}>{label}</Link>
          </Button>
        ))}
      </div>
      <UserButton />
    </nav>
  );
};
