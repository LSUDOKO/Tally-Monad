"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { friendlyMeraError, hasSavedPasskey, signIn as meraSignIn, signUp as meraSignUp, type Keys } from "./mera";

type Status = "signed-out" | "working" | "signed-in";

type Session = {
  status: Status;
  keys?: Keys;
  error?: string;
  welcomeUsd?: number;
  returning: boolean;
  signUp: (name: string) => Promise<boolean>;
  signIn: () => Promise<boolean>;
  signOut: () => void;
  retryWelcome: () => void;
};

const Ctx = createContext<Session | null>(null);

async function welcome(keys: Keys): Promise<number> {
  const r = await fetch("/api/onboard", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ owner: keys.owner.address, agent: keys.agent.address }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? "Could not add your welcome credit.");
  return j.welcomeUsd ?? 0;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("signed-out");
  const [keys, setKeys] = useState<Keys>();
  const [error, setError] = useState<string>();
  const [welcomeUsd, setWelcomeUsd] = useState<number>();
  const [returning, setReturning] = useState(false);

  useEffect(() => setReturning(hasSavedPasskey()), []);

  const run = useCallback(async (fn: () => Promise<Keys>) => {
    setStatus("working");
    setError(undefined);
    try {
      const k = await fn();
      setKeys(k);
      setStatus("signed-in");
      welcome(k).then(setWelcomeUsd, (e) => setError(e.message));
      return true;
    } catch (e) {
      setError(friendlyMeraError(e));
      setStatus("signed-out");
      return false;
    }
  }, []);

  const signOut = useCallback(() => {
    keys?.end();
    setKeys(undefined);
    setStatus("signed-out");
  }, [keys]);

  return (
    <Ctx.Provider
      value={{
        status,
        keys,
        error,
        welcomeUsd,
        returning,
        signUp: (name) => run(() => meraSignUp(name)),
        signIn: () => run(meraSignIn),
        signOut,
        retryWelcome: () => {
          if (!keys) return;
          setError(undefined);
          welcome(keys).then(setWelcomeUsd, (e) => setError(e.message));
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSession(): Session {
  const s = useContext(Ctx);
  if (!s) throw new Error("useSession outside SessionProvider");
  return s;
}
