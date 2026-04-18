"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ExportButton({ seasonId }: { seasonId?: number }) {
  const href = seasonId
    ? `/api/admin/export-season?seasonId=${seasonId}`
    : `/api/admin/export-season`;

  return (
    <Button asChild variant="outline" size="sm">
      <a href={href} download>
        <Download className="mr-2 h-4 w-4" />
        Esporta CSV
      </a>
    </Button>
  );
}
