SHELL := /bin/bash

.PHONY: all build deploy

all: build

CSSO=./node_modules/.bin/csso

build:
	$(CSSO) --input main.css --output _includes/main.min.css
	JEKYLL_ENV=production bundle exec jekyll build

deploy: build
	# git --git-dir=_site/.git reset --hard
	# git --git-dir=_site/.git checkout gh-pages
	# git --git-dir=_site/.git pull origin gh-pages
	# grunt deploy
	JEKYLL_ENV=production bundle exec jekyll build
	# git --git-dir=_site/.git add -A
	# git --git-dir=_site/.git commit -m "Deploy"
	# git --git-dir=_site/.git push origin gh-pages