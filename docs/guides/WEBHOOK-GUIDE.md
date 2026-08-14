# Local Webhook Setup Guide

For true production parity, Tempot uses webhooks in production instead of long polling. To test webhook payloads locally, you need to expose your local development server to the internet using Cloudflare Tunnels (`cloudflared`).

## Prerequisites

1. Ensure `cloudflared` is installed on your local machine.

## Setup Instructions

1. **Start the tunnel:**
   In a new terminal window, run the following command to start the tunnel:

   ```bash
   pnpm dev:tunnel
   ```

   This will output a `trycloudflare.com` URL.

2. **Configure `.env`:**
   Copy the provided `trycloudflare.com` URL and paste it into your `.env` file under the `WEBHOOK_URL` variable.
   Also, ensure your `BOT_MODE` is set to webhook:

   ```env
   BOT_MODE=webhook
   WEBHOOK_URL=https://your-tunnel-url.trycloudflare.com
   ```

3. **Start the development server:**
   In another terminal window, start your local `bot-server`:

   ```bash
   pnpm dev
   ```

4. **Set the webhook:**
   Once both the tunnel and your development server are running, execute the following command to register the webhook with Telegram:
   ```bash
   pnpm webhook:set
   ```

## Additional Webhook Commands

- `pnpm webhook:info` - Fetches and displays the current status and info of your registered webhook.
- `pnpm webhook:delete` - Removes the registered webhook from Telegram and falls back to polling if configured.
