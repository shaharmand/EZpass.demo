const path = require('path');
const dotenv = require('dotenv');

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
        data: path.resolve(__dirname, './data'),
      };

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