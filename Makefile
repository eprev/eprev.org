SHELL   := /bin/bash

ROLLUP  := ./node_modules/.bin/rollup
BABILI  := ./node_modules/.bin/babili
CSSNANO := ./node_modules/.bin/cssnano
HTML    := ./node_modules/.bin/html-minifier

BABILIFLAGS := --no-comments
HTMLFLAGS   := --collapse-whitespace --remove-comments --minify-js
ROLLUPFLAGS := --format=iife --sourcemap

MANIFEST_FILE := _data/manifest.yml

JS_DIRECTORY := js
ASSETS_DIRECTORY := assets
JS_ASSETS := $(subst $(JS_DIRECTORY)/,$(ASSETS_DIRECTORY)/,$(wildcard $(JS_DIRECTORY)/*.js))

all: build-assets

init:
	git submodule init
	git submodule update
	bundle install
	npm install

server: build-assets
	bundle exec jekyll serve --drafts

clean-manifest:
	rm -f $(MANIFEST_FILE)

clean-assets: clean-manifest
	rm -rf $(ASSETS_DIRECTORY)/*

clean-includes:
	rm -f _includes/main.min.css

clean: clean-assets clean-includes

watch: clean-manifest
	fswatch -o $(JS_DIRECTORY) | xargs -n1 -I{} $(MAKE) build-assets

$(ASSETS_DIRECTORY)/%.js: $(JS_DIRECTORY)/%.js
	$(ROLLUP) $(ROLLUPFLAGS) -i $< -o $@

build-assets: clean-assets $(JS_ASSETS)

compress-assets: build-assets
	$(BABILI) $(ASSETS_DIRECTORY) -d $(ASSETS_DIRECTORY) $(BABILIFLAGS)

build-manifest: compress-assets
	@for filename in $$( find $(ASSETS_DIRECTORY) -type f -exec basename {} \; ); do \
		hash=$$(md5 -q $(ASSETS_DIRECTORY)/$$filename); \
		hashed_filename="$${filename%%.*}-$$hash.$${filename#*.}"; \
		cp $(ASSETS_DIRECTORY)/$$filename $(ASSETS_DIRECTORY)/$$hashed_filename; \
		echo "$$filename: $$hashed_filename" >> $(MANIFEST_FILE); \
	done

build: build-manifest

build-deploy: build
	find $(ASSETS_DIRECTORY) -type f -not -regex '.*-[a-f0-9]*.*' -delete
	find $(ASSETS_DIRECTORY) -type f -regex '.*.js.map' -delete
	$(CSSNANO) main.css _includes/main.min.css
	JEKYLL_ENV=production bundle exec jekyll build
	$(HTML) $(HTMLFLAGS) --input-dir _site --file-ext html --output-dir _site

reset-site:
	git --git-dir=_site/.git reset --hard origin/gh-pages
	git --git-dir=_site/.git pull origin gh-pages

deploy: reset-site build-deploy
	git --git-dir=_site/.git add -A
	git --git-dir=_site/.git commit -m "Deploy"
	git --git-dir=_site/.git push origin gh-pages

rollback:
	git --git-dir=_site/.git reset --hard origin/gh-pages
	git --git-dir=_site/.git revert HEAD
	git --git-dir=_site/.git push origin gh-pages