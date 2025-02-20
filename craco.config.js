const path = require('path');

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

      return webpackConfig;
    },
  },
}; 