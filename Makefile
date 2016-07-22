SHELL := /bin/bash

.PHONY: all deploy init

all: deploy

deploy:
	git --git-dir=_site/.git reset --hard
	git --git-dir=_site/.git checkout gh-pages
	git --git-dir=_site/.git pull origin gh-pages
	grunt deploy
	jekyll build
	git --git-dir=_site/.git add -A
	git --git-dir=_site/.git commit -m "Deploy"
	git --git-dir=_site/.git push origin gh-pages

init:
	npm install
	npm install -g grunt-cli

