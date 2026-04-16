"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/auth/header";
import { Social } from "@/components/auth/social";
import { BackButton } from "@/components/auth/back-button";

interface CardWrapperProps {
  children: React.ReactNode;
  headerLabel: string;
  backButtonLabel: string;
  backButtonHref: string;
  showSocial?: boolean;
}

export const CardWrapper = ({
  children,
  headerLabel,
  backButtonLabel,
  backButtonHref,
  showSocial,
}: CardWrapperProps) => {
  return (
    <Card className="w-[420px] shadow-2xl shadow-black/60 border-border">
      <CardHeader>
        <Header label={headerLabel} />
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        {showSocial && (
          <>
            <div className="flex items-center gap-3 pt-2">
              <Separator className="flex-1" />
              <span className="text-muted-foreground text-xs tracking-widest uppercase">or</span>
              <Separator className="flex-1" />
            </div>
            <Social />
          </>
        )}
      </CardContent>
      <CardFooter>
        <BackButton label={backButtonLabel} href={backButtonHref} />
      </CardFooter>
    </Card>
  );
};
