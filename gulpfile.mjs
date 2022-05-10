import gulp from 'gulp';
const { series, parallel, watch, src, dest } = gulp;
import pump from 'pump';

// gulp plugins and utils
import livereload from 'gulp-livereload';
import gulpStylelint from 'gulp-stylelint';
import beeper from 'beeper';
import zip from 'gulp-zip';
import webpackStream from 'webpack-stream';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import webpack from 'webpack';
import { readFileSync } from 'fs';

function serve(done) {
    livereload.listen();
    done();
}

function handleError(done) {
    return function (err) {
        if (err) {
            beeper();
        }
        return done(err);
    };
};

function hbs(done) {
    pump([
        src(['*.hbs', 'partials/**/*.hbs', 'members/**/*.hbs']),
        livereload()
    ], handleError(done));
}

function pack(done) {
    pump([
        src([
            'assets/js/main.js',
        ]),
        webpackStream({
            entry: ['regenerator-runtime/runtime.js', './assets/js/main.js'],
            mode: process.env.NODE_ENV || 'production',
            devtool: 'source-map',
            module: {
                rules: [
                    {
                        test: /\.m?js$/,
                        use: {
                            loader: 'babel-loader',
                            options: {
                                presets: [
                                    '@babel/preset-env',
                                    '@babel/preset-react',
                                ],
                                compact: true,
                            },
                        },
                    },
                    {
                        test: /\.svg$/,
                        use: ['@svgr/webpack'],
                    },
                    {
                        test: /\.css$/i,
                        use: [
                            MiniCssExtractPlugin.loader,
                            'css-loader',
                            {
                                loader: 'postcss-loader',
                                options: {
                                    postcssOptions: {
                                        plugins: [
                                            'postcss-preset-env',
                                            'autoprefixer',
                                        ],
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
            plugins: [
                new MiniCssExtractPlugin(),
                new CssMinimizerPlugin(),
                new webpack.EnvironmentPlugin({
                    'REACT_APP_VERSION': process.env.REACT_APP_VERSION || '1.11.0'
                }),
            ],
        }),
        dest('assets/built/', { sourcemaps: '.' }),
        livereload()
    ], handleError(done));
}

function lint(done) {
    pump([
        src(['assets/css/**/*.css', '!assets/css/vendor/*']),
        gulpStylelint({
            fix: true,
            reporters: [
                { formatter: 'string', console: true }
            ]
        }),
        dest('assets/css/')
    ], handleError(done));
}

function zipper(done) {
    const filename = JSON.parse(readFileSync('./package.json').toString()).name + '.zip';

    pump([
        src([
            '**',
            '!node_modules', '!node_modules/**',
            '!dist', '!dist/**',
            '!yarn-error.log'
        ]),
        zip(filename),
        dest('dist/')
    ], handleError(done));
}

const hbsWatcher = () => watch(['*.hbs', 'partials/**/*.hbs', 'members/**/*.hbs'], hbs);
const jsWatcher = () => watch('assets/js/**/*.js', pack);
const watcher = parallel(hbsWatcher, jsWatcher);
const build = pack;

const zipTarget = series(build, zipper);
const defaultTarget = series(build, serve, watcher);

export {
    build,
    lint,
    zipTarget as zip,
    defaultTarget as defaultTarget
};
