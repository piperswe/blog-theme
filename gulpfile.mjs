import gulp from 'gulp';
const { series, src, dest } = gulp;
import pump from 'pump';
import zip from 'gulp-zip';
import { createGulpEsbuild } from 'gulp-esbuild';
import svgrPlugin from 'esbuild-plugin-svgr';
import { readFileSync } from 'fs';

const gulpEsbuild = createGulpEsbuild({
	incremental: false, // enables the esbuild's incremental build
	piping: true,       // enables piping
})

function pack(done) {
    pump([
        src([
            'assets/js/main.ts',
        ]),
        gulpEsbuild({
            outfile: 'main.js',
            bundle: true,
            minify: true,
            plugins: [
                svgrPlugin()
            ],
            loader: {
                '.ttf': 'file',
                '.woff2': 'file',
                '.woff': 'file',
                '.png': 'file'
            },
            sourcemap: 'linked'
        }),
        dest('assets/built/', { sourcemaps: '.' })
    ], done);
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
    ], done);
}

const build = pack;

const zipTarget = series(build, zipper);

export {
    build,
    zipTarget as zip
};
