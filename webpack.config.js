const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

const WEBPACK_DEV_SERVER_PORT = 3045;
const DIST_DIR = path.join(__dirname, "dist");

module.exports = (env, argv) => {
    const isDev = argv.mode === "development";

    return {
        devServer: {
            hot: false,
            open: false,
            client: false,
            allowedHosts: "all",
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
                "Access-Control-Expose-Headers": "Content-Length",
                "Access-Control-Allow-Headers": "Accept, Authorization, Content-Type, X-Requested-With, Range",
            },
            port: WEBPACK_DEV_SERVER_PORT,
            compress: true,
            devMiddleware: {
                writeToDisk: true,
            },
        },
        devtool: false ? "source-map" : "inline-source-map",
        entry: "./src/index.ts",
        mode: "development",
        module: {
            rules: [
                {
                    test: /\.tsx?$/i,
                    exclude: /node_modules/,
                    use: [{
                        loader: "ts-loader",
                        options: {
                            configFile: "tsconfig.json",
                        },
                    }],
                },
                {
                    test: /\.(png|jpe?g|gif|svg)$/i,
                    exclude: /node_modules/,
                    type: "asset/resource",
                    generator: {
                        filename: "images/[name][ext][query]",
                    },
                }
            ],
        },
        optimization: {
            minimize: true,
            minimizer: [new TerserPlugin()],
        },
        output: {
            path: DIST_DIR,
            publicPath: "/",
            //filename: `${env.stable == "true" ? "stable" : "dev"}Bundle.js`,
            filename: `bundle.js`,
        },
        plugins: [
            new webpack.DefinePlugin({
                __DEV__: JSON.stringify(true),
                __DEV_BASE_PATH__: JSON.stringify(process.env.DEV_BASE_PATH || ""),
            }),
            new CopyPlugin({
                patterns: [
                    {
                        from: path.resolve(__dirname, "src/images"),
                        to: "images",
                    },
                ],
            }),
        ],
        resolve: {
            extensions: [".ts", ".tsx", ".js"],
            alias: {
                "@": path.resolve(__dirname, "src"),
            },
        },
        performance: false,
    };
};