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
  Tag,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createMatch } from "@/actions/match";

type Location = { id: number; name: string; description?: string | null };

interface Props {
  locations: Location[];
  leagueId: string;
  prefilledDate?: string;
}

interface WizardData {
  date: string;
  match_type: "normal" | "torneo";
  location_id: number;
  num_teams: number;
  players_per_team: number;
  num_games: number;
}

const STEPS = [
  { id: 1, label: "Quando?", icon: Calendar },
  { id: 2, label: "Dove?", icon: MapPin },
  { id: 3, label: "Come?", icon: Layers },
  { id: 4, label: "Riepilogo", icon: Trophy },
];

export function CreateMatchWizard({ locations, leagueId, prefilledDate }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    date: prefilledDate ?? "",
    match_type: "normal",
    location_id: 0,
    num_teams: 2,
    players_per_team: 5,
    num_games: 1,
  });

  const update = (patch: Partial<WizardData>) => setData((d) => ({ ...d, ...patch }));

  const canAdvance = () => {
    if (step === 1) return data.date !== "";
    if (step === 2) return data.location_id > 0;
    return true;
  };

  const handleNext = () => {
    if (step < 4) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
    else router.push("/admin?tab=matches");
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await createMatch(data, leagueId);
      if (result.success) {
        toast.success(result.success);
        router.push("/admin?tab=matches");
      } else {
        toast.error(result.error);
      }
    });
  };

  const selectedLocation = locations.find((l) => l.id === data.location_id);
  const StepIcon = STEPS[step - 1].icon;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start pt-8 px-4 pb-8">
      <div className="w-full max-w-lg">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          {step > 1 ? "Indietro" : "Annulla"}
        </button>

        {/* Step progress */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                s.id <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Card header */}
          <div className="px-6 py-5 border-b border-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <StepIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Passaggio {step} di {STEPS.length}</p>
              <h2 className="text-base font-semibold text-foreground">{STEPS[step - 1].label}</h2>
            </div>
          </div>

          {/* Card body */}
          <div className="px-6 py-6">
            {step === 1 && <StepWhen data={data} update={update} />}
            {step === 2 && <StepWhere data={data} update={update} locations={locations} />}
            {step === 3 && <StepHow data={data} update={update} />}
            {step === 4 && <StepSummary data={data} selectedLocation={selectedLocation} />}
          </div>

          {/* Card footer */}
          <div className="px-6 pb-6">
            {step < 4 ? (
              <Button
                onClick={handleNext}
                disabled={!canAdvance()}
                className="w-full h-11 font-semibold"
              >
                Avanti
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isPending}
                className="w-full h-11 font-semibold"
              >
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
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Data</label>
        <input
          type="date"
          value={data.date}
          onChange={(e) => update({ date: e.target.value })}
          className="w-full h-11 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Tipo di partita</label>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: "normal", label: "Normale", Icon: Layers },
            { value: "torneo", label: "Torneo", Icon: Trophy },
          ] as const).map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => update({ match_type: value })}
              className={`flex flex-col items-center justify-center gap-2 h-20 rounded-xl border-2 font-medium text-sm transition-all ${
                data.match_type === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </div>
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
                selected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background hover:border-primary/40"
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
                {loc.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{loc.description}</p>
                )}
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}

/* ── Step 3: Come? ───────────────────────────────────────────────────────── */

function StepHow({ data, update }: { data: WizardData; update: (p: Partial<WizardData>) => void }) {
  const rows = [
    { label: "Squadre", description: "Quante squadre si sfidano", key: "num_teams" as const, min: 2, max: 6, Icon: Shield },
    { label: "Giocatori per squadra", description: "Per ogni squadra", key: "players_per_team" as const, min: 1, max: 15, Icon: Users },
    { label: "Numero di game", description: "Quante partite si giocano", key: "num_games" as const, min: 1, max: 10, Icon: Gamepad2 },
  ];

  return (
    <div className="space-y-3">
      {rows.map(({ label, description, key, min, max, Icon }) => (
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

      <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground text-center">
        Totale giocatori: <span className="font-semibold text-foreground">{data.num_teams * data.players_per_team}</span>
      </div>
    </div>
  );
}

/* ── Step 4: Riepilogo ───────────────────────────────────────────────────── */

function StepSummary({
  data,
  selectedLocation,
}: {
  data: WizardData;
  selectedLocation?: Location;
}) {
  const rows = [
    {
      Icon: Calendar,
      label: "Data",
      value: data.date
        ? new Date(data.date + "T12:00:00").toLocaleDateString("it-IT", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "—",
    },
    { Icon: Tag, label: "Tipo", value: data.match_type === "normal" ? "Normale" : "Torneo" },
    { Icon: MapPin, label: "Campo", value: selectedLocation?.name ?? "—" },
    { Icon: Shield, label: "Squadre", value: String(data.num_teams) },
    { Icon: Users, label: "Giocatori/squadra", value: String(data.players_per_team) },
    { Icon: Gamepad2, label: "Game", value: String(data.num_games) },
  ];

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

      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary text-center font-medium">
        {data.num_teams * data.players_per_team} giocatori totali · {data.num_games}{" "}
        {data.num_games === 1 ? "game" : "game"}
      </div>
    </div>
  );
}
