<div align="center">

# Soullink

**Intentional connections. No noise.**

A privacy-first, values-aligned dating app built for people who are serious about who they spend their time with.

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.78-61DAFB?logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-20%20LTS-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)

</div>

---

## Product Philosophy

Most dating apps are optimised for engagement — time in app, swipes per session, premium conversions. Soullink is optimised for the opposite: getting you *off* the app and into a conversation with someone who genuinely fits.

That philosophy drives every feature decision:

**Matching modes, not one-size-fits-all.** Users pick a mode — Friendship, Relationship, or Marriage — and only see people in the same mode. No ambiguity about intent. No awkward "so what are you looking for?" conversations.

**Compliments, not openers.** To initiate a match, one person sends a short compliment (200 chars max) tied to something specific in the profile. The recipient decides whether to match. This replaces the pointless "hey" with something that requires 10 seconds of actual thought.

**Hard daily limits.** 100 likes and 5 compliments per day. You can't buy more. Scarcity makes you choosy; it also prevents the burnout and decision fatigue that makes most users churn within a week.

**Verification before discovery.** Every profile requires a live selfie that matches one of the uploaded photos. A human reviews it before the profile goes live. No bots, no catfishes, no stale photos from 2019.

**No algorithms, no ads, no analytics drama.** Match ordering is recency-weighted random, not a feed designed to maximise time-on-screen. There is no ad model. There is no shadow ranking. You see who you see.

---

## Tech Stack

### Mobile (this repo)

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Expo SDK 54 / React Native 0.78 | Managed workflow, OTA updates, single codebase for iOS + Android |
| Navigation | Expo Router v4 (file-based) | Co-locates screens with routes; typed routes via `expo-router/typed-routes` |
| Auth | Clerk (via `@clerk/expo`) | Phone + OTP with no backend session management burden; handles token refresh |
| Server state | TanStack Query v5 | Automatic background refetch, mutation state, optimistic updates |
| Client state | Zustand + `persist` | Tiny bundle, no boilerplate; persists mode + filter preferences to AsyncStorage |
| Realtime | Socket.IO client | Used for typing indicators and instant message delivery in chat |
| Animations | Reanimated 3 + Skia | Worklet-based; runs on the UI thread — zero JS jank |
| Styling | StyleSheet + theme tokens | No CSS-in-JS overhead; typed tokens enforce the design system |
| Image upload | Cloudinary | Direct upload from device; signed presets prevent abuse |

### Backend (separate repo / `backend/` directory)

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 + Express |
| Database | MongoDB via Mongoose |
| Auth middleware | Clerk JWT verification |
| Realtime | Socket.IO server |
| File storage | Cloudinary SDK |
| Validation | Zod |

---

## Architecture Decisions

### File-based routing with Expo Router v4

All screens live under `app/`. Navigation state is part of the URL, which makes deep-linking and push-notification routing trivial. Route groups (`(tabs)`, `(auth)`, `(onboarding)`) let us apply separate layouts without polluting the URL.

```
app/
├── (auth)/          ← sign-in, sign-up — no tab bar
├── (onboarding)/    ← 6-step profile wizard
├── (tabs)/          ← main app: discover, matches, messages, me
├── (verification)/  ← selfie capture
├── chat/[id].tsx    ← individual chat room
├── profile/[userId] ← view another user's profile
└── settings/        ← blocked, report, safety, help
```

### Theme system

Two complete themes (`lightTheme`, `darkTheme`) are defined in `src/constants/theme.ts`. Every color, spacing, radius, and typography value is a token — no hardcoded values anywhere in the component tree. `ThemeContext` provides the active theme; components consume it via `useTheme()`.

Dark mode is the *default emotional mode* — deliberately. Lower ambient arousal reduces evaluative anxiety and makes conversation feel more intimate than a sunny marketplace.

### Matching mode as a first-class concept

`MatchingMode` (`friendship | relationship | marriage`) flows through the entire app:

- Stored in Zustand (`activeMode`)
- Sent as a filter on every `/discover` request
- Colour-coded per mode (sky blue, coral, gold)
- Shown as a pill on every SwipeCard

A user can hold multiple modes simultaneously (e.g. open to both friendship and relationship) but browses one at a time.

### Data fetching

All network calls go through `src/services/endPoints.ts` (thin Axios wrappers) and are consumed exclusively through TanStack Query hooks in `src/hooks/useApi.ts`. Components never call Axios directly. This separation means:

