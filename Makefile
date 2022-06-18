pretty:
	prettier -w *.js
	tidy -i -w 80 -m --gnu-emacs yes --quiet yes *.html

serve:
	./node_modules/.bin/esbuild web.js --servedir=. --outdir=./js --bundle --sourcemap

build:
	./node_modules/.bin/esbuild web.js --outdir=./js --bundle --sourcemap

clean:
	rm -rf ./js
