// Client entrypoint
import { render } from "preact";
import { html } from "./util/html.ts";
import App from "./App.ts";

const rootElement = document.querySelector("div#root");
if (rootElement) {
  render(html`<${App} />`, rootElement);
}
