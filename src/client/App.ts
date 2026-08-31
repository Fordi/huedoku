// root dashboard component
import { useEffect, useState } from "preact/hooks";
import { html } from "./util/html.ts";
import { useAuthStatus } from "./hooks/authContext.ts";
import { Widget } from "./components/Widget.ts";
import { LoginPage } from "./components/LoginPage.ts";
import { Header } from "./components/Header.ts";

export default function App(_props: Record<string, never>) {
  const authStatus = useAuthStatus();
  const [loadError, setLoadError] = useState<string | undefined>(authStatus.error);

  useEffect(() => {
    if (!authStatus.me) {
      if (authStatus.error) {
        setLoadError(authStatus.error);
      }
      return;
    }
  }, [
    authStatus.me,
    authStatus.error,
  ]);

  if (authStatus.me === undefined) return html`<p class="loading">Loading…</p>`;
  if (authStatus.me === null) return html`<${LoginPage} />`;

  return html`
    <div class="dashboard">
      <${Header} me=${authStatus.me} onLogout=${authStatus.logout} />
      ${loadError ? html`<p class="error">${loadError}</p>` : null}
      <main class="widgets">
        <${Widget} title="Hello, world" initiallyOpen=${true}>
          Place your first widget in here.
        </>
        ${
          authStatus.me.role === "admin"
            ? html`

          <${Widget} title="Hello, admin ${authStatus.me.display_name}">
            This widget is visible to you because you are an admin.
          </>
        `
            : null
        }
      </main>
    </div>
  `;
}
