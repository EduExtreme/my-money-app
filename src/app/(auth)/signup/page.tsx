import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { getCurrentFamily } from "@/lib/auth-session";

export default async function SignupPage() {
  const family = await getCurrentFamily();

  if (family) {
    redirect("/");
  }

  return <AuthForm mode="signup" />;
}
