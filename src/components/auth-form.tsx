"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@base-ui/react/input";
import { useMutation } from "@tanstack/react-query";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import type { HTMLInputTypeAttribute } from "react";

import { AppButton } from "@/components/app-button";
import { BrandLogo } from "@/components/brand-logo";
import { FcGoogle } from "react-icons/fc";
import { signIn, signUp } from "@/lib/auth-client";
import { loginFormSchema, signupFormSchema, type LoginFormValues, type SignupFormValues } from "@/lib/validations";

type AuthMode = "login" | "signup";

export function AuthForm({ mode }: { mode: AuthMode }) {
  return mode === "signup" ? <SignupAuthForm /> : <LoginAuthForm />;
}

function LoginAuthForm() {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });
  const mutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const result = await signIn.email({ email: values.email, password: values.password });

      if (result.error) {
        throw new Error(result.error.message || "Não foi possível autenticar.");
      }
    },
    onSuccess: () => {
      window.location.assign("/");
    },
  });

  const googleMutation = useMutation({
    mutationFn: async () => {
      const result = await signIn.social({
        provider: "google",
        callbackURL: "/",
      });
      if (result?.error) {
        throw new Error(result.error.message || "Não foi possível autenticar com o Google.");
      }
    },
  });

  return (
    <form className="glass-panel mx-auto flex w-full max-w-md flex-col gap-5 rounded-[2rem] p-6" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <div>
        <BrandLogo className="mb-5 h-13 w-[214px]" />
        <h1 className="mt-2 text-3xl font-black tracking-tight">Entrar</h1>
        <p className="mt-2 text-sm text-[#96a59b]">Acesse sua família financeira.</p>
      </div>

      <AuthInput disabled={mutation.isPending || googleMutation.isPending} error={form.formState.errors.email?.message} label="Email" registration={form.register("email")} type="email" />
      <AuthInput disabled={mutation.isPending || googleMutation.isPending} error={form.formState.errors.password?.message} label="Senha" registration={form.register("password")} type="password" />

      {mutation.error ? <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{mutation.error.message}</p> : null}
      {googleMutation.error ? <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{googleMutation.error.message}</p> : null}

      <AppButton className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40" disabled={mutation.isPending || googleMutation.isPending} type="submit">
        {mutation.isPending ? "Aguarde..." : "Entrar"}
      </AppButton>

      <div className="flex items-center my-1">
        <div className="h-px flex-1 bg-white/10" />
        <span className="px-3 text-sm text-[#96a59b] uppercase font-semibold">ou</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <AppButton
        className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-[#eefbf1] transition hover:bg-white/[0.08] flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={mutation.isPending || googleMutation.isPending}
        onClick={(e) => {
          e.preventDefault();
          googleMutation.mutate();
        }}
        type="button"
      >
        <FcGoogle className="h-5 w-5" />
        {googleMutation.isPending ? "Redirecionando..." : "Entrar com Google"}
      </AppButton>

      <p className="text-center text-sm text-[#96a59b]">
        Ainda não tem conta?{" "}
        <Link className="font-semibold text-primary hover:underline" href="/signup">
          Criar conta
        </Link>
      </p>
    </form>
  );
}

function SignupAuthForm() {
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const mutation = useMutation({
    mutationFn: async (values: SignupFormValues) => {
      const result = await signUp.email({ name: values.name, email: values.email, password: values.password });

      if (result.error) {
        throw new Error(result.error.message || "Não foi possível criar sua conta.");
      }
    },
    onSuccess: () => {
      window.location.assign("/");
    },
  });

  const googleMutation = useMutation({
    mutationFn: async () => {
      const result = await signIn.social({
        provider: "google",
        callbackURL: "/",
      });
      if (result?.error) {
        throw new Error(result.error.message || "Não foi possível autenticar com o Google.");
      }
    },
  });

  return (
    <form className="glass-panel mx-auto flex w-full max-w-md flex-col gap-5 rounded-[2rem] p-6" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <div>
        <BrandLogo className="mb-5 h-13 w-[214px]" />
        <h1 className="mt-2 text-3xl font-black tracking-tight">Criar sua família</h1>
        <p className="mt-2 text-sm text-[#96a59b]">Comece com 7 dias grátis e convide sua família depois.</p>
      </div>

      <AuthInput disabled={mutation.isPending || googleMutation.isPending} error={form.formState.errors.name?.message} label="Nome" registration={form.register("name")} />
      <AuthInput disabled={mutation.isPending || googleMutation.isPending} error={form.formState.errors.email?.message} label="Email" registration={form.register("email")} type="email" />
      <AuthInput disabled={mutation.isPending || googleMutation.isPending} error={form.formState.errors.password?.message} label="Senha" registration={form.register("password")} type="password" />

      {mutation.error ? <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{mutation.error.message}</p> : null}
      {googleMutation.error ? <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{googleMutation.error.message}</p> : null}

      <AppButton className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40" disabled={mutation.isPending || googleMutation.isPending} type="submit">
        {mutation.isPending ? "Aguarde..." : "Criar conta"}
      </AppButton>

      <div className="flex items-center my-1">
        <div className="h-px flex-1 bg-white/10" />
        <span className="px-3 text-sm text-[#96a59b] uppercase font-semibold">ou</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <AppButton
        className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-[#eefbf1] transition hover:bg-white/[0.08] flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={mutation.isPending || googleMutation.isPending}
        onClick={(e) => {
          e.preventDefault();
          googleMutation.mutate();
        }}
        type="button"
      >
        <FcGoogle className="h-5 w-5" />
        {googleMutation.isPending ? "Redirecionando..." : "Criar conta com Google"}
      </AppButton>

      <p className="text-center text-sm text-[#96a59b]">
        Já tem conta?{" "}
        <Link className="font-semibold text-primary hover:underline" href="/login">
          Entrar
        </Link>
      </p>
    </form>
  );
}

function AuthInput({
  disabled,
  error,
  label,
  registration,
  type = "text",
}: {
  disabled: boolean;
  error?: string;
  label: string;
  registration: UseFormRegisterReturn;
  type?: HTMLInputTypeAttribute;
}) {
  return (
    <label className="space-y-2 text-sm font-medium text-[#dbe8df]">
      <span>{label}</span>
      <Input
        {...registration}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[#eefbf1] outline-none transition placeholder:text-[#66736b] focus:border-primary/60 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        type={type}
      />
      {error ? <span className="block text-sm text-red-200">{error}</span> : null}
    </label>
  );
}
