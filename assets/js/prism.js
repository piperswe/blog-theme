import Prism from 'prismjs';

window.Prism = Prism;
require('prismjs/components/prism-markup');
require('prismjs/components/prism-clike');
require('prismjs/components/prism-css');
require('prismjs/components/prism-javascript');
require('prismjs/components/prism-nix');
require('prismjs/components/prism-bash');
require('prismjs/components/prism-shell-session');
require('prismjs/components/prism-json');
require('prismjs/components/prism-yaml');
require('prismjs/components/prism-rust');
require('prismjs/components/prism-clojure');
require('prismjs/components/prism-go');
require('prismjs/components/prism-nginx');

export default Prism;
