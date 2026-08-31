// dashboard widget wrapper
import type { VNode } from "preact";
import { html } from "../util/html.ts";
import { useState } from "preact/hooks";

export function Widget(props: {
  title?: string;
  initiallyOpen?: boolean;
  children: VNode;
}) {
  const [isOpen, setIsOpen] = useState(props.initiallyOpen);
  const toggle = () => {
    setIsOpen((open) => !open);
  };
  return html`
    <section
      class=${["widget", isOpen ? "widget--open" : ""].filter((a) => a).join(" ")}
    >
      <h2 onClick=${toggle}>${props.title}</h2>
      <div class="widget-content">
        <div class="widget-content-height">${props.children}</div>
      </div>
    </section>
  `;
}
