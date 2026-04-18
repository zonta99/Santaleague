"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MatchListView } from "./match-list-view";
import { MatchCalendarView } from "./match-calendar-view";
import { MatchItem } from "./match-card";

interface MatchViewContainerProps {
  matches: MatchItem[];
  joinedMatchIds: number[];
  defaultView: string;
}

export function MatchViewContainer({ matches, joinedMatchIds, defaultView }: MatchViewContainerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? defaultView;

  function handleViewChange(value: string) {
    router.push(`${pathname}?view=${value}`);
  }

  return (
    <Tabs value={view} onValueChange={handleViewChange}>
      <TabsList className="mb-4">
        <TabsTrigger value="lista">Lista</TabsTrigger>
        <TabsTrigger value="calendario">Calendario</TabsTrigger>
      </TabsList>
      <TabsContent value="lista">
        <MatchListView matches={matches} joinedMatchIds={joinedMatchIds} />
      </TabsContent>
      <TabsContent value="calendario">
        <MatchCalendarView matches={matches} joinedMatchIds={joinedMatchIds} />
      </TabsContent>
    </Tabs>
  );
}
