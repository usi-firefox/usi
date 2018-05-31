const path = require('path');
var webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = [
  {
    entry: './lib/main.ts',
    context: path.join(__dirname, './src'),
    output: {
      filename: 'background.js',
      path: path.resolve(__dirname, './dist')
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      modules: [
        path.resolve('./src')
      ]
    },
    devtool: 'inline-source-map',
    plugins: [
      new CopyWebpackPlugin([
        { from: '_locales', to: "_locales" },
        { from: 'manifest.json' },
        { from: 'lib/GM/GM_Frontend.js', to: 'GM_Frontend.js' },
        { from: 'options_addon_details.html' },
        { from: 'spa.html' }
      ])
    ]
  }
  , {
    entry: './lib/get_userscript_from_page/content.ts',
    context: path.join(__dirname, './src'),
    output: {
      filename: 'get_userscript_from_page.js',
      path: path.resolve(__dirname, './dist')
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      modules: [
        path.resolve('./src')
      ]
    },
    devtool: 'inline-source-map'
  }
  , {
    entry: './gui/options/typescript/Startup.ts',
    context: path.join(__dirname, './src'),
    output: {
      filename: 'gui/usi-gui.js',
      path: path.resolve(__dirname, './dist')
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            loaders: {
              // Since sass-loader (weirdly) has SCSS as its default parse mode, we map
              // the "scss" and "sass" values for the lang attribute to the right configs here.
              // other preprocessors should work out of the box, no loader config like this necessary.
              'scss': 'vue-style-loader!css-loader!sass-loader',
              'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax',
            }
            // other vue-loader options go here
          }
        },
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          exclude: /node_modules/,
          options: {
            appendTsSuffixTo: [/\.vue$/]
          }
        }
      ]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.vue', '.js'],
      alias: {
        // Workaround für die Full Version inklusive "Compiler"
        "vue$": 'vue/dist/vue.esm.js'
      }
      ,
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
    devtool: 'inline-source-map',
    plugins: [
      new CopyWebpackPlugin([
        { from: 'gui', to: "gui", ignore: ["*.ts", "*.vue"] },
      ])
      ,
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: '"production"'
        }
      })
    ]
  }
];