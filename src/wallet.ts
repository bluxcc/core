import htm from "htm";
import { h } from "preact";

import { Emitter } from "./events";
import { showModal } from "./modal";

const emitter = new Emitter();

const html = htm.bind(h);

export function login() {
  emitter.emit("login", null);

  showModal({
    title: "Login",
    content: html`
      <div>
        <input
          type="text"
          placeholder="Username"
          style="width:100%; margin-bottom:0.5rem;"
        />
        <input type="password" placeholder="Password" style="width:100%;" />
      </div>
    `,
  });
}

export function logout() {
  // todo
  showModal({
    title: "Logged Out",
    content: "You have been successfully logged out.",
  });
}

export function profile() {
  // TODO
}

export function sendTransaction() {
  // TODO
}

export function signMessage() {
  // TODO
}
