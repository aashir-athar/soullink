// shims/expo-crypto-aes-shim.js
//
// WHY THIS EXISTS
// ---------------
// @clerk/clerk-expo v2 pulls in expo-auth-session → expo-crypto, which (in
// SDK 54) imports the native module "ExpoCryptoAES". That native module is
// NOT bundled inside Expo Go, so the app crashes at import-time with:
//     [Error: Cannot find native module 'ExpoCryptoAES']
//
// This shim replaces the AES native module with a no-op stub. It is SAFE
// for our app because we only use Clerk's email/password flow — AES is
// only invoked by SSO / OAuth code paths, which we never call.
//
// HOW IT WIRES UP
//   metro.config.js → resolver.resolveRequest maps the broken specifier to
//   this file, so the import resolves instead of throwing.
//
// WHEN TO REMOVE
//   The moment you switch to a development build (`npx expo prebuild` +
//   `expo run:ios` / EAS dev build) — the real native module is available
//   there, and this shim should be removed along with the resolver hook
//   in metro.config.js. See zero-to-deploy.md.

const notAvailable = () => {
  throw new Error(
    '[Soullink] AES crypto is not available in Expo Go. ' +
      'Create a development build to use SSO / OAuth features.'
  );
};

module.exports = {
  // Exported name must match the native module key expo-crypto looks up.
  default: {
    encrypt: notAvailable,
    decrypt: notAvailable,
    encryptAsync: notAvailable,
    decryptAsync: notAvailable,
  },
  encrypt: notAvailable,
  decrypt: notAvailable,
  encryptAsync: notAvailable,
  decryptAsync: notAvailable,
};
