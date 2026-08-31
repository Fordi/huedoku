// provides `html` template function
import { createElement, Fragment } from "preact";
import { html as htmlRaw } from "htm/preact";

export const html = (...args: Parameters<typeof htmlRaw>) => {
  const result = htmlRaw(...args);
  if (!Array.isArray(result)) {
    return result;
  }
  return createElement(Fragment, null, ...result);
};
