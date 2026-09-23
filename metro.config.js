const path = require('node:path');
const { getDefaultConfig } = require('@expo/metro-config');
const { FileStore } = require('@expo/metro-config/file-store');

const config = getDefaultConfig(__dirname);

// Expo's default Metro cache lives in the OS temp directory. On some Windows
// setups that directory is read-only for the dev-server process, which causes
// every transformed module to fail its cache write and can leave clients on a
// blank screen. Keep the disposable cache inside Expo's ignored project data.
config.cacheStores = [
  new FileStore({
    root: path.join(__dirname, '.expo', 'metro-cache'),
  }),
];

module.exports = config;
