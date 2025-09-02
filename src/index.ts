import { createElement } from "react";
import { createRoot } from "react-dom/client";

import { Provider } from "./components/provider";
import { BLUX_EVENT_NAME } from "./constants/consts";

interface IConfig {
  name: string;
  appId: string;
}

let root: any = null;
let container: HTMLDivElement | null = null;

(function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  root = createRoot(container);
  root.render(createElement(Provider));
})();

export function createConfig(config: IConfig) {}

const sendEvent = (detail: any) => {
  const event = new CustomEvent(BLUX_EVENT_NAME, {
    detail,
  });

  window.dispatchEvent(event);
};

export function login(title?: string, content?: string) {
  sendEvent({ title, content });
}
