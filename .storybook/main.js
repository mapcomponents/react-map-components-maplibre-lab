const path = require("path");
const fs = require("fs");
const { merge } = require("webpack-merge");

function getPackageDir(filepath) {
  let currDir = path.dirname(require.resolve(filepath));
  while (true) {
    if (fs.existsSync(path.join(currDir, "package.json"))) {
      return currDir;
    }
    const { dir, root } = path.parse(currDir);
    if (dir === root) {
      throw new Error(
        `Could not find package.json in the parent directories starting from ${filepath}.`
      );
    }
    currDir = dir;
  }
}

module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/preset-create-react-app",
  ],
  webpackFinal: async (config, { configType }) => {
    // split into more chunks
    config.optimization = {
      splitChunks: {
        chunks: "all",
        minSize: 30 * 1024, // 30KB
        maxSize: 1024 * 1024, // 1MB
      },
    };
    let aliases = {
      "@emotion/core": getPackageDir("@emotion/react"),
      "@emotion/styled": getPackageDir("@emotion/styled"),
      "@mapcomponents/react-core": getPackageDir("@mapcomponents/react-core"),
      "@deck.gl/aggregation-layers": getPackageDir("@deck.gl/aggregation-layers"),
      "@deck.gl/core": getPackageDir("@deck.gl/core"),
      "@deck.gl/extensions": getPackageDir("@deck.gl/extensions"),
      "@deck.gl/geo-layers": getPackageDir("@deck.gl/geo-layers"),
      "@deck.gl/layers": getPackageDir("@deck.gl/layers"),
      "@deck.gl/mapbox": getPackageDir("@deck.gl/mapbox"),
      "@deck.gl/mesh-layers": getPackageDir("@deck.gl/mesh-layers"),
    };
    console.log(aliases);

    return merge(config, {
      resolve: {
        alias: aliases,
      },
    });
  },
};
