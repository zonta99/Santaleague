"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRole } from "@prisma/client";

const ALL_TABS = [
  { value: "overview", label: "Panoramica" },
  { value: "matches", label: "Partite" },
  { value: "seasons", label: "Stagioni" },
  { value: "users", label: "Utenti", adminOnly: true },
  { value: "settings", label: "Impostazioni", adminOnly: true },
] as const;

interface AdminTabsProps {
  role: UserRole;
  children: React.ReactNode;
}

export function AdminTabs({ role, children }: AdminTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("tab") ?? "overview";

  const tabs = ALL_TABS.filter((t) => !("adminOnly" in t && t.adminOnly) || role === UserRole.ADMIN);

  return (
    <Tabs value={current} onValueChange={(v) => router.push(`?tab=${v}`)}>
      <TabsList className="mb-6">
        {tabs.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}
