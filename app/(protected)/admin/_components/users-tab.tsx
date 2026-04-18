import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { UsersTable } from "../users/_components/users-table";

export async function UsersTab() {
  const [me, users] = await Promise.all([
    currentUser(),
    db.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true, emailVerified: true },
    }),
  ]);

  return <UsersTable users={users} currentUserId={me?.id ?? ""} />;
}
