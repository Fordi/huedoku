// consistent form field
import { html } from "../util/html.ts";
import type { ComponentChildren } from "preact";

/**
 * Consistent, easily-styled wrapper for a single form field: a label, the
 * control itself (passed as children - Field doesn't know or care what kind
 * of control it is), and optional hint/error text. Every part gets its own
 * stable class so a stylesheet can target label/control/hint/error uniformly
 * across every form in the app, instead of each widget hand-rolling its own
 * <label>...<input/></label> markup with no shared hooks.
 *
 * Structure (label-above-control, the default):
 *   <div class="field [field--invalid]">
 *     <label class="field-label">{label} <span class="field-required">*</span></label>
 *     <div class="field-control">{children}</div>
 *     <p class="field-hint">{hint}</p>
 *     <p class="field-error">{error}</p>
 *   </div>
 *
 * Structure (inline=true, label-after-control):
 *   <div class="field field--inline [field--invalid]">
 *     <label class="field-label field-label--inline">
 *       <div class="field-control">{children}</div>
 *       {label} <span class="field-required">*</span>
 *     </label>
 *     <p class="field-hint">{hint}</p>
 *     <p class="field-error">{error}</p>
 *   </div>
 *
 * `inline` is for checkbox-style fields, where "[ ] Required" reads more
 * naturally than a label sitting on its own line above a lone checkbox.
 */
export default function Field(props: {
  label: ComponentChildren;
  required?: boolean;
  hint?: ComponentChildren;
  error?: ComponentChildren;
  inline?: boolean;
  children: ComponentChildren;
}) {
  const requiredMark = props.required
    ? html`<span class="field-required"> *</span>`
    : null;

  return html`
    <div
      class="field${props.inline ? " field--inline" : ""}${props.error ? " field--invalid" : ""}"
    >
      ${
        props.inline
          ? html`
              <label class="field-label field-label--inline">
                <div class="field-control">${props.children}</div>
                ${props.label}${requiredMark}
              </label>
            `
          : html`
              <label class="field-label">${props.label}${requiredMark}</label>
              <div class="field-control">${props.children}</div>
            `
      }
      ${props.hint ? html`<p class="field-hint">${props.hint}</p>` : null}
      ${props.error ? html`<p class="field-error">${props.error}</p>` : null}
    </div>
  `;
}
