// "Log in with GitHub"
import { html } from "../util/html.ts";

export function LoginPage() {
  return html`
    <div class="login-prompt">
      <h1>My App</h1>
      <a class="button" href="./auth/github">Log in with GitHub</a>
    </div>
  `;
}
