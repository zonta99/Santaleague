"use client";

import { useState, useTransition } from "react";
import { UserRole } from "@prisma/client";
import { updateUserRole } from "@/actions/admin-users";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  emailVerified: Date | null;
};

interface UsersTableProps {
  users: User[];
  currentUserId: string;
}

const roleBadgeVariant: Record<UserRole, "destructive" | "secondary" | "outline"> = {
  ADMIN: "destructive",
  MODERATOR: "secondary",
  USER: "outline",
};

export const UsersTable = ({ users, currentUserId }: UsersTableProps) => {
  const [pending, startTransition] = useTransition();
  const [optimisticRoles, setOptimisticRoles] = useState<Record<string, UserRole>>({});

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setOptimisticRoles((prev) => ({ ...prev, [userId]: newRole }));
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if (result.error) {
        setOptimisticRoles((prev) => {
          const copy = { ...prev };
          delete copy[userId];
          return copy;
        });
        toast.error(result.error);
      } else {
        toast.success(result.success);
      }
    });
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Ruolo</TableHead>
          <TableHead>Verificato</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          const role = optimisticRoles[user.id] ?? user.role;
          const isSelf = user.id === currentUserId;
          return (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{user.email ?? "—"}</TableCell>
              <TableCell>
                {isSelf ? (
                  <Badge variant={roleBadgeVariant[role]}>{role}</Badge>
                ) : (
                  <Select
                    value={role}
                    onValueChange={(v) => handleRoleChange(user.id, v as UserRole)}
                    disabled={pending}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(UserRole).map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {user.emailVerified ? user.emailVerified.toLocaleDateString("it-IT") : "No"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
