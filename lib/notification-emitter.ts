import { EventEmitter } from "events";
import { Notification } from "@prisma/client";

class NotificationEmitter extends EventEmitter {}

// Singleton — shared across all requests in the same Node.js process
const globalForEmitter = globalThis as unknown as { notificationEmitter?: NotificationEmitter };

export const notificationEmitter =
  globalForEmitter.notificationEmitter ?? new NotificationEmitter();

if (process.env.NODE_ENV !== "production") {
  globalForEmitter.notificationEmitter = notificationEmitter;
}

export function emitForUser(userId: string, notifications: Notification[]) {
  notificationEmitter.emit(`notification:${userId}`, notifications);
}
