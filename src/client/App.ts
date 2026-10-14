// root component
import { html } from "./util/html.ts";
import { Header } from "./components/Header.ts";
import { Huedoku } from "./components/Huedoku.ts";

export default function App(_props: Record<string, never>) {
  return html`
    <div class="app">
      <${Header} />
      <main>
        <${Huedoku} />
      </main>
    </div>
  `;
}
