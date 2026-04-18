"use client";

import * as z from "zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Plus, X, Check, Lock } from "lucide-react";
import { SeasonStatus } from "@prisma/client";

import { SeasonSchema } from "@/schemas";
import { createSeason, updateSeason, closeSeason } from "@/actions/season";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Season = {
  id: number;
  name: string;
  start_date: Date;
  end_date: Date;
  status: SeasonStatus;
  champion_id: string | null;
  Champion: { name: string | null } | null;
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}

function toInputDate(date: Date) {
  return new Date(date).toISOString().split("T")[0];
}

function SeasonForm({
  defaultValues,
  onSubmit,
  onCancel,
  isPending,
}: {
  defaultValues: z.infer<typeof SeasonSchema>;
  onSubmit: (values: z.infer<typeof SeasonSchema>) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const form = useForm<z.infer<typeof SeasonSchema>>({
    resolver: zodResolver(SeasonSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-wrap gap-2 items-end">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="flex-1 min-w-32">
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Es. Stagione 2025" disabled={isPending} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem className="flex-1 min-w-32">
              <FormLabel>Inizio</FormLabel>
              <FormControl>
                <Input type="date" disabled={isPending} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="end_date"
          render={({ field }) => (
            <FormItem className="flex-1 min-w-32">
              <FormLabel>Fine</FormLabel>
              <FormControl>
                <Input type="date" disabled={isPending} {...field} />
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

export function SeasonsManager({ seasons }: { seasons: Season[] }) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = (values: z.infer<typeof SeasonSchema>) => {
    startTransition(async () => {
      const result = await createSeason(values);
      if (result.success) { toast.success(result.success); setShowCreate(false); }
      if (result.error) toast.error(result.error);
    });
  };

  const handleUpdate = (id: number, values: z.infer<typeof SeasonSchema>) => {
    startTransition(async () => {
      const result = await updateSeason(id, values);
      if (result.success) { toast.success(result.success); setEditingId(null); }
      if (result.error) toast.error(result.error);
    });
  };

  const handleClose = (id: number) => {
    startTransition(async () => {
      const result = await closeSeason(id);
      if (result.success) toast.success(result.success);
      if (result.error) toast.error(result.error);
    });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Stagioni</CardTitle>
        {!showCreate && (
          <Button size="sm" variant="outline" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nuova stagione
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showCreate && (
          <SeasonForm
            defaultValues={{ name: "", start_date: "", end_date: "" }}
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            isPending={isPending}
          />
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Periodo</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Campione</TableHead>
              <TableHead className="w-24 text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {seasons.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nessuna stagione creata
                </TableCell>
              </TableRow>
            )}
            {seasons.map((s) =>
              editingId === s.id ? (
                <TableRow key={s.id}>
                  <TableCell colSpan={5}>
                    <SeasonForm
                      defaultValues={{
                        name: s.name,
                        start_date: toInputDate(s.start_date),
                        end_date: toInputDate(s.end_date),
                      }}
                      onSubmit={(values) => handleUpdate(s.id, values)}
                      onCancel={() => setEditingId(null)}
                      isPending={isPending}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(s.start_date)} → {formatDate(s.end_date)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.status === "ACTIVE" ? "default" : "secondary"}>
                      {s.status === "ACTIVE" ? "Attiva" : "Chiusa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {s.Champion?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {s.status === "ACTIVE" && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={isPending}
                            onClick={() => setEditingId(s.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={isPending}
                            onClick={() => handleClose(s.id)}
                            title="Chiudi stagione"
                          >
                            <Lock className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
