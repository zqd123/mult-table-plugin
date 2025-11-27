const path = require('path');// 引入 Node.js 内置的路径模块
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');// 引入用于热模块替换的插件
const HtmlWebpackPlugin = require('html-webpack-plugin');// 引入用于生成 HTML 文件的插件
const {ESBuildMinifyPlugin} = require('esbuild-loader');// 引入用于压缩代码的插件
const MiniCssExtractPlugin = require('mini-css-extract-plugin');// 引入用于提取 CSS 的插件
const WebpackBar = require('webpackbar');// 引入用于显示构建进度的插件
const {
    BitableAppWebpackPlugin,
    opdevMiddleware
} = require('@lark-opdev/block-bitable-webpack-utils');
const {VueLoaderPlugin} = require("vue-loader");
// 引入用于多维表格功能的插件和中间件

const cwd = process.cwd();// 获取当前工作目录的路径
const isDevelopment = process.env.NODE_ENV === 'development';// 判断是否为开发环境
const isProduction = process.env.NODE_ENV === 'production';// 判断是否为生产环境

const config = {
    entry: './src/index.js',// 指定入口文件路径
    devtool: isProduction ? false : 'inline-source-map',// 根据环境选择是否启用源映射
    mode: isDevelopment ? 'development' : 'production',// 根据环境设置构建模式
    stats: 'errors-only',// 配置编译输出的统计信息显示级别，只展示错误信息
    output: {
        path: path.resolve(__dirname, '../dist'),// 设置输出目录的绝对路径
        clean: true,// 构建之前清空输出目录
        publicPath: isDevelopment ? '/block/' : './',// 根据环境设置公共资源的路径
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
            },
            {
                test: /\.js$/,// 匹配以 .js 结尾的文件
                include: [/node_modules\/@lark-open/],// 指定需要处理的文件路径
                use: ['source-map-loader'],// 使用 source-map-loader 进行预处理
                enforce: 'pre',// 在其他加载器之前执行
            },
            {
                oneOf: [
                    {
                        test: /\.[jt]sx?$/,// 匹配以 .js、.jsx、.ts 或 .tsx 结尾的文件
                        include: [path.join(cwd, 'src')],// 指定需要处理的文件路径
                        exclude: /node_modules/,// 排除 node_modules 目录下的文件
                        use: [
                            {
                                loader: require.resolve('esbuild-loader'),// 使用 esbuild-loader 进行转换
                                options: {
                                    loader: 'tsx',// 指定加载器类型为 tsx
                                    target: 'es2015',// 指定目标浏览器环境为 ES2015
                                },
                            },
                        ],
                    },
                    {
                        test: /\.css$/,// 匹配以 .css 结尾的文件
                        use: [
                            isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,// 根据环境选择不同的处理方式
                            'css-loader',// 使用 css-loader 处理 CSS 文件
                        ],
                    },
                    {
                        test: /\.less$/,// 匹配以 .less 结尾的文件
                        use: [
                            isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,// 根据环境选择不同的处理方式
                            'css-loader',// 使用 css-loader 处理 CSS 文件
                            'less-loader',// 使用 less-loader 处理 LESS 文件
                        ],
                    },
                    {
                        test: /\.(png|jpg|jpeg|gif|ico|svg)$/,// 匹配以 .png、.jpg、.jpeg、.gif、.ico 或 .svg 结尾的文件
                        type: 'asset/resource',// 使用资源模块类型处理
                        generator: {
                            filename: 'assets/[name][ext][query]',// 设置输出的文件名格式
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        ...(isDevelopment
            ? [new ReactRefreshWebpackPlugin(), new WebpackBar()]// 根据开发环境添加热模块替换插件和构建进度显示插件
            : [new MiniCssExtractPlugin()]),// 生产环境下使用 MiniCssExtractPlugin 插件提取 CSS
        // new BitableAppWebpackPlugin({
        //     // open: true, // 控制是否自动打开多维表格
        // }),// 添加多维表格功能插件
        new HtmlWebpackPlugin({
            filename: 'index.html',// 指定生成的 HTML 文件名
            template: './public/index.html',// 指定 HTML 模板文件
            publicPath: isDevelopment ? '/block/' : './',// 设置公共资源的路径
        }),// 用于生成 HTML 文件的插件
        new VueLoaderPlugin()
    ],
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.vue'],// 配置模块解析时自动补全的扩展名
    },
    optimization: {
        minimize: isProduction,// 根据环境设置是否压缩代码
        minimizer: [new ESBuildMinifyPlugin({target: 'es2015', css: true})],// 使用 ESBuildMinifyPlugin 插件压缩代码
        moduleIds: 'deterministic',// 根据模块内容创建简短的 id
        runtimeChunk: true,// 将 Runtime 代码拆分为单独的文件
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    name: 'vendor',
                    test: /[\\/]node_modules[\\/]/,
                    chunks: 'all',
                },
            },
        },// 将第三方依赖库拆分为 vendor 包
    },
    devServer: isProduction
        ? undefined
        : {
            hot: true,// 启用热模块替换
            client: {
                logging: 'error',// 控制客户端的日志级别
            },
            setupMiddlewares: (middlewares, devServer) => {
                if (!devServer || !devServer.app) {
                    throw new Error('webpack-dev-server is not defined');
                }
                // middlewares.push(opdevMiddleware(devServer));// 添加自定义中间件 opdevMiddleware
                return middlewares;
            },
        },// 开发服务器配置
    cache: {
        type: 'filesystem',// 使用文件系统缓存
        buildDependencies: {
            config: [__filename],
        },// 缓存的依赖列表
    },
};
module.exports = config;
