SHELL   := /bin/bash

WSNGN  := ./node_modules/.bin/wsngn
ROLLUP  := ./node_modules/.bin/rollup
TERSER  := ./node_modules/.bin/terser
CSSNANO := ./node_modules/.bin/cssnano
HTML    := ./node_modules/.bin/html-minifier

HTMLFLAGS   := --collapse-whitespace --remove-comments --minify-js
ROLLUPFLAGS := --format=iife

NODE_ENV?=production

MANIFEST_FILE := manifest.txt

SRC_DIR := source
DEST_DIR := static

SRC_JS_DIR := $(SRC_DIR)/assets/js
SRC_CSS_DIR := $(SRC_DIR)/assets/css
BUNDLES_DIR := $(DEST_DIR)/assets-bundles

CSS_BUNDLES := $(subst $(SRC_CSS_DIR)/,$(BUNDLES_DIR)/,$(wildcard $(SRC_CSS_DIR)/*.css))
JS_BUNDLES := $(subst $(SRC_JS_DIR)/,$(BUNDLES_DIR)/,$(wildcard $(SRC_JS_DIR)/*.js))

all: build-bundles

init:
	git submodule init
	git submodule update
	yarn install

server:
	$(WSNGN) --server

clean-manifest:
	rm -f $(MANIFEST_FILE)

clean-bundles: clean-manifest
	rm -rf $(BUNDLES_DIR)/*

clean: clean-bundles clean-static

$(BUNDLES_DIR)/%.js: $(SRC_JS_DIR)/%.js
	$(ROLLUP) $(ROLLUPFLAGS) -i $< -o $@
	$(TERSER) $@ -o $@

$(BUNDLES_DIR)/%.css: $(SRC_CSS_DIR)/%.css
	$(CSSNANO) $< $@

$(BUNDLES_DIR)/%.css: $(SRC_CSS_DIR)/%.css
	$(CSSNANO) $< $@

build-bundles: clean-bundles $(JS_BUNDLES) $(CSS_BUNDLES)

build-manifest: build-bundles
	@set -e; for filename in $$( find $(BUNDLES_DIR) -type f -exec basename {} \; ); do \
		hash=$$(cat $(BUNDLES_DIR)/$$filename | openssl md5 -binary | xxd -p); \
		hashed_filename="$${filename%%.*}-$$hash.$${filename#*.}"; \
		mv $(BUNDLES_DIR)/$$filename $(BUNDLES_DIR)/$$hashed_filename; \
		echo "$$filename: $$hashed_filename" >> $(MANIFEST_FILE); \
	done

build: build-manifest
	NODE_ENV=$(NODE_ENV) $(WSNGN)
	$(HTML) $(HTMLFLAGS) --input-dir static --file-ext html --output-dir static

clean-static:
	find static -not -name ".git" -delete

reset-static:
	git --git-dir=static/.git reset --hard origin/gh-pages
	git --git-dir=static/.git pull origin gh-pages
	git --git-dir=static/.git clean -fd

deploy: reset-static build
	git --git-dir=static/.git add -A
	git --git-dir=static/.git commit -m "Deploy"
	git --git-dir=static/.git push origin gh-pages

rollback:
	git --git-dir=static/.git reset --hard origin/gh-pages
	git --git-dir=static/.git revert HEAD
	git --git-dir=static/.git push origin gh-pages

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