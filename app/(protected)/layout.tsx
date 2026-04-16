
import {MobileNavbar} from "@/components/component/mobile-navbar";

interface ProtectedLayoutProps {
  children: React.ReactNode;
};

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  return ( 
    <div className="overflow-hidden h-screen w-screen flex flex-col gap-y-10 items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400 to-blue-800">
      {children}
        <MobileNavbar/>
    </div>
   );
}
 
export default ProtectedLayout;