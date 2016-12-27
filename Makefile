SHELL := /bin/bash

.PHONY: all clean clean-assets clean-manifest build build-assets compress-assets build-manifest build-deploy watch reset-site deploy

all: build-assets

ROLLUP=./node_modules/.bin/rollup
BABILI=./node_modules/.bin/babili
CSSO=./node_modules/.bin/csso
HTML=./node_modules/.bin/html-minifier

HTMLFLAGS=--collapse-whitespace --remove-comments --minify-js
ROLLUPFLAGS=--format=iife --sourcemap

MANIFEST_FILE=_data/manifest.yml

JS_DIRECTORY=js
ASSETS_DIRECTORY=assets
JS_ASSETS=$(subst js/,$(ASSETS_DIRECTORY)/,$(wildcard $(JS_DIRECTORY)/*.js))

clean-manifest:
	rm -f $(MANIFEST_FILE)

clean-assets: clean-manifest
	rm -rf $(ASSETS_DIRECTORY)/*

clean: clean-assets

watch: clean-manifest
	@$(ROLLUP) $(ROLLUPFLAGS) --watch -i $(JS_DIRECTORY)/$${entry-main}.js -o $(ASSETS_DIRECTORY)/$${entry-main}.js

$(ASSETS_DIRECTORY)/%.js: $(JS_DIRECTORY)/%.js
	$(ROLLUP) $(ROLLUPFLAGS) -i $< -o $@

build-assets: clean-assets $(JS_ASSETS)

compress-assets: build-assets
	$(BABILI) $(ASSETS_DIRECTORY) -d $(ASSETS_DIRECTORY) --no-comments

build-manifest: compress-assets
	@for filename in $$( find $(ASSETS_DIRECTORY) -type f -exec basename {} \; ); do \
		hash=$$(md5 -q $(ASSETS_DIRECTORY)/$$filename); \
		hashed="$${filename%%.*}-$$hash.$${filename#*.}"; \
		cp $(ASSETS_DIRECTORY)/$$filename $(ASSETS_DIRECTORY)/$$hashed; \
		echo "$$filename: $$hashed" >> $(MANIFEST_FILE); \
	done

build: build-manifest

build-deploy: build
	$(CSSO) --input main.css --output _includes/main.min.css
	JEKYLL_ENV=production bundle exec jekyll build
	$(HTML) $(HTMLFLAGS) --input-dir _site --file-ext html --output-dir _site

reset-site:
	git --git-dir=_site/.git reset --hard origin/gh-pages
	git --git-dir=_site/.git pull origin gh-pages

deploy: reset-site build-deploy
	git --git-dir=_site/.git add -A
	git --git-dir=_site/.git commit -m "Deploy"
	git --git-dir=_site/.git push origin gh-pages