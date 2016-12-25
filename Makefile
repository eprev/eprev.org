SHELL := /bin/bash

.PHONY: all build reset deploy

all: build

NPM=npm
CSSO=./node_modules/.bin/csso
HTML=./node_modules/.bin/html-minifier

HTMLFLAGS=--collapse-whitespace --remove-comments --minify-js

build:
	rm -rf assets/*
	rm -f _data/manifest.json
	$(NPM) run build
	$(CSSO) --input main.css --output _includes/main.min.css
	JEKYLL_ENV=production bundle exec jekyll build
	$(HTML) $(HTMLFLAGS) --input-dir _site --file-ext html --output-dir _site

reset:
	git --git-dir=_site/.git reset --hard
	git --git-dir=_site/.git checkout gh-pages
	git --git-dir=_site/.git pull origin gh-pages

deploy: reset build
	git --git-dir=_site/.git add -A
	git --git-dir=_site/.git commit -m "Deploy"
	git --git-dir=_site/.git push origin gh-pages