<!--
tags:
  - devops
description: How I set up a static website deployment to GitHub Pages in Travis CI.
share-image: og-preview.png
gh-issue-id: 38
-->

# Continuous deployment to GitHub Pages

Turned out [Travis CI can deploy static websites to GitHub Pages](https://docs.travis-ci.com/user/deployment/pages/) without any hassle. Luckily to me, I’d already been using a [Makefile to build this website](https://eprev.org/2017/02/20/make-as-a-front-end-development-build-tool/), so it took a few minutes to set it all up.

First, I had to generate a new [access token](https://github.com/settings/tokens) for Travis CI with the `public_repo`  scope and hand it to Travis as a secret variable named `GITHUB_TOKEN` in the repository settings.

Then, I created `.travis.yml` file:

```yaml
language: node_js
node_js:
- stable

git:
  submodules: false

script: make build

deploy:
  provider: pages
  skip-cleanup: true
  github-token: $GITHUB_TOKEN
  keep-history: true
  local-dir: static
  on:
    branch: master
```

It commands Travis to execute `make build` to build the website. If it goes well, the Makefile creates the _static_ directory (see `local-dir` option) with the contents of the website. Then Travis checks if the current branch is `master` and uploads the contents of `local-dir` to `target-branch` (defaults to `gh-pages`).

That was it. Now I can edit files directly on GitHib.com (you can also) and any changes made there will get deployed in a matter of minutes.

