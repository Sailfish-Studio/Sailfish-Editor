const APP_NAME = 'Sailfish-Studio';

export { APP_NAME };

// Legacy CJS export for build scripts
// eslint-disable-next-line import/no-commonjs
if (typeof module !== 'undefined') module.exports = { APP_NAME };
