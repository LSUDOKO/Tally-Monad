"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useSession } from "@/lib/session";

/** Keys live only in memory, so a reload returns to the Face ID screen. */
export function RequireSession({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "signed-out") router.replace("/");
  }, [status, router]);
  return status === "signed-in" ? <>{children}</> : null;
}
