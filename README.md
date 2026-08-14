# Bria by Brighthouse

## Project Structure

```
BrightHouse/
├── api/          ← Node.js + Fastify backend
└── bria/         ← React Native (Expo SDK 56) app
```

## Quick Start

### 1. Set up Supabase
- Create project at supabase.com
- Run `bria/supabase/schema.sql` in the SQL Editor
- Copy URL + anon key → `bria/.env.local`
- Copy URL + service role key → `api/.env`

### 2. Add API keys
- Anthropic API key → `api/.env`

### 3. Run the API
```bash
cd api
npm run dev
# Running on http://localhost:3000
```

### 4. Run the app
```bash
cd bria
npx expo start
```

## Building an APK for testing

### 1. Expose API with devtunnel
```bash
devtunnel host -p 3000
# Copy the https URL e.g. https://abc123.devtunnels.ms
```

### 2. Update app env
In `bria/.env.local`:
```
EXPO_PUBLIC_API_URL=https://abc123.devtunnels.ms
```

### 3. Build APK
```bash
cd bria
npx eas build --platform android --profile preview
# Download .apk from expo.dev and install on device
```
