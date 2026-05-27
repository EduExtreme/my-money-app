"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { AppButton } from "@/components/app-button";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: async () => {
      const result = await signOut();

      if (result.error) {
        throw new Error(result.error.message || "Não foi possível sair.");
      }
    },
    onSuccess: () => {
      router.push("/login");
      router.refresh();
    },
  });

  return (
    <AppButton
      className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[#dbe8df] transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      disabled={mutation.isPending}
      type="button"
      onClick={() => mutation.mutate()}
    >
      Sair
    </AppButton>
  );
}
