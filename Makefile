files := index.html
files += style.css
files += calendar.json
files += outline.txt
files += js

pretty:
	prettier -w *.js
	tidy -i -w 80 -m --gnu-emacs yes --quiet yes *.html

serve:
	./node_modules/.bin/esbuild web.js --servedir=. --outdir=./js --bundle --sourcemap

build:
	./node_modules/.bin/esbuild web.js --outdir=./js --bundle --sourcemap

publish: build
	./publish.sh $(files)

clean:
	rm -rf ./js
