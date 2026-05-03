"use client";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

interface SocialProps {
  mode?: "login" | "register";
}

export const Social = ({ mode = "login" }: SocialProps) => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const onClick = (provider: "google" | "github") => {
    signIn(provider, {
      callbackUrl: callbackUrl || DEFAULT_LOGIN_REDIRECT,
    });
  };

  const verb = mode === "register" ? "Sign up" : "Continue";

  return (
    <div className="flex flex-col w-full gap-2">
      <Button
        size="lg"
        variant="outline"
        className="w-full gap-2"
        onClick={() => onClick("google")}
      >
        <FcGoogle className="h-4 w-4" />
        {verb} with Google
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="w-full gap-2"
        onClick={() => onClick("github")}
      >
        <FaGithub className="h-4 w-4" />
        {verb} with GitHub
      </Button>
    </div>
  );
};
