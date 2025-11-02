# Deploy to Render - Step by Step Guide

## Problem: ENOTFOUND hostname

Error `getaddrinfo ENOTFOUND dpg-d43jbmodl3ps73a02gag-a` means the internal hostname cannot be resolved.

## Solution: Link Database to Web Service

### Step 1: Link Database (IMPORTANT)

1. Go to your **Web Service** dashboard
2. Scroll down to **"Environment"** section
3. Find **"Services"** or **"Databases"** subsection
4. Click **"Add Database"** or **"Link Service"**
5. Select your PostgreSQL database: `Ecommerce-Postgres`
6. Click **"Link"**

**This will automatically inject the correct `DATABASE_URL` with proper internal networking.**

### Step 2: Add Other Environment Variables

In **Environment** tab, add:

```
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string
PINATA_JWT=your-pinata-jwt-token (optional)
PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs (optional)
```

### Step 3: Deploy Settings

Make sure your Web Service has:

**Build Command:**
```
pnpm install && pnpm build
```

**Start Command:**
```
pnpm run start:prod
```

Or use `pnpm start:prod` directly.

### Step 4: Save and Deploy

1. Click **"Save Changes"**
2. Render will automatically trigger a new deploy
3. Go to **"Logs"** tab to monitor

### Expected Success Logs:

```
[NestFactory] Starting Nest application...
[InstanceLoader] ConfigModule dependencies initialized
[InstanceLoader] TypeOrmCoreModule dependencies initialized
[NestApplication] Nest application successfully started
🚀 App running on port 3000
```

## Alternative: Use External Database URL

If linking doesn't work, try using the **External Database URL** instead:

```
DATABASE_URL=postgresql://ecommerce_postgres_jlrw_user:TahChZD5lNqYD57tBPirGBrUQPyZtrpO@dpg-d43jbmodl3ps73a02gag-a.oregon-postgres.render.com/ecommerce_postgres_jlrw
```

Note the difference:
- Internal: `dpg-d43jbmodl3ps73a02gag-a`
- External: `dpg-d43jbmodl3ps73a02gag-a.oregon-postgres.render.com`

External URL works from anywhere but is slower. Internal URL is faster but only works within Render's private network.

## Troubleshooting

1. **"ENOTFOUND hostname"** → Database not linked, use External URL or link database
2. **"ECONNREFUSED"** → Wrong host/port, check DATABASE_URL format
3. **"Authentication failed"** → Wrong password, check credentials
4. **"Port already in use"** → Check if multiple instances running

## Test After Deploy

Once deployed successfully, test with:

```bash
# Replace with your actual Render URL
curl https://your-app-name.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

