import { RoleGate } from "@/components/auth/role-gate";
import { UserRole } from "@prisma/client";
import { getAllLocations } from "@/data/location";
import { CreateMatchForm } from "./_components/create-match-form";
import { LocationsManager } from "./_components/locations-manager";

const AdminPage = async () => {
  const locations = await getAllLocations();

  return (
    <div className="w-full max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold">Admin</h1>
      <RoleGate allowedRole={UserRole.ADMIN}>
        <div className="space-y-8">
          <LocationsManager locations={locations} />
          <CreateMatchForm locations={locations} />
        </div>
      </RoleGate>
    </div>
  );
};

export default AdminPage;
