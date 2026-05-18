"use server";

import { cookies } from "next/headers";
import { signOut } from "@/auth";

export const logout = async () => {
  (await cookies()).delete("active-league");
  await signOut({ redirectTo: "/auth/login" });
};
