"use client";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

export const Social = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const onClick = (provider: "google" | "github") => {
    signIn(provider, {
      callbackUrl: callbackUrl || DEFAULT_LOGIN_REDIRECT,
    });
  };

  return (
    <div className="flex items-center w-full gap-x-3">
      <Button
        size="lg"
        variant="outline"
        className="flex-1 gap-2"
        onClick={() => onClick("google")}
      >
        <FcGoogle className="h-4 w-4" />
        Google
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="flex-1 gap-2"
        onClick={() => onClick("github")}
      >
        <FaGithub className="h-4 w-4" />
        GitHub
      </Button>
    </div>
  );
};
