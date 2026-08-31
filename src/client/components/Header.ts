// dashboard page header
import type { Me } from "../hooks/authContext.ts";
import { html } from "../util/html.ts";

export function Header(props: { me: Me; onLogout: () => void }) {
  return html`
    <header class="dashboard-header">
      <h1>My App</h1>
      <div class="whoami">
        ${props.me.avatar_url ? html`<img class="avatar" src=${props.me.avatar_url} alt="" />` : null}
        <span>${props.me.display_name ?? props.me.github_login}</span>
        <span class="role-badge">${props.me.role}</span>
        <button type="button" onClick=${props.onLogout}>Log out</button>
      </div>
    </header>
  `;
}
