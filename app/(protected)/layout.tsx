import { Navbar } from "@/app/(protected)/_components/navbar";
import { MobileNavbar } from "@/components/component/mobile-navbar";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex justify-center p-4 border-b border-border">
        <Navbar />
      </header>
      <main className="flex-1 flex flex-col items-center px-4 pb-20 pt-6">
        {children}
      </main>
      <MobileNavbar />
    </div>
  );
};

export default ProtectedLayout;
