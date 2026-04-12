module.exports = function babelConfig(api) {
  api.cache(true);

  return {
    // Expo's preset keeps Jest and Metro aligned with the app runtime.
    presets: ['babel-preset-expo'],
  };
};
