import path from "path";
import webpack from "webpack";
import { URL } from "node:url";

const __dirname = new URL(".", import.meta.url).pathname;

export default {
  devtool: "eval-cheap-source-map",
  entry: "./src/index.js",
  mode: process.env.NODE_ENV || "development",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "public/dist/"),
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || "development"),
        APP_ENV: JSON.stringify("browser"),
      },
    }),
  ],
  module: {
    rules: [
      {
        loader: "babel-loader",
        test: /\.js$|jsx/,
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
};