- Easy to mock in tests
- Cache invalidation is declarative (`queryKey` namespacing)
- Error shape is normalised at the Axios interceptor level

### Real-time messaging

Socket.IO is connected once per app session in `src/services/socket.ts` and exposed via `useSocket()`. Messages arrive via `message:new` events and are merged into the TanStack Query cache — no separate message state. Typing indicators use a 3-second debounced emit/clear pattern.

### Photo upload flow

1. User picks image from camera roll (`expo-image-picker`).
2. App generates a **signed Cloudinary upload signature** by calling `POST /api/media/sign` on the backend.
3. Image is uploaded directly from device to Cloudinary (bypassing our backend bandwidth).
4. Cloudinary URL and `publicId` are saved to the user's profile via `PATCH /api/profile`.

This keeps our backend stateless with respect to binary data.

---

## Project Structure

```
soullink/
├── app/                        # Expo Router screens
│   ├── (auth)/
│   ├── (onboarding)/
│   ├── (tabs)/
│   ├── (verification)/
│   ├── chat/
│   ├── profile/
│   └── settings/
├── src/
│   ├── components/
│   │   ├── cards/              # SwipeCard, MatchRow, DiscoverAction
│   │   ├── chat/               # ChatBubble, ChatComposer, TypingIndicator
│   │   ├── onboarding/         # StepShell, PhotoGrid
│   │   └── ui/                 # Design system primitives
│   ├── constants/
│   │   ├── data.ts             # Static lists: interests, religions, REPORT_REASONS…
│   │   └── theme.ts            # Design tokens (light + dark)
│   ├── contexts/
│   │   └── ThemeContext.tsx
│   ├── hooks/
│   │   ├── useApi.ts           # All TanStack Query hooks
│   │   ├── useSocket.ts        # Socket.IO hook
│   │   └── useAuthBridge.ts    # Clerk → backend token bridge
│   ├── services/
│   │   ├── api.ts              # Axios instance + interceptors
│   │   ├── endPoints.ts        # Typed API wrappers
│   │   └── socket.ts           # Socket.IO singleton
│   ├── store/
│   │   ├── useAppStore.ts      # Active mode + filters (persisted)
│   │   └── useOnboardingStore.ts
│   ├── types/
│   │   └── index.ts            # Shared TypeScript interfaces
│   └── utils/
│       ├── format.ts
│       ├── haptics.ts
│       └── modes.ts
├── assets/
├── app.json
├── eas.json
├── zero-to-deploy.md
└── README.md
```

---

## Local Development Setup

### 1. Clone and install

```bash
git clone https://github.com/yourorg/soullink.git
cd soullink
pnpm install          # or npm install
```

### 2. Environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env
```

Minimum required for local dev:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Get your Clerk publishable key from the [Clerk dashboard](https://dashboard.clerk.com).

### 3. Start the backend

```bash
cd backend
cp .env.example .env   # fill in MongoDB URI, Clerk secret, Cloudinary keys
npm install
npm run dev            # nodemon on port 3000
```

### 4. Start the Expo dev server

```bash
cd ..           # back to repo root
pnpm start      # or: npx expo start
```

Press `i` for iOS Simulator, `a` for Android Emulator, or scan the QR with Expo Go on a real device.

### 5. Development client (recommended for full feature parity)

Expo Go doesn't support all native modules used in Soullink. For the most accurate dev experience, build a development client:

```bash
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

Install the resulting build on your device/simulator, then `pnpm start` connects to it automatically.

---

## Key Scripts

```bash
pnpm start              # Start Expo dev server
pnpm run lint           # ESLint
pnpm run typecheck      # tsc --noEmit
pnpm run test           # Jest

eas build --profile preview --platform all    # Internal distribution build
eas update --branch production                # Push OTA update
```

---

## Contributing

1. Branch from `main` using the convention `feat/`, `fix/`, or `chore/`.
2. Keep commits atomic and descriptive.
3. Run `pnpm run typecheck && pnpm run lint` before opening a PR.
4. UI changes should include screenshots for both light and dark mode.
5. New API hooks belong in `useApi.ts`; new endpoint wrappers in `endPoints.ts`.

---

## License

Private — all rights reserved. Not open source.

---

<div align="center">
  <sub>Built with care. No dark patterns.</sub>
</div>
