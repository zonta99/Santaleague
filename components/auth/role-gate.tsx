"use client";

import { UserRole } from "@prisma/client";

import { useCurrentRole } from "@/hooks/use-current-role";
import { FormError } from "@/components/form-error";

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
};

export const RoleGate = ({
  children,
  allowedRoles,
}: RoleGateProps) => {
  const role = useCurrentRole();

  if (!role || !allowedRoles.includes(role)) {
    return (
      <FormError message="You do not have permission to view this content!" />
    )
  }

  return (
    <>
      {children}
    </>
  );
};
