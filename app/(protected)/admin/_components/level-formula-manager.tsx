"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { updateLevelFormula } from "@/actions/level-formula";
import { BarChart2 } from "lucide-react";

interface Props {
  initial: { field_weight: number; win_weight: number; goal_weight: number; updated_at: Date | null };
}

export function LevelFormulaManager({ initial }: Props) {
  const [fieldW, setFieldW] = useState(Math.round(initial.field_weight * 100));
  const [winW, setWinW] = useState(Math.round(initial.win_weight * 100));
  const [goalW, setGoalW] = useState(Math.round(initial.goal_weight * 100));
  const [isPending, startTransition] = useTransition();

  const total = fieldW + winW + goalW;
  const isValid = total === 100;

  const handleSave = () => {
    if (!isValid) return;
    startTransition(async () => {
      const result = await updateLevelFormula({
        field_weight: fieldW / 100,
        win_weight: winW / 100,
        goal_weight: goalW / 100,
      });
      if (result?.error) toast.error(result.error);
      else toast.success(result?.success ?? "Salvato");
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-purple-400" />
          Formula livello giocatore
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-xs text-muted-foreground">
          Livello = (rating_campo × {fieldW}%) + (win_rate × {winW}%) + (gol_per_partita × {goalW}%)
        </p>

        <div className="space-y-4">
          <SliderRow label={`Rating campo`} value={fieldW} onChange={setFieldW} />
          <SliderRow label={`Percentuale vittorie`} value={winW} onChange={setWinW} />
          <SliderRow label={`Gol per partita`} value={goalW} onChange={setGoalW} />
        </div>

        <div className={`text-xs font-medium ${isValid ? "text-green-400" : "text-red-400"}`}>
          Totale: {total}% {isValid ? "✓" : "(deve essere 100%)"}
        </div>

        <Button onClick={handleSave} disabled={!isValid || isPending} size="sm">
          {isPending ? "Salvataggio..." : "Salva formula"}
        </Button>

        {initial.updated_at && (
          <p className="text-xs text-muted-foreground">
            Aggiornato: {new Date(initial.updated_at).toLocaleString("it-IT")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SliderRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <Slider
        min={0}
        max={100}
        step={5}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}
