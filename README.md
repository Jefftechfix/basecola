# Basecola

Basecola is a cryptocurrency account and market information application built with Vite and TanStack Start.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

Build and preview the Vite app with:

```sh
npm run build
npm run preview
```

### Supabase server configuration

The admin user-management functions require a server-only Supabase key in addition to the public URL and publishable key. For local development, create or use `.env.local` (not the tracked `.env`) and set:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=YOUR_SERVER_SECRET_KEY
```

The server auth middleware can also use `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for the public URL and publishable key. This does not replace `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`), which admin user-management operations require and which must remain server-only.

`SUPABASE_SECRET_KEY` is the current Supabase secret-key format. `SUPABASE_SERVICE_ROLE_KEY` is also accepted for projects still using the legacy service-role key. Set the same values as server environment variables in the deployment platform. Restart the dev server after changing environment variables.

Never prefix the secret/service-role key with `VITE_`, place it in browser code, or commit it. The admin key bypasses row-level security and must remain server-side.

### Transaction email notifications

Admin dashboard email notifications are sent by the `admin-notification-email` Supabase Edge Function, which reads `RESEND_API_KEY` and `RESEND_FROM_EMAIL` from Supabase Edge Function secrets. Deploy it with `supabase functions deploy admin-notification-email` after setting those secrets. The app server still needs `APP_URL` for email rendering and Stripe checkout returns. For transaction receipts and verification decision emails, also configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL` as server-only environment variables in the app host; those email flows are sent by the app server. `RESEND_FROM_EMAIL` must be a sender address verified in your Resend account. Never expose any of these values with a `VITE_` prefix.

Basecola sends the branded transaction email after Stripe confirms wallet funding, a buy or sell settles, an on-chain deposit reaches its required confirmations, or a crypto withdrawal is broadcast. Unconfirmed deposits and the send/receive demo screens do not send transaction-completion emails. Provider delivery failures are surfaced to the caller; webhook notifications return a retryable error where the originating provider can retry, and stable idempotency keys prevent duplicate messages on retries.

### Turnkey-managed crypto wallets

Turnkey and Alchemy credentials are read only inside Supabase Edge Functions, not the TanStack app server or browser. The Edge Functions use the official `@turnkey/sdk-server` package pinned to `8.9.0`. Link the Supabase project, create an **untracked and gitignored** `.env.supabase-edge` file containing these entries, fill it locally, then upload them:

```dotenv
TURNKEY_ORGANIZATION_ID=
TURNKEY_API_PUBLIC_KEY=
TURNKEY_API_PRIVATE_KEY=
ALCHEMY_API_KEY=
APP_URL=https://YOUR_PUBLIC_APP_ORIGIN
ALCHEMY_ETHEREUM_WEBHOOK_ID=
ALCHEMY_ETHEREUM_WEBHOOK_SIGNING_KEY=
ETHEREUM_USDT_CONTRACT_ADDRESS=
BITCOIN_ESPLORA_URL=
SOLANA_MAINNET_RPC_URL=
XRPL_MAINNET_RPC_URL=
CRYPTO_MONITOR_SECRET=
CRYPTO_MAINNET_WALLETS_ENABLED=false
```

```sh
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set --env-file .env.supabase-edge
supabase functions deploy turnkey-wallet-provisioning --import-map supabase/functions/import_map.json
supabase functions deploy company-treasury-admin --import-map supabase/functions/import_map.json
supabase functions deploy alchemy-market-prices
supabase functions deploy alchemy-ethereum-webhook
supabase functions deploy crypto-deposit-ingestion
supabase functions deploy admin-notification-email
```

Supabase provides `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. Do not copy the service-role key into the secret file. Keep app-host `SUPABASE_URL` and publishable/anon key configured so the app can call Supabase and forward webhook requests. Set `APP_URL` to the canonical public application origin in both the app server environment and Supabase Edge Function secrets; Stripe checkout accepts returns only to that configured origin. Public market prices are fetched through the `alchemy-market-prices` Edge Function, which reads the `ALCHEMY_API_KEY` secret server-side and caches results for 60 seconds; the browser and app host never receive the Alchemy key. The same secret is used to construct the Ethereum RPC endpoint and as the Alchemy Notify API token for address registration; an explicit `ALCHEMY_ETHEREUM_RPC_URL` can override the constructed endpoint. The webhook ID and signing key are separate Alchemy webhook configuration values: the API key cannot replace signature verification, so webhook processing remains disabled until those values are set. Store the Turnkey private key in the env file with escaped `\n` sequences if it is PEM-formatted. Do not prefix any Turnkey credential or provider secret with `VITE_`, commit it, or send it in chat.

