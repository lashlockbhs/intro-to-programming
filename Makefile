files := $(wildcard *.html)
files += $(wildcard *.css)
files += $(wildcard *.js)
files += $(wildcard *.png)
files += calendar.json
files += outline.txt
files += js

esbuild := ./node_modules/.bin/esbuild
esbuild_opts := --bundle --sourcemap --format=esm

# Only trick here is figuring out exactly which file you need to import.
js_libs := @js-temporal/polyfill/dist/index.esm.js

all: $(addprefix js/, $(js_libs))

js/%.js: ./node_modules/%.js
	$(esbuild) $< $(esbuild_opts) --outfile=$@

pretty:
	prettier -w *.js
	tidy -i -w 80 -m --gnu-emacs yes --quiet yes *.html

publish: build
	./publish.sh $(files)

clean:
	rm -rf ./js
