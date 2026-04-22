# Soullink — Zero to Production

A complete, opinionated walkthrough from a blank machine to a live app on both stores.
Estimated time: 3–4 hours for a first deployment.

---

## Prerequisites

Install these before starting. All are free unless noted.

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20 LTS | `brew install node` / [nodejs.org](https://nodejs.org) |
| pnpm | latest | `npm i -g pnpm` |
| Expo CLI | latest | `npm i -g expo-cli eas-cli` |
| Git | any | pre-installed on macOS / `apt install git` |
| Railway or Render account | — | [railway.app](https://railway.app) or [render.com](https://render.com) |
| Apple Developer account | $99/yr | [developer.apple.com](https://developer.apple.com) |
| Google Play account | $25 once | [play.google.com/console](https://play.google.com/console) |

---

## 1 — MongoDB Atlas

### 1.1 Create a cluster

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → **New Project** → name it `soullink-prod`.
2. **Build a Database** → choose **M0 Free** for staging or **M10** ($57/mo) for production.
3. Choose a region close to your backend host (e.g. AWS `us-east-1` if you're on Railway US East).
4. Click **Create**.

### 1.2 Network access

1. **Network Access** → **Add IP Address** → `0.0.0.0/0` (allow all).  
   For production, restrict to your Railway/Render static outbound IPs instead.

### 1.3 Database user

1. **Database Access** → **Add New Database User**.
2. Username: `soullink_api`, password: generate a strong one and save it.
3. Role: **Atlas Admin** (or `readWriteAnyDatabase`).

### 1.4 Connection string

1. **Connect** → **Drivers** → copy the connection string.  
   It looks like:
   ```
   mongodb+srv://soullink_api:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
2. Replace `<password>` with the one you set.
3. Append `&appName=soullink` at the end.  
   Keep this — you'll put it in `MONGODB_URI`.

---

## 2 — Clerk Authentication

### 2.1 Create an application

1. [dashboard.clerk.com](https://dashboard.clerk.com) → **Add application**.
2. Name: `Soullink`. Identifier: **Phone number** (required) + optionally email.
3. Click **Create application**.

### 2.2 Note your keys

From **API Keys**:

```
CLERK_PUBLISHABLE_KEY   pk_live_...    (also used as EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY)
CLERK_SECRET_KEY        sk_live_...    (backend only, never expose to client)
```

### 2.3 Configure JWT template (optional but recommended)

1. **JWT Templates** → **New template** → choose **Blank**.
2. Name: `soullink-backend`.
3. Add claim: `"userId": "{{user.id}}"`.
4. Set lifetime to 3600 seconds.

### 2.4 Webhooks (for user creation sync)

1. **Webhooks** → **Add endpoint**.
2. URL: `https://your-api.railway.app/api/webhooks/clerk`
3. Events: `user.created`, `user.deleted`.
4. Copy the **Signing Secret** → `CLERK_WEBHOOK_SECRET`.

---

## 3 — Cloudinary (photo uploads)

### 3.1 Create account

1. [cloudinary.com](https://cloudinary.com) → free tier is sufficient for testing.
2. Dashboard shows your **Cloud name**, **API Key**, **API Secret**.

### 3.2 Create an upload preset

1. **Settings → Upload → Upload presets → Add upload preset**.
2. Name: `soullink_profile_photos`.
3. Signing mode: **Signed**.
4. Folder: `soullink/profiles`.
5. Incoming transformations:
   - Format: `webp`
   - Quality: `auto:good`
   - Max width: `1200`
6. Save.

### 3.3 Note your values

```
CLOUDINARY_CLOUD_NAME   your-cloud-name
CLOUDINARY_API_KEY      123456789012345
CLOUDINARY_API_SECRET   xxxxxxxxxxxxxxxxxxxx
CLOUDINARY_UPLOAD_PRESET  soullink_profile_photos
```

---

## 4 — Environment Variables

### 4.1 Backend `.env`

Create `backend/.env` (never commit this):

```env
# ── App ───────────────────────────────────────────────────────
NODE_ENV=production
PORT=3000

# ── Database ──────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://soullink_api:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/soullink?retryWrites=true&w=majority&appName=soullink

# ── Clerk ─────────────────────────────────────────────────────
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# ── Cloudinary ────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxx
CLOUDINARY_UPLOAD_PRESET=soullink_profile_photos

# ── Misc ──────────────────────────────────────────────────────
CORS_ORIGIN=*
```

### 4.2 Mobile app `.env`

Create `.env` in the repo root:

```env
# Clerk
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...

# API
EXPO_PUBLIC_API_URL=https://your-api.railway.app
```

> `EXPO_PUBLIC_` prefix makes variables accessible in the Expo client bundle.  
> Never put secrets (Clerk Secret Key, Cloudinary secret) here.

---

## 5 — Backend: Deploy to Railway

Railway is the recommended platform for Soullink's backend — zero-config Dockerfile support, instant rollbacks, built-in metrics.

### 5.1 Initialise

```bash
npm install -g @railway/cli
railway login
cd backend
railway init            # creates a new project; name it "soullink-api"
```

### 5.2 Set environment variables

```bash
# Copy each key from backend/.env:
railway variables set MONGODB_URI="mongodb+srv://..."
railway variables set CLERK_SECRET_KEY="sk_live_..."
railway variables set CLERK_WEBHOOK_SECRET="whsec_..."
railway variables set CLOUDINARY_CLOUD_NAME="..."
railway variables set CLOUDINARY_API_KEY="..."
railway variables set CLOUDINARY_API_SECRET="..."
railway variables set NODE_ENV="production"
railway variables set PORT="3000"
```

### 5.3 Deploy

```bash
railway up
```

Railway auto-detects the Dockerfile (or package.json start script) and builds. Deployment takes ~2 minutes.

### 5.4 Get your public URL

```bash
railway domain          # → https://soullink-api-production.up.railway.app
```

Copy this URL — it becomes `EXPO_PUBLIC_API_URL`.

### 5.5 Alternative: Render

If you prefer Render:

1. New **Web Service** → connect your GitHub repo.
2. Root directory: `backend`.
3. Build command: `npm ci`.
4. Start command: `node dist/index.js` (or `npm start`).
5. Add all env vars in the Render dashboard under **Environment**.
6. Deploy.

---

## 6 — EAS Build Configuration

EAS (Expo Application Services) builds native binaries in the cloud. No Xcode or Android Studio required on CI.

### 6.1 Install EAS CLI and log in

```bash
npm install -g eas-cli
eas login                   # uses your Expo account
```

### 6.2 Configure `eas.json`

Create `eas.json` in the repo root:

```json
{
  "cli": {
    "version": ">= 10.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "ios": {
        "enterpriseProvisioning": "adhoc"
      }
    },
    "production": {
      "autoIncrement": true,
      "channel": "production",
      "ios": {
        "enterpriseProvisioning": "universal"
      },
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@apple.email",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_10_CHAR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-key.json",
        "track": "internal"
      }
    }
  }
}
```

### 6.3 Configure `app.json` for production

Make sure these fields are set in `app.json`:

```json
{
  "expo": {
    "name": "Soullink",
    "slug": "soullink-app",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.soullink",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.yourcompany.soullink",
      "versionCode": 1
    },
    "extra": {
      "eas": {
        "projectId": "YOUR_EAS_PROJECT_ID"
      }
    }
  }
}
```

Run `eas build:configure` to auto-fill `projectId`.

### 6.4 EAS Secrets (production env vars in the build)

```bash
eas secret:create --scope project --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "pk_live_..."
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://your-api.railway.app"
```

---

## 7 — iOS: TestFlight Submission

### 7.1 Build for production

```bash
eas build --platform ios --profile production
```

EAS will:
- Ask you to log into your Apple Developer account (first run only).
- Auto-create or reuse provisioning profiles and certificates.
- Upload and build. Takes ~15 minutes.

### 7.2 App Store Connect setup

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com).
2. **My Apps** → **+** → **New App**.
3. Name: `Soullink`, Primary Language, Bundle ID (must match `app.json`), SKU: `soullink-v1`.
4. Fill in **App Information**: category (Social Networking), age rating, privacy policy URL.

### 7.3 Submit to TestFlight

```bash
eas submit --platform ios --profile production
```

EAS uploads the `.ipa` directly to App Store Connect. After a few minutes the build appears in TestFlight.

### 7.4 Internal testing

1. In App Store Connect → **TestFlight** → your build → **Internal Testing** → add testers.
2. Testers receive an email and can install via the TestFlight app.

### 7.5 External testing / App Review

1. **TestFlight → External Groups → Add Group** → add up to 10,000 external testers.
2. Apple reviews external TestFlight builds (usually 24–48h).
3. When ready for full release: **App Store → Submit for Review**.

---

## 8 — Android: Play Console Submission

### 8.1 Build for production

```bash
eas build --platform android --profile production
```

Builds an `.apk` (for internal testing) or `.aab` (App Bundle, required for production). Change `"buildType": "apk"` to `"buildType": "app-bundle"` before submitting to the store.

### 8.2 Google Play Console setup

1. [play.google.com/console](https://play.google.com/console) → **Create app**.
2. Name: `Soullink`, default language, app / game (app), free / paid.
3. Accept declarations.

### 8.3 Service account for EAS Submit

1. Google Play Console → **Setup → API access** → link to a Google Cloud project.
2. Create a **service account** with **Release Manager** role.
3. Download the JSON key → save as `google-play-key.json` in repo root.
4. Add to `.gitignore`: `google-play-key.json`.

### 8.4 Submit

```bash
eas submit --platform android --profile production
```

The build uploads to the **Internal testing** track. Promote to Alpha → Beta → Production in Play Console.

### 8.5 Store listing

Fill in Play Console → **Store presence**:
- Short description (80 chars)
- Full description
- Screenshots: phone (min 2), 7" tablet, 10" tablet
- Feature graphic (1024×500)
- Content rating questionnaire (Social, Dating category)

---

## 9 — OTA Updates (post-launch)

For JS-only changes (no native code change), skip the store entirely:

```bash
eas update --branch production --message "Fix match celebration timing"
```

Users receive the update silently on next launch. No App Review required.

Configure update policy in `app.json`:

```json
"updates": {
  "url": "https://u.expo.dev/YOUR_EAS_PROJECT_ID",
  "checkAutomatically": "ON_LOAD",
  "fallbackToCacheTimeout": 3000
}
```

---

## 10 — Post-Deploy Checklist

- [ ] Backend health check: `curl https://your-api.railway.app/health` → `{ "ok": true }`
- [ ] Clerk webhook: trigger a test from the Clerk dashboard and confirm the backend logs a `user.created` event
- [ ] Cloudinary: upload a test photo through the app and verify it appears in your Cloudinary media library
- [ ] MongoDB: open Atlas → **Collections** → confirm `users` collection is being populated
- [ ] Push notifications: send a test notification from Expo's push tool
- [ ] App Store privacy labels: ensure your privacy manifest in `app.json` lists all accessed API types
- [ ] GDPR / data deletion: confirm the `DELETE /api/account` endpoint removes all user data from MongoDB and Cloudinary
- [ ] Rate limiting: verify the backend returns `429` after exceeding daily swipe limits
- [ ] TestFlight internal build: install on a real device and complete a full onboarding flow

---

## Troubleshooting

**Build fails with `EMFILE: too many open files`**  
Run `ulimit -n 65536` in your terminal before `eas build`.

**Clerk 401 on backend**  
Make sure `CLERK_SECRET_KEY` (not publishable key) is set in your Railway environment.

**MongoDB `MongoServerSelectionError`**  
Check that your Railway outbound IP is whitelisted in Atlas → Network Access.

**EAS `missing apple credentials`**  
Run `eas credentials --platform ios` and follow the interactive setup.

**`expo-image-picker` crashes on Android**  
Ensure `android.permissions` includes `READ_MEDIA_IMAGES` in `app.json` for API 33+.
