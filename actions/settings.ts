"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";

import { update } from "@/auth";
import { db } from "@/lib/db";
import { SettingsSchema } from "@/schemas";
import { getUserByEmail, getUserById } from "@/data/user";
import { currentUser } from "@/lib/auth";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";

const NICKNAME_COOLDOWN_DAYS = 30;
const NICKNAME_COOLDOWN_MS = NICKNAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export const settings = async (
  values: z.infer<typeof SettingsSchema>
) => {
  const user = await currentUser();

  if (!user) {
    return { error: "Unauthorized" }
  }

  const dbUser = await getUserById(user.id!);

  if (!dbUser) {
    return { error: "Unauthorized" }
  }

  if (user.isOAuth) {
    values.email = undefined;
    values.password = undefined;
    values.newPassword = undefined;
    values.isTwoFactorEnabled = undefined;
  }

  if (values.email && values.email !== user.email) {
    const existingUser = await getUserByEmail(values.email);

    if (existingUser && existingUser.id !== user.id) {
      return { error: "Email already in use!" }
    }

    const verificationToken = await generateVerificationToken(
      values.email
    );
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token,
    );

    return { success: "Verification email sent!" };
  }

  if (values.password && values.newPassword && dbUser.password) {
    const passwordsMatch = await bcrypt.compare(
      values.password,
      dbUser.password,
    );

    if (!passwordsMatch) {
      return { error: "Incorrect password!" };
    }

    const hashedPassword = await bcrypt.hash(
      values.newPassword,
      10,
    );
    values.password = hashedPassword;
    values.newPassword = undefined;
  }

  // role changes are managed by admin only — strip it from self-service updates
  const { role: _role, ...safeValues } = values;

  let nicknameChangedAt: Date | undefined;
  if (typeof safeValues.nickname === "string" && safeValues.nickname !== dbUser.nickname) {
    if (dbUser.nicknameChangedAt) {
      const elapsed = Date.now() - dbUser.nicknameChangedAt.getTime();
      if (elapsed < NICKNAME_COOLDOWN_MS) {
        const daysLeft = Math.ceil((NICKNAME_COOLDOWN_MS - elapsed) / (24 * 60 * 60 * 1000));
        return { error: `Potrai cambiare soprannome tra ${daysLeft} giorni` };
      }
    }
    const taken = await db.user.findFirst({
      where: { nickname: safeValues.nickname, NOT: { id: dbUser.id } },
      select: { id: true },
    });
    if (taken) {
      return { error: "Soprannome già in uso" };
    }
    nicknameChangedAt = new Date();
  } else {
    delete safeValues.nickname;
  }

  const updatedUser = await db.user.update({
    where: { id: dbUser.id },
    data: { ...safeValues, ...(nicknameChangedAt ? { nicknameChangedAt } : {}) },
  });

  try {
    await update({
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        isTwoFactorEnabled: updatedUser.isTwoFactorEnabled,
        role: updatedUser.role,
        nickname: updatedUser.nickname,
        nicknameChangedAt: updatedUser.nicknameChangedAt
          ? updatedUser.nicknameChangedAt.toISOString()
          : null,
      }
    });
  }catch (error) {
    return { error: "Error updating user!" }
  }



  return { success: "Settings Updated!" }
}