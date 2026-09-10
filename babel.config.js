module.exports = function (api) {
  api.cache(true);
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
          },
        },
      ],
    ],
  };
};
