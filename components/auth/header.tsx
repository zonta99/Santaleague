import { Bebas_Neue } from "next/font/google";
import { cn } from "@/lib/utils";

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
});

interface HeaderProps {
  label: string;
}

export const Header = ({ label }: HeaderProps) => {
  return (
    <div className="w-full flex flex-col items-center gap-y-3">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-8 bg-primary rounded-sm" />
        <h1 className={cn("text-5xl tracking-widest text-foreground leading-none", bebasNeue.className)}>
          SANTALEAGUE
        </h1>
      </div>
      <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase font-medium">
        {label}
      </p>
    </div>
  );
};
