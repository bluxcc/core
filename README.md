# Blux Wallet Kit - The Missing Piece for Stellar dApps

Blux is a **comprehensive authentication and wallet connect kit** designed for Stellar dApps. It simplifies onboarding by integrating multiple authentication methods, including **wallets, email, phone, and OAuth**. With Blux, developers can create seamless multi-auth experiences without the complexity of building custom authentication solutions from scratch.

## Features

- **Multi-Wallet Support**: Easily integrate Stellar wallets such as **Rabet, xBull, Lobstr, Freighter, and Albedo**.
- **OAuth & Social Login** _(Coming Soon)_: Support for **Apple, Meta, Google, and more**.
- **Email & Phone Authentication** _(Coming Soon)_: Securely onboard users with non-crypto credentials.
- **Customizable UI**: Adjust themes, fonts, backgrounds, logos, border radius, and text colors.
- **Configurable Networks**: Set up and modify network preferences via API keys.
- **Future-Proof**: More wallets and authentication methods will be added based on community feedback.

## Installation

Blux can be installed via npm:

```sh
npm i @bluxcc/core
```

or using yarn:

```sh
yarn add @bluxcc/core
```

## Usage

Include Blux and set up the authentication flow:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Blux Example</title>
  <script src="https://unpkg.com/@bluxcc/core/dist/index.iife.js"></script>
</head>
<body>
  <button id="loginBtn">Login with Blux</button>

  <script>
    Blux.createConfig({
      appName: "your-app-name",
      appId: "get-id-from-dashboard",
      networks: ["Public Global Stellar Network ; September 2015"],
    });

    document.getElementById("loginBtn").onclick = async () => {
      const user = await Blux.Blux.login();
      console.log("Logged in:", user);
    };
  </script>
</body>
</html>
```

## Customization

Developers can customize various UI elements:

- **Themes & Fonts**
- **Backgrounds, Logos**
- **Border Radius & Text Colors**
- **Authentication Limits** (Free tier supports 500-1000 accounts per auth method)

Configuration options can be passed in the `config` object when initializing Blux, or set via environment variables.

## Supported Wallets

Currently supported connection methods:

- [x] **Rabet**
- [x] **xBull**
- [x] **Lobstr**
- [x] **Freighter**
- [x] **Albedo**
- [x] **Hana**
- [ ] **Ledger**
- [ ] **Trezor**
- [ ] **WalletConnect**
- [ ] **OAuth**
- [ ] **Email**

## License & Usage Restrictions

- **No Production Use**: This software is provided under the **Blux Team License** with restrictions on production use.
- **No Forking or Unauthorized Modifications**: Removing references to **Blux Team** or forking without attribution is strictly prohibited.
- **Custom Licensing Available**: Contact us at [support@blux.cc](mailto:support@blux.cc) to discuss licensing options.

## Support & Contact

For support, licensing, or inquiries, reach out via:

- **Email**: [support@blux.cc](mailto:support@blux.cc)
- **X (Twitter)**: [@BluxOfficial](https://twitter.com/BluxOfficial)

## Roadmap & Future Plans

Blux is evolving. Follow our updates on [X (Twitter)](https://twitter.com/BluxOfficial) for:

- **OAuth Authentication (Apple, Meta, Google, etc.)**
- **Email & Phone-Based Authentication**
- **More Wallet Integrations**
- **Enhanced Customization & Security Features**

Stay tuned. We have many exciting developments ahead!
