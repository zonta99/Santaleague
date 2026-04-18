import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentRole, currentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { UsersTable } from "./_components/users-table";

const AdminUsersPage = async () => {
  const role = await currentRole();
  if (role !== UserRole.ADMIN) redirect("/admin");

  const me = await currentUser();
  const users = await db.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true, emailVerified: true },
  });

  return (
    <div className="w-full max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Gestione Utenti</h1>
      <UsersTable users={users} currentUserId={me?.id ?? ""} />
    </div>
  );
};

export default AdminUsersPage;
