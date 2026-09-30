const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const sharedTamaguiModules = {
  '@tamagui/core': fs.realpathSync(path.resolve(__dirname, 'node_modules/@tamagui/core')),
  '@tamagui/web': fs.realpathSync(path.resolve(__dirname, 'node_modules/@tamagui/web')),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const packageName = Object.keys(sharedTamaguiModules).find(
    (name) => moduleName === name || moduleName.startsWith(`${name}/`),
  );
  if (packageName) {
    const suffix = moduleName.slice(packageName.length);
    return context.resolveRequest(context, `${sharedTamaguiModules[packageName]}${suffix}`, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
