PYTEST_OPTIONS := --tb=line -rN

black := black --line-length 120
autoflake := autoflake --in-place --recursive --remove-unused-variables --expand-star-imports --remove-all-unused-imports

all: fmt typecheck check

setup:
	pipenv install --dev

fmt:
	$(autoflake) .
	isort .
	$(black) .

typecheck:
	mypy --strict .

check:
	python -m  pytest $(PYTEST_OPTIONS)


tidy:
	tidy -i -w 80 -m *.html

pretty:
	prettier -w *.js


serve:
	./node_modules/.bin/esbuild web.js --servedir=. --outdir=./js --bundle --sourcemap
