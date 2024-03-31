import { db } from "@/lib/db";
import {User} from "@prisma/client";

export const getUserByEmail = async (email: string) => {
  try {
    const user = await db.user.findUnique({ where: { email } });

    return user;
  } catch {
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({ where: { id } });

    return user;
  } catch {
    return null;
  }
};

export const createUser = async ( data: User) => {
  try {
    const user = await db.user.create({ data });

    return user;
  } catch {
    return null;
  }
};



