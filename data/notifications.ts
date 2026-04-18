import { db } from "@/lib/db";

export const getNotifications = async (userId: string) => {
  return db.notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    take: 50,
  });
};

export const getUnreadCount = async (userId: string) => {
  return db.notification.count({ where: { user_id: userId, read: false } });
};

export const getNotificationPreferences = async (userId: string) => {
  return db.notificationPreferences.findUnique({ where: { user_id: userId } });
};
