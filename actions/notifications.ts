"use server";

import * as z from "zod";
import { NotificationType } from "@prisma/client";

import { db } from "@/lib/db";
import { currentUser, currentRole } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { sendNotificationEmail } from "@/lib/mail";
import { NotificationPreferencesSchema } from "@/schemas";

const notificationTypeToPreferenceKey: Record<NotificationType, keyof typeof prefFields> = {
  MATCH_SCHEDULED: "match_scheduled",
  MATCH_STARTED: "match_started",
  DRAFT_PICKED: "draft_picked",
  MATCH_COMPLETED: "match_completed",
  ADMIN_ANNOUNCEMENT: "admin_announcement",
};

const prefFields = {
  match_scheduled: true,
  match_started: true,
  draft_picked: true,
  match_completed: true,
  admin_announcement: true,
};

export async function createNotificationsForUsers(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  metadata?: object
) {
  if (userIds.length === 0) return;

  const prefKey = notificationTypeToPreferenceKey[type];

  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      email: true,
      NotificationPreferences: true,
    },
  });

  const eligibleUserIds: string[] = [];
  const emailRecipients: string[] = [];

  for (const user of users) {
    const prefs = user.NotificationPreferences;
    // If no prefs row yet, all notifications are enabled by default
    const prefEnabled = prefs ? prefs[prefKey] : true;
    if (!prefEnabled) continue;

    eligibleUserIds.push(user.id);

    const emailEnabled = prefs ? prefs.email_enabled : true;
    if (emailEnabled && user.email) {
      emailRecipients.push(user.email);
    }
  }

  if (eligibleUserIds.length > 0) {
    await db.notification.createMany({
      data: eligibleUserIds.map((userId) => ({
        user_id: userId,
        type,
        title,
        message,
        metadata: metadata ?? undefined,
      })),
    });
  }

  await Promise.allSettled(
    emailRecipients.map((email) => sendNotificationEmail(email, title, message))
  );
}

export async function markNotificationRead(id: string) {
  const user = await currentUser();
  if (!user?.id) return { error: "Non autenticato" };

  await db.notification.updateMany({
    where: { id, user_id: user.id },
    data: { read: true },
  });

  return { success: true };
}

export async function markAllRead() {
  const user = await currentUser();
  if (!user?.id) return { error: "Non autenticato" };

  await db.notification.updateMany({
    where: { user_id: user.id, read: false },
    data: { read: true },
  });

  return { success: true };
}

export async function updateNotificationPreferences(
  values: z.infer<typeof NotificationPreferencesSchema>
) {
  const user = await currentUser();
  if (!user?.id) return { error: "Non autenticato" };

  const parsed = NotificationPreferencesSchema.safeParse(values);
  if (!parsed.success) return { error: "Dati non validi" };

  await db.notificationPreferences.upsert({
    where: { user_id: user.id },
    create: { user_id: user.id, ...parsed.data },
    update: parsed.data,
  });

  return { success: "Preferenze salvate" };
}

export async function sendAdminAnnouncement(title: string, message: string) {
  const role = await currentRole();
  if (!hasPermission(role, "manageUsers")) return { error: "Non autorizzato" };

  if (!title.trim() || !message.trim()) return { error: "Titolo e messaggio obbligatori" };

  const allUsers = await db.user.findMany({ select: { id: true } });
  await createNotificationsForUsers(
    allUsers.map((u) => u.id),
    "ADMIN_ANNOUNCEMENT",
    title,
    message
  );

  return { success: "Annuncio inviato" };
}
