import htm from "htm";
import { h } from "preact";

import { Emitter } from "./events";
import { showModal } from "./components/Modal";
import { IWallet } from "./types";
import { Button } from "./components/Button";
import { defaultLightTheme } from "./constants/themes";

const emitter = new Emitter();
const html = htm.bind(h);
const appearance = defaultLightTheme;
const handleClick = (wallet: IWallet) => {
  console.log(`Wallet clicked: ${wallet.name}`);
  emitter.emit("walletSelected", wallet);
};

export function loginModal(wallets: IWallet[]) {
  emitter.emit("login", null);

  showModal({
    isOpen: true,
    children: html`
      <div class="bluxcc:flex bluxcc:flex-col bluxcc:gap-2">
        <h2 class="bluxcc:text-lg bluxcc:font-semibold bluxcc:mb-2">
          Select a Wallet
        </h2>
        ${wallets.map(
          (w) => html`
            ${Button({
              variant: "fill",
              children: `${w.name}`,
              onClick: () => handleClick(w),
              appearance,
            })}
          `
        )}
      </div>
    `,
  });
}

export function logout() {
  emitter.emit("logout", null);

  showModal({
    isOpen: true,
    children: html`
      <div class="bluxcc:text-center">
        <h2 class="bluxcc:text-lg bluxcc:font-semibold bluxcc:mb-2">
          Logged Out
        </h2>
        <p>You have been successfully logged out.</p>
      </div>
    `,
  });
}

export function profile(user?: { name: string; wallet: string }) {
  emitter.emit("profile", user);

  showModal({
    isOpen: true,
    children: html`
      <div>
        <h2 class="bluxcc:text-lg bluxcc:font-semibold bluxcc:mb-2">Profile</h2>
        <p><strong>Name:</strong> ${user?.name ?? "Guest"}</p>
        <p><strong>Wallet:</strong> ${user?.wallet ?? "Not connected"}</p>
      </div>
    `,
  });
}

export function sendTransaction(txData?: any) {
  emitter.emit("sendTransaction", txData);

  showModal({
    isOpen: true,
    children: html`
      <div>
        <h2 class="bluxcc:text-lg bluxcc:font-semibold bluxcc:mb-2">
          Send Transaction
        </h2>
        <p>Here you could show transaction details or confirmation UI.</p>
      </div>
    `,
  });
}

export function signMessage(message?: string) {
  emitter.emit("signMessage", message);

  showModal({
    isOpen: true,
    children: html`
      <div>
        <h2 class="bluxcc:text-lg bluxcc:font-semibold bluxcc:mb-2">
          Sign Message
        </h2>
        <p>Message: ${message ?? "No message provided"}</p>
      </div>
    `,
  });
}
