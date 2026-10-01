# Blux Core: Authentication & Wallet Infrastructure for Stellar dApps

![Blux](https://blux.cc/bluxIntro.jpg)

Blux Core is a JavaScript/TypeScript SDK for adding authentication, Stellar wallet connections, transaction signing, and Soroban interactions to web applications. Users can onboard through supported Stellar wallets, email, passkeys, and social login, while developers get a consistent API and customizable authentication experience.

## Useful Links

- **Website:** [blux.cc](https://blux.cc/)
- **Documentation:** [docs.blux.cc](https://docs.blux.cc/)
- **Live Demo:** [demo.blux.cc](https://demo.blux.cc/)
- **Dashboard:** [dashboard.blux.cc](https://dashboard.blux.cc/)

## Features

- **Framework-Agnostic**: Use Blux Core with vanilla JavaScript, TypeScript, or any frontend framework.
- **Multi-Wallet Support**: Integrate Stellar wallets such as **Rabet, xBull, LOBSTR, Freighter, Albedo, HOT Wallet, Hana, and more**.
- **Email, Passkey & Social Authentication**: Onboard users without requiring them to install or manage a traditional wallet.
- **Transaction Signing**: Connect wallets and request transaction signatures through a consistent interface.
- **Soroban Support**: Add Stellar smart contract interactions to your application.
- **Customizable UI**: Adjust themes, fonts, backgrounds, logos, border radius, text colors, and other interface elements.
- **Wallet Configuration**: Include or exclude individual wallets and control their display order.
- **Configurable Networks**: Choose the Stellar networks supported by your application and set a default network.
- **Custom Explorer**: Configure the block explorer used for account and transaction links.
- **Localization**: Provide the authentication experience in multiple supported languages.
- **User Management & Analytics**: Review authentication methods, login activity, timestamps, and associated wallet addresses through the Blux dashboard.
- **Testing Tools**: Use predefined test accounts and reusable OTP credentials in configured testing environments.
- **Multiple Projects**: Create and manage multiple applications from a single Blux account.
- **Future-Proof**: More wallets and authentication methods will be added based on community feedback.

## Installation

Install Blux Core through npm:

```sh
npm i @bluxcc/core
```

Blux Core can also be loaded directly in the browser through a CDN.

## Browser Usage

```html
<!DOCTYPE html>
<script src="https://unpkg.com/@bluxcc/core/dist/index.iife.js"></script>

<button id="loginBtn">Login with Blux</button>

<script>
  Blux.createConfig({
    appName: 'My App',
    appId: 'GET_FROM_BLUX_DASHBOARD',
    networks: [Blux.core.networks.mainnet],
  });

  document.getElementById('loginBtn').onclick = async () => {
    await Blux.blux.login();
  };
</script>
```

## JavaScript and TypeScript Usage

```tsx
import { blux, core, createConfig } from '@bluxcc/core';

createConfig({
  appName: 'My App',
  appId: 'GET_FROM_BLUX_DASHBOARD',
  networks: [core.networks.mainnet],
});

document.getElementById('loginBtn').onclick = async () => {
  await blux.login();
};
```

`appId` is the only required `createConfig` property. `appName` defaults to
`'App'`. When neither `networks` nor `defaultNetwork` is provided, Blux uses
Mainnet as the only configured network; when only `defaultNetwork` is provided,
that network becomes the sole configured network.

### Theme inheritance

Choose a framework explicitly to inherit its semantic theme values. Blux
resolves the active values from its mount scope, keeps them synchronized across
light/dark theme changes, and reapplies your overrides last:

```ts
createConfig({
  appName: 'My App',
  appId: 'GET_FROM_BLUX_DASHBOARD',
  networks: [core.networks.mainnet],
  appearance: {
    inherit: 'shadcn',
    accentColor: '#7c3aed', // Always wins over the inherited primary color.
  },
});
```

Supported adapters are `shadcn`, `radix`, `daisyui`, `chakra`, `mantine`,
`mui`, `joy`, `heroui` (v3), and `bootstrap`. Prefixes, Chakra palettes, nested
theme scopes, and custom CSS systems use the options form:

```ts
appearance: {
  inherit: {
    source: 'css',
    scope: '#app-theme',
    variables: {
      textColor: '--app-foreground',
      accentColor: '--app-primary',
      background: '--app-dialog-surface',
      borderRadius: '--app-dialog-radius',
    },
  },
}
```

Use `prefix` for custom Chakra, MUI, Joy, or Bootstrap CSS-variable prefixes,
and `colorPalette` to opt into a Chakra primary palette. Missing or invalid
values retain the Blux default; Blux never guesses a framework or primary
palette.

### Soroban Contract Calls

Contract arguments stay positional arrays. Pass native JavaScript values and
Blux reads the deployed contract spec to encode each value as the parameter's
declared Soroban type:

```ts
const { value } = await core.readContract<string>({
  address: 'profile.xlm',
  fn: 'display_name',
  args: ['alice.xlm'],
});

const { values } = await core.readContracts<[string]>([
  {
    address: 'token.xlm',
    fn: 'balance',
    args: ['alice.xlm'],
  },
]);

const submitted = await core.writeContract<bigint>({
  address: 'token.xlm',
  fn: 'transfer',
  // If `amount` is i128, either 1234 or '1234' is encoded as i128.
  args: ['alice.xlm', '1234'],
});
const contractResult = await submitted.returnValue(); // bigint
```

Numbers, decimal strings, `bigint`s, booleans, addresses, byte arrays, vectors,
maps, and contract-defined types are encoded according to the spec. Existing
pre-encoded `ScVal` arguments from `core.ToScVal` continue to work. `.xlm`
resolution is strictly type-directed: contract identifiers and arguments whose
ABI type is `Address` resolve, while a value such as `"alice.xlm"` declared as
`String`, `Symbol`, or another non-address type is sent exactly as provided.

### Human-readable Stellar addresses

Every core field that expects an account or contract address accepts a `.xlm`
name as well as `G...`, `M...`, `C...`, and standard SEP-2 federation notation:

```ts
await core.transfer({ to: 'alice.xlm', amount: '10' });
await core.getAccount({ address: 'alice.xlm' });
await core.readContracts([
  { address: 'token.xlm', fn: 'balance', args: ['alice.xlm'] },
]);
```

Invalid names and names without an address record throw before a transaction is
built. XLM Domains currently uses a mainnet registry, so names resolve to the
same record even when a Blux call selects testnet; normal testnet account or
contract existence rules still apply after resolution.

Create a project through the [Blux Dashboard](https://dashboard.blux.cc/) to obtain your application ID. You can create and manage multiple projects from the same account.

### Social Login

Add any supported provider to `loginMethods`. The first enabled social is
shown on the login screen; the rest appear on **Other socials**.

```tsx
createConfig({
  appName: 'My App',
  appId: 'GET_FROM_BLUX_DASHBOARD',
  networks: [core.networks.mainnet],
  loginMethods: [
    'wallet',
    'google',
    'apple',
    'discord',
    'telegram',
    'meta',
    'github',
    'farcaster',
    'tiktok',
    'linkedin',
    'twitch',
    'kick',
    'spotify',
    'instagram',
    'microsoft',
    'gitlab',
    'twitter',
    'steam',
    'email',
    'passkey',
  ],
});
```

Each provider is shown only when requested in `loginMethods` and returned in
the app's enabled `socials` by `/auth/validate`. Most providers open
`/auth/social/{provider}/start` on the Blux API (for example,
`/auth/social/meta/start` or `/auth/social/github/start`) and use the
shared social-login success, retry, and cancellation flow. Telegram uses
the on-page [Login Widget](https://core.telegram.org/widgets/login) instead
of a popup, because the bot is bound to the site's domain; Mini Apps can
complete login via WebApp init data when that is enabled for the project.

The backend must support each provider and have the project's credentials
and callbacks configured. Private keys, client secrets, and bot tokens never
belong in this browser configuration. Token verification is the backend's
responsibility; the SDK accepts only the resulting Blux session.

## Customization

Developers can customize various UI elements:

- **Themes & Fonts**
- **Backgrounds, Logos**
- **Border Radius & Text Colors**
- **Authentication Limits** (Free tier supports 500-1000 accounts per auth method)

Developers can also configure:

- Enabled authentication methods
- Included and excluded wallets
- Wallet display order
- Supported networks
- Default network
- Block explorer
- Interface language

Configuration options can be set via the `BluxProvider` config or environment variables.

## Dashboard & User Analytics

The Blux dashboard provides information about the users who have connected to your application.

Available information includes:

- Authentication method
- Login and connection timestamps
- Associated wallet addresses, when available
- Recent authentication activity
- Individual user information

This information can help developers understand how their applications are being used and troubleshoot authentication or wallet connection issues.

## Development & Testing

Blux provides predefined accounts for development and quality assurance.

Developers can use preset email identities together with a reusable testing OTP. This makes it possible to test the complete login process repeatedly without waiting for real email delivery or using personal user information.

These credentials are intended only for the configured testing environment. Refer to the [Blux documentation](https://docs.blux.cc/) for the current testing credentials and setup instructions.

## Supported Wallets

Currently supported connection methods:

- [x] **Freighter**
- [x] **Rabet**
- [x] **WalletConnect**
- [x] **HOT Wallet**
- [x] **Hana**
- [x] **xBull**
- [x] **LOBSTR**
- [x] **Ledger**
- [x] **Albedo**
- [x] **Klever Wallet**
- [x] **Bitget Wallet**
- [x] **OneKey**
- [x] **CactusLink**
- [x] **Fordefi**
- [x] **Trezor**
- [x] **Email**
- [x] **Google**
- [x] **Apple**
- [x] **Discord**
- [x] **Telegram**
- [x] **Passkey**

## Supported Languages

Currently supported languages:

- [x] **English**
- [x] **Spanish**
- [x] **Portuguese**
- [x] **French**
- [x] **German**
- [x] **Russian**
- [x] **Chinese**
- [x] **Japanese**
- [x] **Korean**

## License & Usage Restrictions

- **No Forking or Unauthorized Modifications**: Removing references to **Blux Team** or forking without attribution is strictly prohibited.
- **Custom Licensing Available**: Contact us at [support@blux.cc](mailto:support@blux.cc) to discuss licensing options.

## Support & Contact

For support, licensing, custom SMS authentication, or other inquiries, reach out via:

- **Email**: [support@blux.cc](mailto:support@blux.cc)
- **X**: [@BluxOfficial](https://x.com/bluxofficial)

## Roadmap & Future Plans

Blux is evolving. Follow our updates on [X](https://x.com/BluxOfficial) for:

- **Additional OAuth and Social Authentication Methods**
- **More Wallet Integrations**
- **Enhanced Developer Hooks**
- **Expanded Soroban Support**
- **Enhanced Customization, Analytics, and Security Features**
