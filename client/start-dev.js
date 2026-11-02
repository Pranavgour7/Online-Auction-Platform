'use strict';

process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';
process.env.PORT = process.env.PORT || '3000';
process.env.HOST = '0.0.0.0';
process.env.DANGEROUSLY_DISABLE_HOST_CHECK = 'true';
process.env.GENERATE_SOURCEMAP = 'false';
process.env.DISABLE_ESLINT_PLUGIN = 'true';
process.env.FAST_REFRESH = 'false';

const path = require('path');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const chalk = require('react-dev-utils/chalk');
const paths = require('react-scripts/config/paths');
const configFactory = require('react-scripts/config/webpack.config');
const createDevServerConfig = require('react-scripts/config/webpackDevServer.config');
const { prepareProxy } = require('react-dev-utils/WebpackDevServerUtils');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = '0.0.0.0';

console.log(chalk.cyan('==================================================='));
console.log(chalk.cyan('   AuctionHub Client - Starting Development Server'));
console.log(chalk.cyan('==================================================='));

try {
  const config = configFactory('development');
  const compiler = webpack(config);

  const proxySetting = require(paths.appPackageJson).proxy;
  const proxyConfig = prepareProxy(proxySetting, paths.appPublic, paths.publicUrlOrPath);

  const baseServerConfig = createDevServerConfig(proxyConfig, undefined);
  const serverConfig = {
    ...baseServerConfig,
    host: HOST,
    port: PORT,
    allowedHosts: 'all',
    client: {
      ...baseServerConfig.client,
      webSocketURL: {
        hostname: 'localhost',
        pathname: '/ws',
        port: PORT,
      },
      overlay: {
        errors: true,
        warnings: false,
      },
    },
  };

  const devServer = new WebpackDevServer(serverConfig, compiler);

  compiler.hooks.done.tap('AuctionHubDone', (stats) => {
    const hasErrors = stats.hasErrors();
    const hasWarnings = stats.hasWarnings();
    if (hasErrors) {
      console.log(chalk.red('❌ Compilation failed with errors:'));
      console.error(stats.toString({ colors: true, modules: false, children: false }));
    } else {
      console.log(chalk.green('✔ Compiled successfully!'));
      console.log(chalk.bold(`🚀 Application is live at: http://localhost:${PORT}`));
      if (hasWarnings) {
        console.log(chalk.yellow('⚠️ Compiled with warnings (source maps or non-critical hints).'));
      }
    }
  });

  devServer.start().then(() => {
    console.log(chalk.green(`📡 WebpackDevServer listening on http://localhost:${PORT}`));
  }).catch((err) => {
    console.error(chalk.red('Failed to start WebpackDevServer:'), err);
    process.exit(1);
  });

  ['SIGINT', 'SIGTERM'].forEach((sig) => {
    process.on(sig, () => {
      devServer.stop().then(() => process.exit(0));
    });
  });
} catch (err) {
  console.error(chalk.red('Initialization error:'), err);
  process.exit(1);
}
