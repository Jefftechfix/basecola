# Custodial Wallet Architecture

Status: design proposal only. This document does not enable deposits, create keys, or authorize withdrawals. The existing browser signup, assets, and wallet flows remain a demo and must not be presented as production custody.

## Decision

Use Supabase Auth and Postgres for customer identity, public wallet metadata, and workflow state only. Use Supabase Vault only for narrowly scoped application secrets if needed. Do not put root seeds, private keys, data-encryption keys, or signing credentials in Vault, Postgres, browser code, or application logs.

Vault encrypts stored values and provides a database view that decrypts them for authorized SQL callers. That is useful for application secrets, but it is not an HSM-backed signing boundary: database roles able to read decrypted values can expose those secrets, and the Vault key is managed as a Supabase project key. Keep custody key protection and signing in an independently deployed, network-isolated service using an HSM or equivalent qualified key boundary. Do not make a Supabase Edge Function or SQL trigger a signer.

No custody API provider is required by this design. Chain node/RPC providers may be operated in-house or selected separately; node connectivity is not key custody.

## Trust Boundaries

```text
Browser / public API
  -> Supabase Auth and public application APIs
  -> provisioning request (identity and idempotency key only)

Custody control plane (private network)
  -> provisioning worker: allocate derivation index / XRP tag
  -> isolated signer: policy-check, build, and sign approved transaction
  -> HSM: protect root or wrapping keys; sign directly where qualified
  -> chain nodes / RPC gateways: broadcast and observe

Supabase Postgres
  -> profiles, public addresses, derivation references, workflow state,
     transaction intents, approvals, and audit metadata; no secret key material
```

## Deposit Observation Ingestion

`deposit_observations` stores idempotent chain events keyed by `(network, tx_hash, event_index)`. The `record_chain_deposit` database function is executable only by `service_role`; a private chain-monitor worker must authenticate to Supabase with its server-only service credential and call it after verifying the event against the configured chain node/provider. The function associates an event with an active wallet address and matching destination tag. A database trigger applies the configured confirmation threshold and derives `pending`, `confirmed`, or `failed`; disabling a network does not stop monitoring already-issued addresses. Admin reads are available only through the server-side admin authorization check. This repository does not include or deploy a chain watcher, so the table remains empty until that worker is implemented and running; no UI status by itself proves an on-chain deposit.

## Treasury Balance Ingestion

`treasury_wallet_accounts` contains public treasury address metadata registered by the custody deployment. The private treasury monitor submits idempotent snapshots to `record_treasury_balance_observation`, which is executable only by `service_role`; each snapshot is keyed by the registered wallet, asset, and monitor observation reference. Admin views read the latest snapshot per wallet and asset. No admin UI or browser role can create wallet registrations, submit balance snapshots, or execute a treasury operation. `treasury_operation_requests` records requests for later private approval/execution; `requested` does not mean approved, signed, broadcast, or completed. This repository does not include a treasury wallet registry worker, balance monitor, approval service, or signer, so balances remain empty until those services are deployed.
The public API must never be able to call an unrestricted `sign(bytes)` operation. The signer accepts typed, authenticated requests and independently validates the customer, asset/network, destination, amount, fee bounds, nonce/UTXO inputs, policy state, approval state, and replay/idempotency token. It constructs or validates the exact chain transaction before signing.

## Key Management

- Use audited, maintained cryptographic libraries and operating-system or HSM cryptographic randomness. Never implement entropy generation, key derivation primitives, or cryptographic algorithms locally.
- Generate root material in an approved HSM boundary when supported. Otherwise generate it in a tightly controlled ceremony using a qualified source, encrypt it immediately with an HSM-protected key-encryption key (KEK), and never persist plaintext seed material.
- Use envelope encryption with versioned KEK identifiers and authenticated encryption. Bind ciphertext to immutable metadata (key ID, network, wallet ID, and format version) as associated data. A signer may unwrap only inside its isolated runtime and only for an authorized operation; minimize plaintext lifetime and prohibit swap/core dumps.
- Prefer non-exportable per-key HSM signing when the selected HSM supports the required curve and derivation model. If HD derivation or a chain curve is unsupported, use an explicitly reviewed isolated derivation/signing boundary with HSM-protected wrapping keys; document the residual exposure. Do not claim HSM signing for unsupported algorithms.
- Separate production and test roots, HSM partitions, roles, credentials, and deployment accounts. Provisioning can allocate public derivation references but cannot sign. Monitoring can read chain state but cannot access keys. Administration cannot approve its own withdrawals.
- Rotation must be versioned and rehearsed. KEK rotation rewraps data keys without changing wallet addresses. Root/derivation-root rotation requires a migration plan for funds and deposit addresses; it is not a routine in-place replacement.
- Backups are encrypted, HSM-recoverable under quorum-controlled recovery, tested on a schedule, and geographically/account separated. Recovery ceremonies require multiple independent custodians, documented identity checks, and immutable audit records. Never back up seed phrases in ordinary application storage.

