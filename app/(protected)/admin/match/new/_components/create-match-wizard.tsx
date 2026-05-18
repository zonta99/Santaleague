"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  ChevronLeft,
  MapPin,
  Calendar,
  Trophy,
  Layers,
  Minus,
  Plus,
  Users,
  Gamepad2,
  Shield,
  GitBranch,
  GripVertical,
  Shuffle,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createMatch } from "@/actions/match";
import { deriveFormat, roundRobinPairs, buildEliminationBracket, formatLabel, totalGames } from "@/lib/match-format";
import type { MatchFormat } from "@/lib/match-format";

const TEAM_NAMES = ["Bianchi", "Neri", "Verdi", "Rossi", "Blu", "Gialli"];

type Location = { id: number; name: string; description?: string | null; num_fields: number };
type RankingEntry = { userId: string; name: string };

interface Props {
  locations: Location[];
  leagueId: string;
  prefilledDate?: string;
  leagueRanking?: RankingEntry[];
}

type BracketFormatChoice = "GIRONE" | "BRACKET_ELIMINATION" | "BRACKET_GROUPS";

interface WizardData {
  date: string;
  location_id: number;
  num_teams: number;
  players_per_team: number;
  num_games: number;
  bracket_format?: BracketFormatChoice;
  bracket_seed: string[];
}

function computeSteps(numTeams: number, bracketFormat?: BracketFormatChoice) {
  const format = deriveFormat(numTeams, bracketFormat);
  const needsSeeding = format === "BRACKET_ELIMINATION" || format === "BRACKET_GROUPS";
  return needsSeeding
    ? ["Quando?", "Dove?", "Struttura", "Seeding", "Riepilogo"]
    : ["Quando?", "Dove?", "Struttura", "Riepilogo"];
}

