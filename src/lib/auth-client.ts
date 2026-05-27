"use client";

import { dashClient } from "@better-auth/infra/client";
import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [organizationClient(), dashClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