## Network Profiles

Pin each network, derivation version, curve, address format, and library version in configuration and persist the version with each wallet record. Test vectors must be checked against independent implementations before production.

| Network / asset    | Key and address profile                                                                                                                                              | Deposit assignment                                                                                                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bitcoin mainnet    | secp256k1, BIP-32/BIP-39 seed handling only if a mnemonic is operationally required, BIP-84 native SegWit P2WPKH; account path `m/84'/0'/account'/change/index`      | Allocate a unique external-chain address index per customer; monitor confirmations and reorgs. Do not reuse an index after an address is issued.                                                               |
| Ethereum mainnet   | secp256k1, BIP-32/BIP-44 path `m/44'/60'/0'/0/index`; checksum-format addresses for display                                                                          | Allocate a unique address index. ETH and USDT ERC-20 use this same address.                                                                                                                                    |
| Tether ERC-20      | Ethereum account above; ERC-20 contract and chain ID are allowlisted configuration, not user input                                                                   | Store as a distinct asset/network mapping to the customer's ETH address; monitor token transfer logs and contract address.                                                                                     |
| Solana mainnet     | Ed25519; select and pin one hardened derivation scheme (for example SLIP-0010 with a documented BIP-44-compatible path). Wallet ecosystems vary in path conventions. | Allocate an index using the pinned scheme and validate against published test vectors. Keep SPL mint/token-account handling separate from the owner address.                                                   |
| XRP Ledger mainnet | XRPL family-seed/account derivation and encoding, normally secp256k1 unless a separately reviewed algorithm is selected; this is not ordinary BIP-44 derivation      | Prefer a pooled deposit account with a unique uint32 destination tag per customer, matching both address and tag during reconciliation. Unique XRP accounts require activation funding and reserve accounting. |

For future TRON TRC-20, add a separate network profile and contract allowlist; do not infer it from ERC-20 support. For Solana SPL assets, model the mint and associated token account separately from the owner's SOL address. Network identity must include environment/chain ID so testnet and mainnet addresses cannot be mixed.

## Provisioning and Data Model

1. Supabase Auth creates the user and profile. A trusted server-side event/outbox enqueues provisioning; the database trigger must not derive keys or call external signer endpoints.
2. The provisioning worker authenticates with a workload identity, claims an idempotent request keyed by `(user_id, provisioning_version)`, and allocates chain indexes/tags with database uniqueness constraints.
3. The derivation service returns only public address material and a non-secret key reference/derivation path. It must not return seed phrases or private keys.
4. Persist one wallet-account row per customer and network/account profile, plus asset-to-network mappings. Enforce uniqueness for `(user_id, network, wallet_role)` and globally unique `(network, address)`; enforce `(network, address, destination_tag)` where tags are used. Use transactions/leases so retries cannot allocate conflicting addresses.
5. Mark provisioning complete only after all required records are durable. Retry transient errors; retain per-network status and alert on partial provisioning. Do not show an address until its network and monitoring pipeline are active.
6. Assets UI reads addresses through an authenticated, own-user-only endpoint. It never requests signing material. Address exposure is acceptable; balances remain untrusted until reconciled against chain observations.

Suggested records: `wallet_accounts` (user, network, public address, derivation version/reference, status), `provisioning_jobs` (idempotency key, attempts, per-network results), `deposit_observations` (chain, transaction, output/log index, amount, block, confirmations, status), and `withdrawal_intents` (immutable request, policy result, approvals, signed/broadcast state). Do not store private keys, mnemonic phrases, raw decrypted seeds, or HSM credentials in any of these tables.

Enable RLS on customer-visible records. Customers can select only their own public address and deposit history. Clients cannot insert or update wallet addresses, indexes, deposit credit status, withdrawal approval state, or ledger balances. Use narrow service roles, no general `service_role` credential in browser code, and database uniqueness constraints as the final idempotency guard.

## Deposit and Withdrawal Controls

