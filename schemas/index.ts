import * as z from "zod";
import { UserRole } from "@prisma/client";

export const SettingsSchema = z.object({
  name: z.optional(z.string()),
  isTwoFactorEnabled: z.optional(z.boolean()),
  role: z.enum([UserRole.ADMIN, UserRole.USER]),
  email: z.optional(z.string().email()),
  password: z.optional(z.string().min(6)),
  newPassword: z.optional(z.string().min(6)),
})
  .refine((data) => {
    if (data.password && !data.newPassword) {
      return false;
    }

    return true;
  }, {
    message: "New password is required!",
    path: ["newPassword"]
  })
  .refine((data) => {
    if (data.newPassword && !data.password) {
      return false;
    }

    return true;
  }, {
    message: "Password is required!",
    path: ["password"]
  })

export const NewPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Minimum of 6 characters required",
  }),
});

export const ResetSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
});

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
  code: z.optional(z.string()),
});

export const LocationSchema = z.object({
  name: z.string().min(1, { message: "Nome obbligatorio" }),
  description: z.optional(z.string()),
});

export const CreateMatchSchema = z.object({
  date: z.string().min(1, { message: "Data obbligatoria" }),
  location_id: z.coerce.number().min(1, { message: "Campo obbligatorio" }),
  match_type: z.enum(["normal", "torneo"]),
  num_games: z.coerce.number().min(1).max(10),
});

export const GameDetailSchema = z.object({
  game_id: z.number(),
  match_id: z.number(),
  event_type: z.enum(["Goal", "Assist", "Penalty", "YellowCard", "RedCard", "Substitution"]),
  player_id: z.string().min(1, { message: "Seleziona un giocatore" }),
  team_id: z.number({ required_error: "Seleziona una squadra" }),
  minute: z.coerce.number().min(1).max(120).optional(),
});

export const RegisterSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(6, {
    message: "Minimum 6 characters required",
  }),
  name: z.string().min(1, {
    message: "Name is required",
  }),
});
