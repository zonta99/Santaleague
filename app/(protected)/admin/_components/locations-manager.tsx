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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Location = { id: number; name: string; description: string | null; _count?: { Match: number } };

interface Props {
  locations: Location[];
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

export function LocationsManager({ locations }: Props) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = (values: z.infer<typeof LocationSchema>) => {
    startTransition(async () => {
      const result = await createLocation(values);
      if (result.success) { toast.success(result.success); setShowCreate(false); }
      if (result.error) toast.error(result.error);
    });
  };

  const handleUpdate = (id: number, values: z.infer<typeof LocationSchema>) => {
    startTransition(async () => {
      const result = await updateLocation(id, values);
      if (result.success) { toast.success(result.success); setEditingId(null); }
      if (result.error) toast.error(result.error);
    });
  };

  const handleDelete = (id: number) => {
    startTransition(async () => {
      const result = await deleteLocation(id);
      if (result.success) toast.success(result.success);
      if (result.error) toast.error(result.error);
    });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Campi da gioco</CardTitle>
        {!showCreate && (
          <Button size="sm" variant="outline" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> Aggiungi
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showCreate && (
          <LocationForm
            defaultValues={{ name: "", description: "" }}
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            isPending={isPending}
          />
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead className="w-20 text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Nessun campo registrato
                </TableCell>
              </TableRow>
            )}
            {locations.map((loc) =>
              editingId === loc.id ? (
                <TableRow key={loc.id}>
                  <TableCell colSpan={3}>
                    <LocationForm
                      defaultValues={{ name: loc.name, description: loc.description ?? "" }}
                      onSubmit={(values) => handleUpdate(loc.id, values)}
                      onCancel={() => setEditingId(null)}
                      isPending={isPending}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={loc.id}>
                  <TableCell className="font-medium">{loc.name}</TableCell>
                  <TableCell className="text-muted-foreground">{loc.description ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => setEditingId(loc.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => handleDelete(loc.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
