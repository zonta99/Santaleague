"use client";

import { useEffect, useState } from "react";

interface Props {
  date: string | Date;
}

export function MatchCountdown({ date }: Props) {
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    const matchDate = new Date(date);
    const today = new Date();
    // Compare calendar days, not timestamps
    const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffMs = matchDay.getTime() - todayDay.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) setLabel("Oggi");
    else if (diffDays === 1) setLabel("Domani");
    else if (diffDays > 1 && diffDays <= 7) setLabel(`Tra ${diffDays} giorni`);
    else {
      // Fall back to formatted date for far-future or past dates
      setLabel(
        matchDate.toLocaleDateString("it-IT", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    }
  }, [date]);

  if (!label) {
    // Server render: show formatted date, client will replace
    return (
      <span>
        {new Date(date).toLocaleDateString("it-IT", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </span>
    );
  }

  return <span className="capitalize">{label}</span>;
}
