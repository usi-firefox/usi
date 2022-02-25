const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const usi_version_number = require("./package.json").version;
const ReplaceInFileWebpackPlugin = require("replace-in-file-webpack-plugin");
const VueLoaderPlugin = require("vue-loader/lib/plugin");

// Ausgelagert für ts-loader 4.3.1 und höher
const tsLoaderConfig = {
  loader: "ts-loader",
  options: {
    appendTsSuffixTo: [/\.vue$/],
  },
};

module.exports = [
  {
    entry: "./lib/main.ts",
    context: path.join(__dirname, "./src"),
    output: {
      filename: "js/background.js",
      path: path.resolve(__dirname, "./dist"),
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: tsLoaderConfig,
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
      modules: [
        path.resolve("./src"),
      ],
    },

    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: "_locales", to: "_locales" },
          { from: "manifest.json" },
          { from: "lib/GM/GM_Frontend.js", to: "js/GM_Frontend.js" },
          { from: "html", to: "html" },
        ]
      }),
    ],
  }
  , {
    entry: "./lib//spa/watcher.ts",
    context: path.join(__dirname, "./src"),
    output: {
      filename: "js/spa_watcher.js",
      path: path.resolve(__dirname, "./dist"),
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: tsLoaderConfig,
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
      modules: [
        path.resolve("./src"),
      ],
    },

  }
  , {
    entry: "./lib/page_install_userscript/page_install_userscript.ts",
    context: path.join(__dirname, "./src"),
    output: {
      filename: "js/page_install_userscript.js",
      path: path.resolve(__dirname, "./dist"),
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: tsLoaderConfig,
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
      modules: [
        path.resolve("./src"),
      ],
    },

  }
  , {
    optimization: {
      minimize: false
    },
    entry: "./gui/typescript/Startup.ts",
    context: path.join(__dirname, "./src"),
    output: {
      filename: "js/usi-gui.js",
      path: path.resolve(__dirname, "./dist"),
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          use: [
            {
              loader: "vue-loader",
              options: {
                loaders: {
                  // Since sass-loader (weirdly) has SCSS as its default parse mode, we map
                  // the "scss" and "sass" values for the lang attribute to the right configs here.
                  // other preprocessors should work out of the box, no loader config like this necessary.
                  "scss": "style-loader!css-loader!sass-loader",
                  "sass": "style-loader!css-loader!sass-loader?indentedSyntax",
                  "ts": tsLoaderConfig,
                },
                // other vue-loader options go here
              },
            }
          ]
        },
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: tsLoaderConfig,
        },
        {
          test: /\.css$/,
          use: [
            "style-loader",
            "css-loader",
          ],
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".vue", ".js"],
      alias: {
        // Workaround für die Full Version inklusive "Compiler"
        "vue$": "vue/dist/vue.esm.js",
      }
      ,
      modules: [
        path.resolve("./src"),
        path.resolve("./src/gui/typescript"),
        "node_modules",
      ],
    },
    externals: {
      jQuery: {
        commonjs: "jQuery",
        root: "$", // indicates global variable
      },
    },

    plugins: [
      // new webpack.DefinePlugin({
      // }),
      new ReplaceInFileWebpackPlugin([{
        dir: "dist",
        files: ["manifest.json"],
        rules: [{
          search: "###USI-VERSION###",
          replace: usi_version_number,
        }],
      }]),
      new VueLoaderPlugin(),
      new CopyWebpackPlugin({
        patterns: [
          { from: "gui", to: "gui", globOptions: { ignore: ["*.ts", "*.vue"] } },
        ]
      }),
    ],
  },
];
