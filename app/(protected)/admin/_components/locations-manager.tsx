"use client";

import * as z from "zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X, Check } from "lucide-react";

import { LocationSchema } from "@/schemas";
import { createLocation, updateLocation, deleteLocation } from "@/actions/location";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type Location = { id: number; name: string; description: string | null; _count?: { Match: number } };

interface Props {
  locations: Location[];
  leagueId: string;
}

function LocationForm({
  defaultValues,
  onSubmit,
  onCancel,
  isPending,
}: {
  defaultValues: z.infer<typeof LocationSchema>;
  onSubmit: (values: z.infer<typeof LocationSchema>) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const form = useForm<z.infer<typeof LocationSchema>>({
    resolver: zodResolver(LocationSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2 items-end">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Es. Campo Sportivo Est" disabled={isPending} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Descrizione</FormLabel>
              <FormControl>
                <Input placeholder="Opzionale" disabled={isPending} {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="icon" disabled={isPending}>
          <Check className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost" onClick={onCancel} disabled={isPending}>
          <X className="h-4 w-4" />
        </Button>
      </form>
    </Form>
  );
}

export function LocationsManager({ locations, leagueId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = (values: z.infer<typeof LocationSchema>) => {
    startTransition(async () => {
      const result = await createLocation(values, leagueId);
      if (result.success) { toast.success(result.success); setShowCreate(false); }
      if (result.error) toast.error(result.error);
    });
  };

  const handleUpdate = (id: number, values: z.infer<typeof LocationSchema>) => {
    startTransition(async () => {
      const result = await updateLocation(id, values, leagueId);
      if (result.success) { toast.success(result.success); setEditingId(null); }
      if (result.error) toast.error(result.error);
    });
  };

  const handleDelete = (id: number) => {
    startTransition(async () => {
      const result = await deleteLocation(id, leagueId);
      if (result.success) toast.success(result.success);
      if (result.error) toast.error(result.error);
    });
  };

  return (
    <div className="w-full max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {locations.length} {locations.length === 1 ? "campo" : "campi"} registrati
        </p>
        {!showCreate && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> Aggiungi
          </Button>
        )}
      </div>

      {showCreate && (
        <div className="rounded-lg border border-border p-4 bg-card">
          <LocationForm
            defaultValues={{ name: "", description: "" }}
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            isPending={isPending}
          />
        </div>
      )}

      <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
        {locations.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nessun campo registrato
          </p>
        )}
        {locations.map((loc) =>
          editingId === loc.id ? (
            <div key={loc.id} className="p-4 bg-card">
              <LocationForm
                defaultValues={{ name: loc.name, description: loc.description ?? "" }}
                onSubmit={(values) => handleUpdate(loc.id, values)}
                onCancel={() => setEditingId(null)}
                isPending={isPending}
              />
            </div>
          ) : (
            <div key={loc.id} className="flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/30 transition-colors">
              <div>
                <p className="text-sm font-medium">{loc.name}</p>
                {loc.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{loc.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={isPending}
                  onClick={() => setEditingId(loc.id)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={isPending}
                  onClick={() => handleDelete(loc.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
