<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Account pages share AccountShell and AccountNav so all bottom navigation links and active states remain consistent.
- Demo account holdings and transactions live in one browser-safe data module; keep preview data distinct from real financial activity.
- Transaction details use an un-nested dynamic route so direct receipt links render without the transaction list; sharing uses the native share sheet with clipboard and manual-copy fallbacks.
- Wallet action pages share WalletLayout and browser-safe wallet-demo helpers; funding and transfers are simulation-only and receive QR codes encode non-wallet identifiers to prevent accidental deposits.
- Crypto details use an un-nested asset-symbol route backed by the shared demo holdings and transactions so direct links show the selected coin without nesting inside Assets.
- Platform settings live in one service-role-only row (platform_settings) changed only via admin_update_platform_settings, which logs to admin_settings_audit; why: single source of truth with an audit trail.
- Market quotes are fetched server-side from Alchemy and cached for 60 seconds, with the shared cache and response parser in src/lib/market-prices.ts; why: keep API keys private and reduce provider requests.
