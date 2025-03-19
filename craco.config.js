const path = require('path');
const dotenv = require('dotenv');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// Load environment variables from .env file
dotenv.config();

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Allow importing files from outside src directory
      webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
        (plugin) => !plugin.constructor.name === 'ModuleScopePlugin'
      );
      
      // Add data directory to module resolution paths
      webpackConfig.resolve.modules = [
        path.resolve(__dirname, './'),
        'node_modules',
      ];

      // Add path alias for data directory
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        data: path.resolve(__dirname, './src/data'),
      };

      // Add fallbacks for node core modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        fs: false,
        stream: require.resolve('stream-browserify'),
        path: require.resolve('path-browserify'),
        crypto: require.resolve('crypto-browserify'),
        zlib: require.resolve('browserify-zlib'),
        assert: require.resolve('assert/'),
      };

      // Copy data files to the build output
      webpackConfig.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              from: path.resolve(__dirname, 'src/data'),
              to: path.resolve(__dirname, 'build/data'),
              globOptions: {
                ignore: [
                  '**/raw/**',           // Ignore raw data
                  '**/*.docx',           // Ignore Word docs
                  '**/*.pdf',            // Ignore PDFs
                  '**/*.mp4',            // Ignore videos
                  '**/*.mov',            // Ignore videos
                  '**/*.avi'             // Ignore videos
                ]
              }
            }
          ]
        })
      );

      // Inject process.env into the bundle
      webpackConfig.plugins.forEach((plugin) => {
        if (plugin.constructor.name === 'DefinePlugin') {
          Object.assign(plugin.definitions['process.env'], {
            ...Object.keys(process.env).reduce((env, key) => {
              env[key] = JSON.stringify(process.env[key]);
              return env;
            }, {})
          });
        }
      });

      return webpackConfig;
    },
  },
}; 