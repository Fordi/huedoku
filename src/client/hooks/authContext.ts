// current user's context
import { createContext, type VNode } from "preact";
import { useContext, useEffect, useState } from "preact/hooks";
import { ApiError, apiGet, apiPost } from "../util/api.ts";
import { html } from "../util/html.ts";

export type Me = {
  id: number;
  github_login: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  auth_method: "session" | "token";
};

export type AuthStatus = {
  me?: Me;
  error?: string | undefined;
  logout: () => Promise<void>;
};

// No default value - every consumer renders inside App.ts's <MeContext.Provider>,
// which only mounts its children once `me` has resolved to a real, logged-in
// Me (see App.ts's `me === undefined`/`me === null` early returns), so a
// consumer reading this context always gets a real Me, never null/undefined.
export const MeContext = createContext<AuthStatus>({
  async logout() {
    await apiPost("auth/logout");
  },
});

export function AuthProvider({ children }: { children: VNode }) {
  const [me, setMe] = useState<Me | undefined | null>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    apiGet<Me>("auth/me")
      .then(setMe)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setMe(null);
          return;
        }
        setError(err instanceof Error ? err.message : String(err));
      });
  }, []);
  return html`<${MeContext.Provider} value=${{
    me,
    error,
    async logout() {
      await apiPost("auth/logout");
      setMe(null);
    },
  }}>${children}</>`;
}

/** The current signed-in user. Throws if used outside MeContext.Provider (i.e. outside App.ts's authenticated render tree) - a programming mistake, not a runtime state to handle gracefully. */
export function useMe(): Me {
  const auth = useContext(MeContext);
  if (!auth.me)
    throw new Error(
      "useMe() called outside <MeContext.Provider> - must be rendered within the authenticated dashboard tree",
    );
  return auth.me;
}

// For consumers situated outside the authenticated area
export function useAuthStatus(): AuthStatus {
  return useContext(MeContext);
}
