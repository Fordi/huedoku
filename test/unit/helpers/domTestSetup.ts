import { Window } from "happy-dom";

/**
 * Installs a happy-dom Window as this test file's global DOM (document,
 * window, navigator, etc.) - needed for anything that renders a Preact
 * component (@testing-library/preact's render()/renderHook() ultimately
 * call preact's own render(), which requires a real container node to
 * attach to). Node's test runner isolates each test file's module scope
 * (confirmed empirically - see the commit that added this), so this only
 * ever affects the file that imports it, never leaking into server-side
 * tests that share the same `npm test` invocation.
 *
 * Call once, at the top of a frontend test file, before importing anything
 * from @testing-library/preact or the component under test.
 */
/** Sets globalThis[name], overriding Node's own built-in (e.g. navigator) if one already exists as a non-configurable-but-still-redefinable getter. */
function setGlobal(name: string, value: unknown): void {
  Object.defineProperty(globalThis, name, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

export function installDomGlobals(): void {
  const window = new Window({ url: "http://localhost/" });
  setGlobal("window", window);
  setGlobal("document", window.document);
  setGlobal("navigator", window.navigator);
  setGlobal("location", window.location);
  setGlobal("HTMLElement", window.HTMLElement);
  setGlobal("Node", window.Node);
  setGlobal("Event", window.Event);
  setGlobal("CustomEvent", window.CustomEvent);
  setGlobal("requestAnimationFrame", (cb: (time: number) => void) =>
    setTimeout(() => cb(Date.now()), 0),
  );
  setGlobal("cancelAnimationFrame", (id: unknown) =>
    clearTimeout(id as NodeJS.Timeout),
  );
}
