import { installDomGlobals } from "../../helpers/domTestSetup.ts";
installDomGlobals();

// Same @testing-library/dom `document`-capture timing issue as
// PlexConfig.test.ts - every DOM-sensitive import must be deferred behind a
// dynamic import() so it evaluates after installDomGlobals() has run.
const { describe, it, afterEach } = await import("node:test");
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- typeof import() needed here since the DOM-timing workaround requires a dynamic import, not a static one
const assert: typeof import("node:assert/strict") = (
  await import("node:assert/strict")
).default;
const { render, cleanup, screen } = await import("@testing-library/preact");
const { userEvent } = await import("@testing-library/user-event");
const { html } = await import("../../../../src/client/util/html.ts");
const { Widget } = await import("../../../../src/client/components/Widget.ts");

describe("Widget", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the title and children", () => {
    render(
      html`<${Widget} title="My Widget">
        <p>widget body</p>
      <//>`,
    );

    screen.getByText("My Widget");
    screen.getByText("widget body");
  });

  it("defaults to closed when initiallyOpen is omitted", () => {
    render(
      html`<${Widget} title="My Widget">
        <p>widget body</p>
      <//>`,
    );

    const section = screen.getByText("My Widget").closest("section")!;
    assert.ok(!section.classList.contains("widget--open"));
  });

  it("renders open when initiallyOpen is true", () => {
    render(
      html`<${Widget} title="My Widget" initiallyOpen=${true}>
        <p>widget body</p>
      <//>`,
    );

    const section = screen.getByText("My Widget").closest("section")!;
    assert.ok(section.classList.contains("widget--open"));
  });

  it("clicking the title toggles open/closed", async () => {
    render(
      html`<${Widget} title="My Widget">
        <p>widget body</p>
      <//>`,
    );

    const section = screen.getByText("My Widget").closest("section")!;
    assert.ok(!section.classList.contains("widget--open"));

    const user = userEvent.setup();
    await user.click(screen.getByText("My Widget"));
    assert.ok(section.classList.contains("widget--open"));

    await user.click(screen.getByText("My Widget"));
    assert.ok(!section.classList.contains("widget--open"));
  });
});
