"use client";

import { useState, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { it } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MatchCard, MatchItem } from "./match-card";

interface MatchCalendarViewProps {
  matches: MatchItem[];
  joinedMatchIds: number[];
}

export function MatchCalendarView({ matches, joinedMatchIds }: MatchCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const joinedSet = useMemo(() => new Set(joinedMatchIds), [joinedMatchIds]);

  const matchIndex = useMemo(() => {
    const map = new Map<string, MatchItem[]>();
    for (const match of matches) {
      const key = format(new Date(match.date), "yyyy-MM-dd");
      const existing = map.get(key) ?? [];
      existing.push(match);
      map.set(key, existing);
    }
    return map;
  }, [matches]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
    });
  }, [currentMonth]);

  const weekdays = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

  return (
    <div className="w-full">
      {/* Header navigazione mese */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-base font-semibold capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: it })}
        </h2>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Intestazioni giorni */}
      <div className="grid grid-cols-7 mb-1">
        {weekdays.map((d) => (
          <div key={d} className="text-center text-xs text-muted-foreground py-1 font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* Griglia giorni */}
      <div className="grid grid-cols-7 border-l border-t">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayMatches = matchIndex.get(key);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={key}
              className={`border-r border-b min-h-[64px] p-1 ${
                isCurrentMonth ? "bg-card" : "bg-muted/20"
              }`}
            >
              {dayMatches ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full h-full flex flex-col items-center gap-1 rounded hover:bg-accent transition-colors p-1">
                      <span
                        className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? "bg-primary text-primary-foreground"
                            : isCurrentMonth
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {format(day, "d")}
                      </span>
                      <div className="flex gap-0.5 flex-wrap justify-center">
                        {dayMatches.slice(0, 3).map((m) => (
                          <span
                            key={m.id}
                            className="w-1.5 h-1.5 rounded-full bg-primary"
                          />
                        ))}
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-2 space-y-2" align="center">
                    <p className="text-xs font-medium text-muted-foreground px-1 capitalize">
                      {format(day, "EEEE d MMMM", { locale: it })}
                    </p>
                    {dayMatches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        isJoined={joinedSet.has(match.id)}
                      />
                    ))}
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="flex justify-center pt-1">
                  <span
                    className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday
                        ? "bg-primary text-primary-foreground font-semibold"
                        : isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground/40"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
