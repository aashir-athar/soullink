// babel.config.js
// SDK 54 note: babel-preset-expo automatically includes the Reanimated plugin
// and handles react-native-worklets. No manual plugin additions needed for
// our dependency set.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};