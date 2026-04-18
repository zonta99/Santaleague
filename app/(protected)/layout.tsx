import { Navbar } from "@/app/(protected)/_components/navbar";
import { MobileNavbar } from "@/components/component/mobile-navbar";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="hidden md:flex justify-center border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <Navbar />
      </header>
      <main className="flex-1 flex flex-col items-center px-4 pb-20 md:pb-6 pt-6">
        {children}
      </main>
      <MobileNavbar />
    </div>
  );
};

export default ProtectedLayout;
