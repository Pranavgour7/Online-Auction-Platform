'use strict';

process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';
process.env.CI = 'false';
process.env.GENERATE_SOURCEMAP = 'false';
process.env.DISABLE_ESLINT_PLUGIN = 'true';
process.env.BROWSERSLIST_IGNORE_OLD_DATA = 'true';

const fs = require('fs-extra');
const path = require('path');
const webpack = require('webpack');
const chalk = require('react-dev-utils/chalk');
const paths = require('react-scripts/config/paths');
const configFactory = require('react-scripts/config/webpack.config');

console.log(chalk.cyan('Starting build...'));

try {
  fs.emptyDirSync(paths.appBuild);
  fs.copySync(paths.appPublic, paths.appBuild, {
    dereference: true,
    filter: file => file !== paths.appHtml,
  });

  const config = configFactory('production');
  config.devtool = false;

  config.plugins.push(
    new webpack.ProgressPlugin((percentage, message, ...args) => {
      const pct = Math.round(percentage * 100);
      if (pct >= 85 || pct % 10 === 0) {
        console.log(`[Webpack] ${pct}%: ${message} ${args.slice(0, 2).join(' ')}`);
      }
    })
  );

  console.log(chalk.blue('Running webpack compiler...'));
  webpack(config, (err, stats) => {
    if (err) {
      console.error(chalk.red('Fatal Webpack error:'), err);
      process.exit(1);
    }

    const info = stats.toJson({ all: false, warnings: true, errors: true });

    if (stats.hasErrors()) {
      console.error(chalk.red('❌ Compilation failed with errors:'));
      info.errors.forEach(e => console.error(e.message || e));
      process.exit(1);
    }

    if (stats.hasWarnings()) {
      console.log(chalk.yellow(`⚠️ Compiled with ${info.warnings.length} warning(s).`));
    }

    console.log(chalk.green('✔ Production build completed successfully!'));
    console.log(chalk.green(`📁 Output directory: ${paths.appBuild}`));
    process.exit(0);
  });
} catch (error) {
  console.error(chalk.red('Build script error:'), error);
  process.exit(1);
}
