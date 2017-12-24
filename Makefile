SHELL   := /bin/bash

ROLLUP  := ./node_modules/.bin/rollup
BABILI  := ./node_modules/.bin/babili
CSSNANO := ./node_modules/.bin/cssnano
HTML    := ./node_modules/.bin/html-minifier

BABILIFLAGS := --no-comments
HTMLFLAGS   := --collapse-whitespace --remove-comments --minify-js
ROLLUPFLAGS := --format=iife --sourcemap

NODE_ENV?=production

MANIFEST_FILE := manifest.json

SOURCE_DIRECTORY := source
JS_DIRECTORY := $(SOURCE_DIRECTORY)/assets/js
ASSETS_DIRECTORY := $(SOURCE_DIRECTORY)/assets/build
JS_ASSETS := $(subst $(JS_DIRECTORY)/,$(ASSETS_DIRECTORY)/,$(wildcard $(JS_DIRECTORY)/*.js))

all: build-assets

init:
	git submodule init
	git submodule update
	yarn install

ssl:
	@mkdir bin/ssl && openssl req \
		-newkey rsa:2048 \
		-x509 \
		-nodes \
		-keyout bin/ssl/localhost.key \
		-new \
		-out bin/ssl/localhost.crt \
		-subj /CN=localhost \
		-reqexts SAN \
		-extensions SAN \
		-config <(cat /System/Library/OpenSSL/openssl.cnf \
				<(printf '[SAN]\nsubjectAltName=DNS:localhost')) \
		-sha256 \
		-days 3650

server: clean-assets
	bin/build --server

clean-manifest:
	rm -f $(MANIFEST_FILE)

clean-assets: clean-manifest
	rm -rf $(ASSETS_DIRECTORY)/*

clean: clean-assets

$(ASSETS_DIRECTORY)/%.js: $(JS_DIRECTORY)/%.js
	$(ROLLUP) $(ROLLUPFLAGS) -i $< -o $@

build-assets: clean-assets $(JS_ASSETS)

compress-assets: build-assets
	$(BABILI) $(ASSETS_DIRECTORY) -d $(ASSETS_DIRECTORY) $(BABILIFLAGS)
	$(CSSNANO) $(SOURCE_DIRECTORY)/assets/main.css $(ASSETS_DIRECTORY)/main.min.css

build-manifest: compress-assets
	@echo -n "{" > $(MANIFEST_FILE)
	@lf=""; for filename in $$( find $(ASSETS_DIRECTORY) -type f -exec basename {} \; ); do \
		hash=$$(md5 -q $(ASSETS_DIRECTORY)/$$filename); \
		hashed_filename="$${filename%%.*}-$$hash.$${filename#*.}"; \
		cp $(ASSETS_DIRECTORY)/$$filename $(ASSETS_DIRECTORY)/$$hashed_filename; \
		if [ ! -z $$lf ]; then echo -n "," >> $(MANIFEST_FILE); fi; lf=$$hash; \
		echo -n "\"$$filename\": \"$$hashed_filename\"" >> $(MANIFEST_FILE); \
	done
	@echo -n "}" >> $(MANIFEST_FILE)

build: build-manifest

build-deploy: build
	find $(ASSETS_DIRECTORY) -type f -not -regex '.*-[a-f0-9]*.*' -delete
	find $(ASSETS_DIRECTORY) -type f -regex '.*.js.map' -delete
	NODE_ENV=$(NODE_ENV) bin/build
	$(HTML) $(HTMLFLAGS) --input-dir static --file-ext html --output-dir static

reset-static:
	git --git-dir=static/.git reset --hard origin/gh-pages
	git --git-dir=static/.git pull origin gh-pages
	git --git-dir=static/.git clean -fd

deploy: reset-static build-deploy
	git --git-dir=static/.git add -A
	git --git-dir=static/.git commit -m "Deploy"
	git --git-dir=static/.git push origin gh-pages

rollback:
	git --git-dir=static/.git reset --hard origin/gh-pages
	git --git-dir=static/.git revert HEAD
	git --git-dir=static/.git push origin gh-pages