export function CreateMatchWizard({ locations, leagueId, prefilledDate, leagueRanking = [] }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    date: prefilledDate ?? "",
    location_id: 0,
    num_teams: 2,
    players_per_team: 5,
    num_games: 1,
    bracket_seed: TEAM_NAMES.slice(0, 2),
  });

  const update = (patch: Partial<WizardData>) =>
    setData((d) => {
      const next = { ...d, ...patch };
      // Reset seed when num_teams changes
      if (patch.num_teams !== undefined) {
        next.bracket_seed = TEAM_NAMES.slice(0, patch.num_teams);
      }
      return next;
    });

  const format = deriveFormat(data.num_teams, data.bracket_format);
  const steps = computeSteps(data.num_teams, data.bracket_format);
  const totalSteps = steps.length;

  const canAdvance = () => {
    if (step === 1) return data.date !== "";
    if (step === 2) return data.location_id > 0;
    return true;
  };

  const handleNext = () => { if (step < totalSteps) setStep((s) => s + 1); };
  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
    else router.push("/admin?tab=matches");
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const payload = {
        date: data.date,
        location_id: data.location_id,
        num_teams: data.num_teams,
        players_per_team: data.players_per_team,
        num_games: data.num_games,
        bracket_format: data.bracket_format,
        bracket_seed: (format === "BRACKET_ELIMINATION" || format === "BRACKET_GROUPS") ? data.bracket_seed : undefined,
      };
      const result = await createMatch(payload, leagueId);
      if (result.success) {
        toast.success(result.success);
        router.push("/admin?tab=matches");
      } else {
        toast.error(result.error);
      }
    });
  };

  const selectedLocation = locations.find((l) => l.id === data.location_id);
  const stepLabel = steps[step - 1];

  const STEP_ICONS: Record<string, React.ElementType> = {
    "Quando?": Calendar,
    "Dove?": MapPin,
    "Struttura": Layers,
    "Seeding": GitBranch,
    "Riepilogo": Trophy,
  };
  const StepIcon = STEP_ICONS[stepLabel] ?? Layers;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start pt-8 px-4 pb-8">
      <div className="w-full max-w-lg">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          {step > 1 ? "Indietro" : "Annulla"}
        </button>

        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${i + 1 <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <StepIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Passaggio {step} di {totalSteps}</p>
              <h2 className="text-base font-semibold text-foreground">{stepLabel}</h2>
            </div>
          </div>

          <div className="px-6 py-6">
            {step === 1 && <StepWhen data={data} update={update} />}
            {step === 2 && <StepWhere data={data} update={update} locations={locations} />}
            {step === 3 && <StepStructure data={data} update={update} format={format} selectedLocation={selectedLocation} />}
            {step === 4 && steps[3] === "Seeding" && (
              <StepSeeding data={data} update={update} leagueRanking={leagueRanking} />
            )}
            {step === totalSteps && (
              <StepSummary data={data} format={format} selectedLocation={selectedLocation} />
            )}
          </div>

          <div className="px-6 pb-6">
            {step < totalSteps ? (
              <Button onClick={handleNext} disabled={!canAdvance()} className="w-full h-11 font-semibold">
                Avanti
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isPending} className="w-full h-11 font-semibold">
                {isPending ? "Creazione..." : "Crea Partita"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Step 1: Quando? ─────────────────────────────────────────────────────── */

function StepWhen({ data, update }: { data: WizardData; update: (p: Partial<WizardData>) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">Data</label>
      <input
        type="date"
        value={data.date}
        onChange={(e) => update({ date: e.target.value })}
        className="w-full h-11 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
      />
    </div>
  );
}

/* ── Step 2: Dove? ───────────────────────────────────────────────────────── */

function StepWhere({
  data,
  update,
  locations,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
  locations: Location[];
}) {
  return (
    <div className="space-y-3">
      {locations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <MapPin className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="font-medium text-foreground">Nessun campo disponibile</p>
          <p className="text-sm text-muted-foreground mt-1">
            Aggiungi un campo dalla scheda Partite nel pannello admin.
          </p>
        </div>
      ) : (
        locations.map((loc) => {
          const selected = data.location_id === loc.id;
          return (
            <button
              key={loc.id}
              onClick={() => update({ location_id: loc.id })}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                selected ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/40"
              }`}
            >
              <div
                className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                  selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {selected ? <Check className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate ${selected ? "text-primary" : "text-foreground"}`}>
                  {loc.name}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {loc.num_fields} {loc.num_fields === 1 ? "campo" : "campi"} disponibili
                  {loc.description ? ` · ${loc.description}` : ""}
                </p>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}

/* ── Step 3: Struttura ───────────────────────────────────────────────────── */

function StepStructure({
  data,
  update,
  format,
  selectedLocation,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
  format: MatchFormat;
  selectedLocation?: Location;
}) {
  const numFields = selectedLocation?.num_fields ?? 1;
  const numGames = totalGames(data.num_teams, format, data.num_games);

  return (
    <div className="space-y-5">
      {/* Teams + players per team */}
      {[
        { label: "Squadre", description: "Quante squadre si sfidano", key: "num_teams" as const, min: 2, max: 6, Icon: Shield },
        { label: "Giocatori per squadra", description: "Per ogni squadra", key: "players_per_team" as const, min: 1, max: 15, Icon: Users },
      ].map(({ label, description, key, min, max, Icon }) => (
        <div key={key} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => update({ [key]: Math.max(min, data[key] - 1) })}
              disabled={data[key] <= min}
              className="w-8 h-8 rounded-lg border border-border bg-muted flex items-center justify-center hover:bg-muted/70 disabled:opacity-30 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 text-center text-sm font-bold tabular-nums">{data[key]}</span>
            <button
              onClick={() => update({ [key]: Math.min(max, data[key] + 1) })}
              disabled={data[key] >= max}
              className="w-8 h-8 rounded-lg border border-border bg-muted flex items-center justify-center hover:bg-muted/70 disabled:opacity-30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}

      {/* Format selection (4+ teams) */}
      {data.num_teams >= 4 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Formato</p>
          <div className="grid grid-cols-1 gap-2">
            {([
              { value: "GIRONE" as BracketFormatChoice, label: "Girone all'italiana", desc: "Tutti contro tutti" },
              { value: "BRACKET_ELIMINATION" as BracketFormatChoice, label: "Eliminazione diretta", desc: "Bracket, chi perde è eliminato" },
              { value: "BRACKET_GROUPS" as BracketFormatChoice, label: "Gironi + Eliminazione", desc: "Fase a gironi poi bracket" },
            ] as const).map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => update({ bracket_format: value })}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                  (data.bracket_format ?? "GIRONE") === value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                  (data.bracket_format ?? "GIRONE") === value ? "border-primary bg-primary" : "border-muted-foreground"
                }`} />
                <div>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* num_games selector — only for NORMALE (2 teams) */}
      {data.num_teams === 2 && (
        <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Gamepad2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Numero di game</p>
            <p className="text-xs text-muted-foreground">Quante partite si giocano</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => update({ num_games: Math.max(1, data.num_games - 1) })}
              disabled={data.num_games <= 1}
              className="w-8 h-8 rounded-lg border border-border bg-muted flex items-center justify-center hover:bg-muted/70 disabled:opacity-30 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 text-center text-sm font-bold tabular-nums">{data.num_games}</span>
            <button
              onClick={() => update({ num_games: Math.min(10, data.num_games + 1) })}
              disabled={data.num_games >= 10}
              className="w-8 h-8 rounded-lg border border-border bg-muted flex items-center justify-center hover:bg-muted/70 disabled:opacity-30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Summary info box */}
      <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-1">
        <div className="flex justify-between">
          <span>Formato:</span>
          <span className="font-semibold text-foreground">{formatLabel(format)}</span>
        </div>
        <div className="flex justify-between">
          <span>Game totali:</span>
          <span className="font-semibold text-foreground">{numGames}</span>
        </div>
        <div className="flex justify-between">
          <span>Game in parallelo:</span>
          <span className={`font-semibold ${numGames > numFields ? "text-amber-400" : "text-foreground"}`}>
            max {numFields} (campi disponibili)
          </span>
        </div>
        <div className="flex justify-between">
          <span>Giocatori totali:</span>
          <span className="font-semibold text-foreground">{data.num_teams * data.players_per_team}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Step 4: Seeding (bracket only) ─────────────────────────────────────── */

function StepSeeding({
  data,
  update,
  leagueRanking,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
  leagueRanking: RankingEntry[];
}) {
  const [dragging, setDragging] = useState<number | null>(null);

  const seed = data.bracket_seed.length === data.num_teams
    ? data.bracket_seed
    : TEAM_NAMES.slice(0, data.num_teams);

  const setSeed = (next: string[]) => update({ bracket_seed: next });

  const shuffle = () => {
    const arr = [...seed];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setSeed(arr);
  };

  const byRanking = () => {
    if (leagueRanking.length === 0) return;
    const ranked = leagueRanking.slice(0, data.num_teams).map((_, i) => TEAM_NAMES[i]);
    setSeed(ranked);
  };

  const handleDragStart = (i: number) => setDragging(i);
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragging === null || dragging === i) return;
    const next = [...seed];
    const [item] = next.splice(dragging, 1);
    next.splice(i, 0, item);
    setSeed(next);
    setDragging(i);
  };
  const handleDragEnd = () => setDragging(null);

  // Bracket preview for first round
  const slots = buildEliminationBracket(data.num_teams);
  const firstRound = slots.filter((s) => s.fed_from_slot_a === null && s.fed_from_slot_b === null);

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={shuffle} className="flex-1 gap-1.5">
          <Shuffle className="w-3.5 h-3.5" /> Casuale
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={byRanking}
          disabled={leagueRanking.length === 0}
          className="flex-1 gap-1.5"
        >
          <BarChart2 className="w-3.5 h-3.5" /> Per classifica
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Trascina per riordinare · Il seed #1 è il favorito</p>
        {seed.map((name, i) => (
          <div
            key={i}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-3 p-3 rounded-xl border border-border bg-background cursor-grab transition-opacity ${
              dragging === i ? "opacity-50" : "opacity-100"
            }`}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-xs font-mono text-muted-foreground w-4">#{i + 1}</span>
            <span className="text-sm font-semibold text-foreground">{name}</span>
          </div>
        ))}
      </div>

      {/* First round preview */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Primo turno</p>
        <div className="rounded-xl border border-border bg-background overflow-hidden divide-y divide-border">
          {firstRound.map((slot, i) => {
            const nameA = slot.pair_a !== null ? seed[slot.pair_a] : "BYE";
            const nameB = slot.pair_b !== null ? seed[slot.pair_b] : "BYE";
            return (
              <div key={i} className="flex items-center gap-2 px-4 py-2.5 text-sm">
                <span className="font-semibold text-foreground flex-1">{nameA}</span>
                <span className="text-muted-foreground text-xs">vs</span>
                <span className="font-semibold text-foreground flex-1 text-right">{nameB}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Step finale: Riepilogo ──────────────────────────────────────────────── */

function StepSummary({
  data,
  format,
  selectedLocation,
}: {
  data: WizardData;
  format: MatchFormat;
  selectedLocation?: Location;
}) {
  const numGames = totalGames(data.num_teams, format, data.num_games);
  const rows = [
    {
      Icon: Calendar,
      label: "Data",
      value: data.date
        ? new Date(data.date + "T12:00:00").toLocaleDateString("it-IT", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
          })
        : "—",
    },
    { Icon: MapPin, label: "Campo", value: selectedLocation?.name ?? "—" },
    { Icon: Layers, label: "Formato", value: formatLabel(format) },
    { Icon: Shield, label: "Squadre", value: String(data.num_teams) },
    { Icon: Users, label: "Giocatori/squadra", value: String(data.players_per_team) },
    { Icon: Gamepad2, label: "Game totali", value: String(numGames) },
  ];

  const pairs =
    format === "NORMALE"
      ? Array.from({ length: data.num_games }, () => `${TEAM_NAMES[0]} vs ${TEAM_NAMES[1]}`)
      : format === "GIRONE"
      ? roundRobinPairs(data.num_teams).map(([a, b]) => `${TEAM_NAMES[a]} vs ${TEAM_NAMES[b]}`)
      : null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-background overflow-hidden divide-y divide-border">
        {rows.map(({ Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-3">
            <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground flex-1">{label}</span>
            <span className="text-sm font-semibold text-foreground capitalize">{value}</span>
          </div>
        ))}
      </div>

      {pairs && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Abbinamenti</p>
          <div className="rounded-xl border border-border bg-background overflow-hidden divide-y divide-border">
            {pairs.map((pair, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2.5 text-sm">
                <span className="text-xs text-muted-foreground font-mono w-5">#{i + 1}</span>
                <span className="text-foreground">{pair}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary text-center font-medium">
        {data.num_teams * data.players_per_team} giocatori totali · {numGames} game
      </div>
    </div>
  );
}
