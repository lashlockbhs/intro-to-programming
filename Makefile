SHELL := bash -O globstar

# Tool setup

eslint_opts := --format unix
eslint_strict_opts := --rule 'no-console: 1'

# Files

all:
	npx @11ty/eleventy

setup:
	npm install

pretty:
	prettier -w src/**/*.js src/**/*.css src/**/*.json

tidy:
	tidy -config .tidyconfig src/**/*.html

lint:
	npx eslint $(eslint_opts) src/**/*.js

fixmes:
	ag --no-group FIXME

ready: pretty lint


strict_lint:
	npx eslint $(eslint_opts) $(eslint_strict_opts) *.js modules/*.js

serve:
	npx @11ty/eleventy --serve

publish: all
	./publish.sh _site

clean:
	rm -rf ./_site
	find . -name '*~' -delete

pristine:
	git clean -fdx


.PHONY: setup pretty tidy lint fixmes ready strict_lint serve publish clean pristine
