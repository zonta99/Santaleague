"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

import { Switch } from "@/components/ui/switch";
import { SettingsSchema, NotificationPreferencesSchema } from "@/schemas";
import {
  Card,
  CardHeader,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { settings } from "@/actions/settings";
import { updateNotificationPreferences } from "@/actions/notifications";
import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/hooks/use-current-user";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@prisma/client";

type NotifPrefs = z.infer<typeof NotificationPreferencesSchema>;

const SettingsPage = () => {
  const user = useCurrentUser();

  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();

  const defaultPrefs: NotifPrefs = {
    match_scheduled: true,
    match_started: true,
    draft_picked: true,
    match_completed: true,
    admin_announcement: true,
    email_enabled: true,
  };
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(defaultPrefs);
  const [prefsPending, startPrefTransition] = useTransition();

  useEffect(() => {
    fetch("/api/notifications/preferences")
      .then((r) => r.json())
      .then((data) => { if (data) setNotifPrefs(data); })
      .catch(() => {});
  }, []);

  const togglePref = (key: keyof NotifPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    startPrefTransition(() => {
      updateNotificationPreferences(updated).catch(() => {});
    });
  };

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      password: undefined,
      newPassword: undefined,
      name: user?.name || undefined,
      email: user?.email || undefined,
isTwoFactorEnabled: user?.isTwoFactorEnabled || undefined,
    }
  });

  const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
    startTransition(() => {
      settings(values)
        .then((data) => {
          if (data.error) {
            setError(data.error);
          }

          if (data.success) {
            update();
            setSuccess(data.success);
          }
        })
        .catch(() => setError("Something went wrong!"));
    });
  }

  const notifItems: { key: keyof NotifPrefs; label: string; description: string }[] = [
    { key: "match_scheduled", label: "Partita programmata", description: "Quando viene creata una nuova partita" },
    { key: "match_started", label: "Partita iniziata", description: "Quando una partita a cui partecipi inizia" },
    { key: "draft_picked", label: "Draft completato", description: "Quando vieni assegnato a una squadra" },
    { key: "match_completed", label: "Partita completata", description: "Quando una partita termina e si aprono le valutazioni" },
    { key: "admin_announcement", label: "Annunci admin", description: "Comunicazioni dalla lega" },
    { key: "email_enabled", label: "Notifiche via email", description: "Ricevi le notifiche anche via email" },
  ];

  return (
    <div className="w-full max-w-[600px] space-y-6">
    <Card>
      <CardHeader>
        <p className="text-2xl font-semibold text-center">
          ⚙️ Settings
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form 
            className="space-y-6" 
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="John Doe"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {user?.isOAuth === false && (
                <>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="john.doe@example.com"
                            type="email"
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="******"
                            type="password"
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="******"
                            type="password"
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <span className="text-sm font-medium">Role</span>
                <Badge
                  variant={
                    user?.role === UserRole.ADMIN
                      ? "destructive"
                      : user?.role === UserRole.MODERATOR
                      ? "secondary"
                      : "outline"
                  }
                >
                  {user?.role}
                </Badge>
              </div>
              {user?.isOAuth === false && (
                <FormField
                  control={form.control}
                  name="isTwoFactorEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Two Factor Authentication</FormLabel>
                        <FormDescription>
                          Enable two factor authentication for your account
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          disabled={isPending}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>
            <FormError message={error} />
            <FormSuccess message={success} />
            <Button
              disabled={isPending}
              type="submit"
            >
              Save
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
      <Card>
        <CardHeader>
          <p className="text-2xl font-semibold text-center">🔔 Notifiche</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifItems.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <Switch
                disabled={prefsPending}
                checked={notifPrefs[key]}
                onCheckedChange={() => togglePref(key)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
   );
}

export default SettingsPage;