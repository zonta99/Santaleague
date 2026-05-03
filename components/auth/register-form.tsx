"use client";

import * as z from "zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Mail } from "lucide-react";

import { RegisterSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CardWrapper } from "@/components/auth/card-wrapper"
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { register } from "@/actions/register";

export const RegisterForm = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const loginHref = callbackUrl
    ? `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/auth/login";

  const [error, setError] = useState<string | undefined>("");
  const [registeredEmail, setRegisteredEmail] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { email: "", password: "", name: "" },
  });

  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    setError("");
    startTransition(() => {
      register(values).then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setRegisteredEmail(values.email);
        }
      });
    });
  };

  if (registeredEmail) {
    return (
      <CardWrapper
        headerLabel="Check your inbox"
        backButtonLabel="Back to login"
        backButtonHref={loginHref}
        showSocial={false}
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Verification email sent</p>
            <p className="text-xs text-muted-foreground">
              We sent a confirmation link to{" "}
              <span className="font-medium text-foreground">{registeredEmail}</span>.
              Click the link in the email to activate your account.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Already verified?{" "}
            <Link href={loginHref} className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper
      headerLabel="Create an account"
      backButtonLabel="Already have an account? Sign in"
      backButtonHref={loginHref}
      showSocial
      socialMode="register"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isPending} placeholder="John Doe" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isPending} placeholder="john.doe@example.com" type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isPending} placeholder="••••••••" type="password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormError message={error} />
          <Button disabled={isPending} type="submit" className="w-full">
            Create an account
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};
