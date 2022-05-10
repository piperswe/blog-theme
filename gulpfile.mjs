import gulp from 'gulp';
const { series, parallel, watch, src, dest } = gulp;
import pump from 'pump';
import livereload from 'gulp-livereload';
import gulpStylelint from 'gulp-stylelint';
import beeper from 'beeper';
import zip from 'gulp-zip';
import { createGulpEsbuild } from 'gulp-esbuild';
import svgrPlugin from 'esbuild-plugin-svgr';
import { readFileSync } from 'fs';

const gulpEsbuild = createGulpEsbuild({
	incremental: true, // enables the esbuild's incremental build
	piping: true,      // enables piping
})

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
        gulpEsbuild({
            outfile: 'main.js',
            bundle: true,
            minify: true,
            plugins: [
                svgrPlugin(),
                // postCssPlugin({
                //     plugins: [
                //         postcssPreset,
                //         autoprefixer
                //     ],
                // })
            ],
            loader: {
                '.ttf': 'file',
                '.woff2': 'file',
                '.woff': 'file',
                '.png': 'file'
            },
            sourcemap: 'linked'
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
    defaultTarget as default
};