The signup database trigger queues idempotent wallet-provisioning jobs. After authentication, the app calls `turnkey-wallet-provisioning`; the Edge Function validates the customer JWT, provisions Bitcoin, Ethereum, Solana, and XRP accounts through Turnkey, registers the Ethereum address with Alchemy, and returns only public wallet information. USDT shares the Ethereum address. The demo Receive screen remains separate.

Configure Alchemy Address Activity to call `POST /api/webhooks/alchemy-ethereum` on the app host. That route forwards the raw request to the `alchemy-ethereum-webhook` Edge Function, which validates `X-Alchemy-Signature`, checks the webhook ID and USDT contract, cross-checks receipts and canonical block hashes against Ethereum RPC, and records exact raw-unit amounts. A scheduled confirmation/reorg reconciler is still required.

Private chain-monitor workers can submit verified observations to `POST /api/internal/crypto-deposits` with `Authorization: Bearer <CRYPTO_MONITOR_SECRET>`. The app route forwards requests to `crypto-deposit-ingestion`, which validates the bearer secret and event schema, checks the configured ERC-20 contract, and records observations through the privileged database function. Payload fields are `network`, `asset`, `txHash`, `eventIndex`, `depositAddress`, `destinationTag`, `tokenContract`, decimal-string `amount`, `amountUsd`, block/confirmation data, and optional sender/failure details.

The admin Treasury section can discover wallet names and IDs in the configured Turnkey organization. An administrator selects the four existing company wallets; the backend resolves their accounts in that organization, verifies exactly one supported mainnet wallet per network, and upserts only public wallet metadata into the RLS-protected `treasury_wallet_accounts` table, including Turnkey's wallet creation timestamp. It never creates wallets or writes signing credentials. Repeated syncs preserve existing addresses and status; a changed Turnkey address or conflicting wallet identity is rejected. This reuses the existing treasury table rather than maintaining a second `company_wallets` table. Apply the treasury migration before deploying `company-treasury-admin`. Admins can refresh native asset balances (plus Ethereum USDT) using Alchemy for Ethereum and the configured mainnet RPC/Esplora providers for the other networks. Balance refreshes are read-only and store timestamped observations; USD valuation and treasury ledger reconciliation are not provided by this endpoint. The explorer transaction links display public chain activity; a dedicated treasury transaction index and reconciler remain outstanding.

The Crypto Withdrawal page creates an idempotent request for any valid destination address, applies the $5,000 per-request and rolling 24-hour limits using the audited admin sell-price configuration, automatically approves the request under the selected no-manual-approval policy, and reserves confirmed ledger funds. XRP destination tags are supported. This is request/reservation only: there is no chain-specific fee quote, Turnkey transaction construction/signing, broadcast, or execution reconciliation yet; the UI explicitly states that no transfer is sent.

Do not enable `CRYPTO_MAINNET_WALLETS_ENABLED` until webhook address registration and confirmation reconciliation are operational for Ethereum, and private monitor workers are deployed and tested for Bitcoin, Solana, and XRP. Turnkey provisions wallets and offers signing APIs; it does not monitor deposits. This repository contains the observation/ledger database path, an Alchemy Ethereum webhook Edge Function, and a protected ingestion Edge Function, but not the complete all-network watcher or production withdrawal execution, so mainnet wallet provisioning remains disabled by default.

# basecola
