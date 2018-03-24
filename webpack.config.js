const path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = [
  {
    entry: './lib/main.ts',
    context: path.join(__dirname, './src'),
    output: {
      filename: 'background.js',
      path: path.resolve(__dirname, './dist')
    },
    module:{
      rules:[
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: [ '.tsx', '.ts', '.js' ],
      modules: [
        path.resolve('./src')
      ]
    },
    devtool: 'inline-source-map',
    plugins: [
      new CopyWebpackPlugin([
        { from: '_locales', to: "_locales" },
        { from: 'manifest.json' },
        { from: 'options_addon_details.html' },
        { from: 'spa.html' }
      ])
    ]
  }
  ,{
    entry: './lib/get_userscript_from_page/content.ts',
    context: path.join(__dirname, './src'),
    output: {
      filename: 'get_userscript_from_page.js',
      path: path.resolve(__dirname, './dist')
    },
    module:{
      rules:[
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: [ '.tsx', '.ts', '.js' ],
      modules: [
        path.resolve('./src')
      ]
    },
    devtool: 'inline-source-map'
  }
  , {
    entry: './gui/options/typescript/startup.ts',
    context: path.join(__dirname, './src'),
    output: {
      filename: 'gui/options.js',
      path: path.resolve(__dirname, './dist')
    },
    module:{
      rules:[
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: [ '.tsx', '.ts', '.js' ],
      modules: [
        path.resolve('./src'),
        path.resolve('./src/gui/options/typescript'),
        "node_modules"
      ]
    },
    externals: {
      jQuery: {
        commonjs: "jQuery",
        root: "$" // indicates global variable
      },
      highlightjs: {
        commonjs: "highlightjs",
        root: "hljs" // indicates global variable
      }
    },
    plugins: [
      new CopyWebpackPlugin([
        { from: 'gui', to: "gui", ignore: ["*.ts"] },
      ])
    ]
  }
];