- Deposit monitors consume independently verified node/RPC data, handle confirmations and reorgs, and deduplicate by network transaction/output or log index. Credit only from reconciled chain observations and an auditable internal ledger; never treat a client callback as proof of deposit.
- Withdrawals transition through explicit states: requested, validated, risk/policy checked, approved, signed, broadcast, confirmed, failed/reconciled. A request is immutable after approval; any material change invalidates approvals.
- Apply per-asset and per-network allowlists, address validation, fee ceilings, velocity and balance limits, hot-wallet exposure limits, sanctions/risk screening as required, and dual control for elevated thresholds. Keep policy enforcement inside the signer, not only in the public API.
- Require a unique idempotency token and chain-specific replay protections: Ethereum chain ID and nonce, Bitcoin UTXO/input reservation and change validation, Solana recent blockhash and signature state, and XRP sequence/ticket plus destination-tag validation. Persist signed transaction hashes before/with broadcast and reconcile ambiguous outcomes rather than blindly resubmitting.
- The signer validates transaction semantics against the approved intent, refuses arbitrary transaction bytes, and emits tamper-evident audit events without secret material. Emergency controls can pause a network, key, or withdrawal class without disabling deposit observation.

## Roles and Audit

Use separate workload identities and least-privilege roles for `provisioner`, `signer`, `monitor`, and `custody-admin`. Require mutual TLS or equivalent workload authentication between private services. Human production access is time-bound, approved, and recorded. No single operator can both change withdrawal policy and approve a high-risk withdrawal.

Audit key lifecycle, derivation allocation, policy decisions, approvals, signing requests/results, HSM operations, rotation, recovery, and administrative changes. Logs contain IDs, hashes, reason codes, and outcomes only; redact authorization headers, secrets, seed material, and raw key bytes. Export audit events to access-controlled, append-only storage and alert on policy bypass attempts, unusual signing volume, HSM failures, and provisioning gaps.

## Mainnet Readiness Gates

Do not connect this repository's signup or assets UI to mainnet custody until all of these are complete:

- Dedicated private custody deployment, HSM selection/qualification for secp256k1 and Ed25519 requirements, threat model review, and independent security assessment.
- Audited derivation/address test vectors for every supported network, including XRP tag handling and Solana derivation interoperability.
- Database/RLS review, idempotency and concurrency tests, chain reorg/replay tests, signer policy tests, and disaster-recovery/key-rotation exercises.
- Operational runbooks for key ceremony, incident response, chain outages, withdrawals pause, backup restore, reconciliation, and customer recovery.
- Legal, compliance, financial controls, custody disclosures, insurance, and approval workflows reviewed for launch jurisdictions.
- Testnet soak and controlled rollout. Mainnet activation requires explicit approval; no production keys or funds are part of local development or automated tests.

## Current Repository Boundary

Signup still calls Supabase Auth directly. The migration `20261104120000_custody_provisioning_foundation.sql` extends the auth trigger to create pending wallet-account rows and idempotent provisioning jobs for Bitcoin testnet, Ethereum Sepolia, Solana devnet, and XRPL testnet. It stores no private key material and does not derive addresses. A separately deployed private provisioner and protected signing/derivation boundary must claim jobs, persist public addresses, and activate account rows before an address can be used. Admin Assets/Wallets reads configured test asset networks, provisioned public wallet accounts, and chain observations. Asset setting changes are audited. Admin Treasury reads monitor-submitted public treasury wallet snapshots and persisted operation requests; requests do not sign or move funds. The admin Buy/Sell screen reads persisted trade settlements and edits audited rates/limits/switches; settlement functions enforce those settings and ignore client-supplied prices. The order screen cannot create or alter trades. Customer asset displays and wallet receive helpers remain demo-only. This foundation is not evidence that custody has been implemented or audited.

## References

- [Supabase Vault](https://supabase.com/docs/guides/database/vault)
- [BIP-32: Hierarchical Deterministic Wallets](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)
- [BIP-39: Mnemonic Code for Generating Deterministic Keys](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [BIP-44: Multi-Account Hierarchy](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
- [BIP-84: Native SegWit Derivation](https://github.com/bitcoin/bips/blob/master/bip-0084.mediawiki)
- [SLIP-0010: Universal private key derivation](https://github.com/satoshilabs/slips/blob/master/slip-0010.md)
- [XRPL key derivation](https://xrpl.org/docs/concepts/accounts/cryptographic-keys)
