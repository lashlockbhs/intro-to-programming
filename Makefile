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
	prettier --write .eleventy.js '**/*.js' '**/*.css' '**/*.json'

tidy:
	tidy -config .tidyconfig src/**/*.html

lint:
	npx eslint $(eslint_opts) js/**/*.js

fixmes:
	ag --no-group FIXME

ready: pretty lint


strict_lint:
	npx eslint $(eslint_opts) $(eslint_strict_opts) *.js modules/*.js

quick_lint:
	npx eslint $(eslint_opts) --fix $(shell git diff --name-only | grep '.js$$')


serve:
	npx @11ty/eleventy --serve

publish: clean stash all
	./publish.sh _site
	git stash pop

clean:
	rm -rf ./_site
	find . -name '*~' -delete

stash:
	git stash push -u

pristine:
	git clean -fdx


.PHONY: setup pretty tidy lint fixmes ready strict_lint serve publish clean stash pristine
