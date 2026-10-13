"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "./session";
import { chainNow, getMyCapsule, todayUsage, usdBalance, type Capsule } from "./tally";

export type AllowanceState = {
  loading: boolean;
  id?: bigint;
  capsule?: Capsule;
  spentToday: bigint;
  walletUsd: bigint;
  now: bigint;
  refresh: () => Promise<void>;
};

/** The signed-in owner's latest allowance, plus loose AUSD not yet loaded into it. */
export function useAllowance(): AllowanceState {
  const { keys } = useSession();
  const [s, setS] = useState<Omit<AllowanceState, "refresh">>({ loading: true, spentToday: 0n, walletUsd: 0n, now: 0n });

  const refresh = useCallback(async () => {
    if (!keys) return;
    const [mine, walletUsd, now] = await Promise.all([getMyCapsule(keys.owner.address), usdBalance(keys.owner.address), chainNow()]);
    setS({
      loading: false,
      id: mine?.id,
      capsule: mine?.c,
      spentToday: mine ? todayUsage(mine.c, now) : 0n,
      walletUsd,
      now,
    });
  }, [keys]);

  useEffect(() => {
    refresh().catch(() => setS((p) => ({ ...p, loading: false })));
    const t = setInterval(() => refresh().catch(() => {}), 8000);
    return () => clearInterval(t);
  }, [refresh]);

  return { ...s, refresh };
}
