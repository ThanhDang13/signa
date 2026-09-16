const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [
  monorepoRoot,
  path.resolve(monorepoRoot, "packages"),
  path.resolve(projectRoot, "src")
];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules")
];

config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, "node_modules/react"),
  "react-native": path.resolve(projectRoot, "node_modules/react-native"),
  "@signa/android": path.resolve(projectRoot, "src")
};

config.resolver.sourceExts = [...(config.resolver.sourceExts || []), "ts", "tsx"];

config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: false
};

config.transformer.unstable_allowRequireContext = true;
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true
  }
});

config.cacheStores = [
  {
    get: async () => null,
    set: async () => {},
    clear: async () => {}
  }
];

module.exports = withNativeWind(config, { input: "./src/global.css", inlineRem: 16 });
