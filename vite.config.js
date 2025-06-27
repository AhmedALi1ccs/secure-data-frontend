const path = require('path');

module.exports = {
  transpileDependencies: true,
  chainWebpack: (config) => {
    const svgRule = config.module.rule('svg');
    svgRule.uses.clear();
    
    svgRule
      .use('babel-loader')
      .loader('babel-loader')
      .end()
      .use('vue-svg-loader')
      .loader('vue-svg-loader');
  },
  configureWebpack: {
    resolve: {
      alias: {
        assets: path.resolve(__dirname, 'src/assets'),
        models: path.resolve(__dirname, './src/models'),
      },
    },
  },
};