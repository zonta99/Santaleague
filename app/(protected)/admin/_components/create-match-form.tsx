"use client";

import * as z from "zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { CreateMatchSchema } from "@/schemas";
import { createMatch } from "@/actions/match";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Location = { id: number; name: string };

interface Props {
  locations: Location[];
}

export function CreateMatchForm({ locations }: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof CreateMatchSchema>>({
    resolver: zodResolver(CreateMatchSchema),
    defaultValues: {
      date: "",
      location_id: 0,
      match_type: "normal",
      num_games: 1,
      num_teams: 2,
      players_per_team: 5,
    },
  });

  const onSubmit = (values: z.infer<typeof CreateMatchSchema>) => {
    startTransition(async () => {
      const result = await createMatch(values);
      if (result.success) {
        toast.success(result.success);
        form.reset();
      }
      if (result.error) toast.error(result.error);
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Crea partita</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campo</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={field.value ? String(field.value) : ""}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un campo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locations.length === 0 && (
                        <SelectItem value="0" disabled>
                          Nessun campo disponibile
                        </SelectItem>
                      )}
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={String(loc.id)}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="match_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="normal">Normale</SelectItem>
                      <SelectItem value="torneo">Torneo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="num_games"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numero di game</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={10} disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="num_teams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Squadre</FormLabel>
                    <FormControl>
                      <Input type="number" min={2} max={6} disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="players_per_team"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giocatori per squadra</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={15} disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              Crea partita
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
