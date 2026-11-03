# Crypto Basecamp Beacon

Create a cryptocurrency website using this images features as basecola

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://crypto-basecamp-beacon.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/32cc0930-2e98-4738-80a7-de4dfe6ffeb9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

### Supabase server configuration

The admin user-management functions require a server-only Supabase key in addition to the public URL and publishable key. For local development, create or use `.env.local` (not the tracked `.env`) and set:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=YOUR_SERVER_SECRET_KEY
```

`SUPABASE_SECRET_KEY` is the current Supabase secret-key format. `SUPABASE_SERVICE_ROLE_KEY` is also accepted for projects still using the legacy service-role key. Set the same values as server environment variables in the deployment platform. Restart the dev server after changing environment variables.

Never prefix the secret/service-role key with `VITE_`, place it in browser code, or commit it. The admin key bypasses row-level security and must remain server-side.
