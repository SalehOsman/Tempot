# 🌐 Tunneling & ngrok Operator Manual

> Complete guide for exposing local development servers to Telegram via secure HTTPS tunnels.

---

## 1. Why is a Tunnel Required?

When developing locally:
* Your TMA dev server runs on `http://localhost:5173`.
* Telegram runs on your smartphone or cloud servers and **cannot** reach `localhost` directly.
* Telegram strictly requires an **HTTPS** URL to open Mini Apps inside the Telegram client.

A tunneling agent (such as **ngrok**, **localtunnel**, or **Cloudflare Tunnels**) provides a public HTTPS domain that securely forwards incoming Telegram traffic to your local port `5173`.

---

## 2. Project ngrok Configuration (`ngrok.yml`)

The repository includes pre-configured tunnel definitions in `ngrok.yml` located in the root of the project:

```yaml
version: 3
agent:
  authtoken: "<your-authtoken>"
endpoints:
  - name: tma
    url: https://your-static-domain.ngrok-free.dev
    upstream:
      url: 5173
```

> [!CAUTION]
> **Port Invariant:** Note that `upstream.url` must point to `5173` (where Vite is listening). Pointing to `80` or `3000` will cause `502 Bad Gateway` or `connection refused` errors!
> **Secret Hygiene:** `ngrok.yml` is ignored by `.gitignore` to protect your `authtoken` from being pushed to version control.

---

## 3. Running the Tunnel

### Method A: Fully Containerized in Docker (Recommended for Zero-Terminal Operation)
ngrok is configured directly inside `docker-compose.yml`. When starting the stack with:
```bash
docker compose up -d
```
The `tembot-ngrok` container starts automatically, bridges into the internal Docker network `tembot-net`, and tunnels `http://tma:80` directly to your domain with `--pooling-enabled=true` without requiring any open terminals or host port bindings!

### Method B: Using the Built-In Script
Once your `authtoken` and domain are configured in `ngrok.yml`:

```bash
pnpm tunnel
```

### Method C: Using npx Directly (Zero-Install)
If you prefer not to touch `ngrok.yml`:

```powershell
npx ngrok config add-authtoken <YOUR_AUTHTOKEN>
npx ngrok http 5173 --url <YOUR_NGROK_DOMAIN>
```

---

## 4. Vite Host Security (`allowedHosts`)

### Issue: `Blocked request. This host (...) is not allowed.`
In Vite 6+, an automated security feature blocks incoming HTTP requests if the `Host` header does not match localhost.

### Resolution:
In `apps/tma/vite.config.ts`, `server.allowedHosts: true` is configured:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true, // Allows all reverse-proxy tunnels in development
  },
});
```

---

## 5. Troubleshooting Common ngrok Errors

| Error Code / Symptom | Root Cause | Solution |
| :--- | :--- | :--- |
| `ERR_NGROK_3200: The endpoint is offline` | The ngrok agent is not running on your computer. | Run `pnpm tunnel` in PowerShell to start the agent. |
| `ngrok : The term 'ngrok' is not recognized` | `ngrok.exe` is not in Windows system `PATH`. | Run via `npx ngrok ...` or install globally using `winget install Ngrok.Ngrok`. |
| `ERR_NGROK_6024: Free tier warning page` | ngrok free tier displays a 1-time browser interstitial. | In Telegram, tap `Visit Site` once to dismiss. Subsequent visits open directly. |
| `dial tcp ... connection refused` | Port mismatch (e.g. ngrok pointed to 80 instead of 5173). | Change `upstream: url: 5173` in `ngrok.yml`. |
