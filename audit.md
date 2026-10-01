# Blux Core

**Review date:** 26 September 2026  
**Package:** `@bluxcc/core` 0.3.7

Blux Core is the wallet and session runtime for Stellar apps. It owns configuration, the login UI, wallet adapters, and the Soroban helpers that `@bluxcc/react` wraps. The public surface is small on purpose: hosts configure the SDK, then talk to it through `blux` and the `core` helpers.

## What holds up

- TypeScript strict mode is on, and the package entry is a typed ESM/CommonJS build with declarations.
- Login does not treat a typed-in code or a connected extension as proof by itself. Email and social flows finish through the Blux API, and wallet login asks the wallet to sign an ownership challenge before the session is marked authenticated.
- Terms are applied before a session is committed. Declining that step clears the in-memory session instead of leaving a half-logged-in user behind.
- The session bearer token lives in the memory store. `getJwt()` is how a first-party host, including the Blux dashboard, reads it for the current tab. Older copies under `__BLUX__JWT_STORE` are deleted on startup, and recent-login storage no longer keeps that token. Wallet reconnect can still remember which extension was used, because that record is a wallet name, not a bearer token.
- Contract reads and writes take one call shape (`address`, `fn`, `args`). Native arguments are encoded from the deployed contract spec, `.xlm` names resolve where the ABI expects an address, and a single `readContract` sits beside the batch `readContracts` helper.
- Amounts on the swap path use `BigNumber`, with slippage limits and a cap on Stellar-scale values.
- App ID checks fail closed on the normal login and signing entry points.
- Social login checks the sender origin. External links generally use `noopener,noreferrer`.
- The node test suite covers contract argument conversion, contract return types, config defaults, theme inheritance, and color helpers.
- Source does not contain hard-coded private keys, API secrets, or access tokens.

## How a host should use the session

After `createConfig`, a signed-in user has a bearer token only inside the running tab:

```ts
import { getJwt } from '@bluxcc/core';

const token = getJwt();
```

`token` is `undefined` until login completes, and again after `logout` or a reload. Email, social, and passkey users sign in again on the next visit. That is the trade for not leaving a signing credential in `localStorage`, where any script on the origin could read it and ask the Blux API to sign.

## Scope

This note covers the SDK package as it stands in the repository: session handling, contract helpers, wallet connection, and the tests next to that code. It does not cover the Blux API, the CDN, or wallet extensions.
