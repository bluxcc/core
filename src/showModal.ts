import htm from "htm";
import { h } from "preact";

import { Emitter } from "./events";
import { showModal } from "./modal";
import { IWallet } from "./types";

const emitter = new Emitter();

const html = htm.bind(h);

const handleClick = () => {
  console.log("i was clicked");
};

export function loginModal(wallets: IWallet[]) {
  emitter.emit("login", null);

  showModal({
    title: "Login",
    content: html` <div>
      ${wallets.map(
        (w) =>
          html` <button
            type="button"
            onClick=${() => {
              handleClick();
            }}
          >
            ${w.name}
          </button>`,
      )}
    </div>`,
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
