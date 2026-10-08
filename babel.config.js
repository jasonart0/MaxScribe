const fs = require("node:fs");
const path = require("node:path");

module.exports = function (api) {
  const isProduction = api.env("production");
  // eslint-disable-next-line no-undef
  const localTestAudio = path.resolve(__dirname, ".local-test-assets/test-recording.mp3");
  const includeLocalTestAudio = !isProduction && process.env.EAS_BUILD !== "true" && fs.existsSync(localTestAudio);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./app"],
          alias: {
            "@navigation": "./app/navigation",
            "@screens": "./app/screens",
            "@components": "./app/components",
            "@constants": "./app/constants",
            "@lib": "./app/lib",
            "@model": "./app/model",
            "@store": "./app/store",
            "@assets": "./app/assets",
            "@config": "./app/config",
            "@context": "./app/context",
            "@hooks": "./app/hooks",
            // Local development gets the ignored MP3; release builds and other
            // machines resolve a safe null module, so they never need the file.
            "@local-test-audio": includeLocalTestAudio
              ? localTestAudio
              : "./app/config/noLocalTestAudio.ts",
          },
        },
      ],
    ],
  };
};
