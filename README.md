# Blux Wallet Kit - The Missing Piece for Stellar dApps

![image]()

Blux is a **comprehensive authentication and wallet connect kit** designed for Stellar dApps.
It simplifies onboarding by integrating multiple authentication methods, including **wallets, email, passkey, and socials**.

## Features

- **Multi-Wallet Support**: Easily integrate Stellar wallets such as **Rabet, xBull, Lobstr, Freighter, Albedo, Hot Wallet, Hana Wallet, and more**.
- **Social Login** _(Coming Soon)_: Support for **Apple, Meta, Google, and more**.
- **Email & Passkey** _(Coming Soon)_: Securely onboard users with non-crypto credentials.
- **Customizable UI**: Adjust themes, fonts, backgrounds, logos, border radius, and text colors.
- **Configurable Networks**: Set up and modify network preferences via API keys.
- **Future-Proof**: More wallets and authentication methods will be added based on community feedback.

## Installation

```sh
npm i @bluxcc/core
```

## Usage

```html
<!DOCTYPE html>
<script src="https://unpkg.com/@bluxcc/core/dist/index.iife.js"></script>

<button id="loginBtn">Login with Blux</button>

<script>
  Blux.createConfig({
    appName: 'My App',
    networks: [Blux.core.networks.mainnet],
  });

  document.getElementById('loginBtn').onclick = async () => {
    await Blux.blux.login();
  };
</script>
```

```tsx
import { blux, core, createConfig } from '@bluxcc/core';

createConfig({
  appName: 'My App',
  networks: [core.networks.mainnet],
});

document.getElementById('loginBtn').onclick = async () => {
  await blux.login();
};
```

## Support & Contact

For support, licensing, or inquiries, reach out via:

- **Email**: [support@blux.cc](mailto:support@blux.cc)
- **X (Twitter)**: [@BluxOfficial](https://twitter.com/BluxOfficial)

Follow for more updates at [X (Twitter)](https://twitter.com/BluxOfficial).
