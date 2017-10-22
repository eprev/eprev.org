---
title: Make as a front-end development build tool
layout: post
tags:
  - makefile
  - devops
description: A practical introduction to Make as a front-end development build tool.
share-image: make-as-a-front-end-development-build-tool.png
ghIssueId: 18
---

> Make is turning 40 in 2017.
{:.epigraph}

This is a practical introduction to Make as a front-end development build tool. I will give the basic understanding of how makefiles work and show how to get the most common front-end tasks done using Make. However I encourage you to read the [official manual](http://www.gnu.org/software/make/manual/make.html) through.

Why even bother with Make? Make is a powerful tool which is not limited to building packages. You can use it for anything you do from copying files or running webpack to deploying your project. I use this [makefile](https://raw.githubusercontent.com/eprev/eprev.org/df2e82563c2e444f8116dc4e9fe1f56dcdc56984/Makefile) to build and deploy this very web site. These are the tasks that it carries out for me:

- Running Jekyll
- Watching for changes in JavaScript source files
- Building JavaScript bundles
- Minifying static assets (CSS, JavaScript and HTML)
- Versioning static assets
- Deploying the web site to GitHub Pages

And that makefile is less than 80 lines of code!

<!-- Read More -->

## Makefile basics

Any makefile consists of “rules”: build targets, their dependencies and series of commands (recipes) to build those targets:

{% highlight make %}
target …: dependency …
    command
    …
{% endhighlight %}

__Please note:__ each command must begin with a tab character.

Here’s a simple makefile:

{% highlight make %}
dist/main.js: src/main.js
    mkdir -p dist
    cp src/main.js dist/main.js
{% endhighlight %}

On the first line we have the `dist/main.js` target with the `src/main.js` file as the only dependency. In order to build this target, Make will execute `mkdir` and `cp` commands. The former creates the directory if it doesn’t exist and the later puts a copy of the source file to that directory.

To use this makefile to create the target file, type `make`:

{% highlight shell %}
$ make
mkdir -p dist
cp src/main.js dist/main.js
{% endhighlight %}

If no dependencies have changed after the target was generated, `make` won’t update that target. That’s why if you run it twice in a row, `make` won’t copy any files on the second run:

{% highlight shell %}
$ make
make: 'dist/main.js' is up to date.
{% endhighlight %}

Anyway, it required quite a bit of typing just to copy a file. Our recipe can be improved by using [automatic variables](https://www.gnu.org/software/make/manual/make.html#Automatic-Variables):

{% highlight make %}
dist/main.js: src/main.js
    mkdir -p $(@D)
    cp $< $@
{% endhighlight %}

Where:

* `$@` – The file name of the target.
* `$<` – The file name of the first dependency.
* `$(@D)` – The directory part of the file name of the target.

That’s better. Now, what if we have more than one JavaScript file to copy? We can replace our explicit rule with a [pattern rule](https://www.gnu.org/software/make/manual/make.html#Pattern-Rules):

{% highlight make %}
dist/%.js: src/%.js
    mkdir -p $(@D)
    cp $< $@
{% endhighlight %}

Where `%` in the target matches any non-empty substring, and `%` in the dependency represents the same matched substring in the target.

If you were to run `make` this time, it would fail:

{% highlight shell %}
$ make
make: *** No targets.  Stop.
{% endhighlight %}

It doesn’t know which target it should be building now, since there’s no longer explicit rules in the makefile. You would need to pass the desired target name in the arguments:

{% highlight shell %}
$ make dist/main.js
mkdir -p dist
cp src/main.js dist/main.js
{% endhighlight %}

This doesn’t seem handy though. Instead, we could define a new rule called `all` with the `dist/main.js` file as the dependency and an empty recipe:

{% highlight make %}
all: dist/main.js

dist/%.js: src/%.js
    mkdir -p $(@D)
    cp $< $@
{% endhighlight %}

Now, `make` will start with the `all` target. In order to “build” it, it has to find the dependency file `dist/main.js`, and if the later doesn’t exist, it will look for a rule to create it.

But this doesn’t seem to be a scalable solution either. What if Make could actually find the existing files in the `src` directory and based on them create the list of dependencies for the `all` target? Now we’re getting somewhere:

{% highlight make %}
all: $(subst src/,dist/,$(wildcard src/*.js))

dist/%.js: src/%.js
    mkdir -p $(@D)
    cp $< $@
{% endhighlight %}

Those `wildcard` and `subst` are Make’s [functions](https://www.gnu.org/software/make/manual/make.html#Functions). The former returns a space-separated list of names of existing files that match the given pattern `src/*.js`, and the later replaces `src/` with `dist/` in that list.

And finally, we could use [variables](https://www.gnu.org/software/make/manual/make.html#Using-Variables) to store the directory names, so we won’t have to update rules in the makefile if the structure of  our project changes:

{% highlight make %}
SRC_DIR  := src
DIST_DIR := dist

all: $(subst $(SRC_DIR)/,$(DIST_DIR)/,$(wildcard $(SRC_DIR)/*.js))

$(DIST_DIR)/%.js: $(SRC_DIR)/%.js
    mkdir -p $(@D)
    cp $< $@
{% endhighlight %}

## Make by example

In the next sections I will explain some parts of the [makefile](https://raw.githubusercontent.com/eprev/eprev.org/df2e82563c2e444f8116dc4e9fe1f56dcdc56984/Makefile) that I use to build and deploy this web site. I hope these examples are good enough for you to get started.

### Building JavaScript bundles

I keep JavaScript files in the `js` directory. All the files contained within the `js` directory are bundles, that may import other source files from the subdirectories. Basically, the folder structure looks like this:

{% highlight text %}
.
├── assets/
├── js/
│   ├── src/
│   │   ├── ga.js
│   │   └── polyfills.js
│   └── main.js
└── Makefile
{% endhighlight %}

The `js/main.js` file is used as the entry point for [Rollup](http://rollupjs.org/) to create the resulting bundle in the `assets` directory. I have a target called `build-assets` in the makefile that does it:

{% highlight make %}
ROLLUP := ./node_modules/.bin/rollup
ROLLUPFLAGS := --format=iife --sourcemap

JS_DIRECTORY := js
ASSETS_DIRECTORY := assets
JS_ASSETS := $(subst $(JS_DIRECTORY)/,$(ASSETS_DIRECTORY)/,$(wildcard $(JS_DIRECTORY)/*.js))

clean-assets:
    rm -rf $(ASSETS_DIRECTORY)/*

$(ASSETS_DIRECTORY)/%.js: $(JS_DIRECTORY)/%.js
    $(ROLLUP) $(ROLLUPFLAGS) -i $< -o $@

build-assets: clean-assets $(JS_ASSETS)
{% endhighlight %}

This is very similar to what we have done earlier to copy multiple JavaScript files.

### Watching for changes

[`fswatch`](https://github.com/emcrisostomo/fswatch) is a cross-platform file change monitor that gets notified when the contents of the particular files or directories are modified. You can use [Homebrew](https://brew.sh) to install it:

{% highlight shell %}
$ brew install fswatch
{% endhighlight %}

I have the `watch` target in the makefile, which starts `fswatch` and will run `make build-assets` when any of JavaScript files changes:

{% highlight make %}
watch:
    fswatch -o $(JS_DIRECTORY) | xargs -n1 -I{} $(MAKE) build-assets
{% endhighlight %}

This command performs the following operations:

* The `fswatch -o js` command will start watching for file changes in the `js` directory. The `-o` option tells `fswatch` to batch change events.
* The `xargs -n1` command will execute the `$(MAKE) build-assets` command each time `fswatch` detects a change.
* The `-I{}` option will substitute occurrences of `{}` in the given command with the string from the standard input. Even though we don't have `{}` in the command, without this option `xargs` will execute `make` with two arguments (instead of one): `build-assets` and the string it gets from the standard input.

To start watching for changes, type:

{% highlight shell %}
$ make watch
{% endhighlight %}

To stop, press `Ctrl-C`.


### Minifying static assets

Here I use [Babili](https://github.com/babel/babili) to minify ES6 JavaScript bundles after they are generated by `build-assets`:

{% highlight make %}
BABILI := ./node_modules/.bin/babili
BABILIFLAGS := --no-comments

compress-assets: build-assets
    $(BABILI) $(ASSETS_DIRECTORY) -d $(ASSETS_DIRECTORY) $(BABILIFLAGS)
{% endhighlight %}

The same way you can use, for instance, [cssnano](http://cssnano.co) and [html-minifier](https://github.com/kangax/html-minifier) to compress CSS and HTML.

### Versioning static assets

Caching is important, so is a strategy for breaking the cache and making the browsers download updated resources.

The popular approach is to include the hash of the file contents in its name, eg. `assets/main-a2f40c.js`. This way it guarantees the file name won't change during the building process if its contents remains the same.

If you choose this approach, you will have to generate the manifest file in order to reference those files in the HTML or CSS. And here is the `build-manifest` target in the makefile that does it:

{% highlight make %}
MANIFEST_FILE := _data/manifest.yml

clean-manifest:
    rm -f $(MANIFEST_FILE)

build-manifest: clean-manifest compress-assets
    @for filename in $$( find $(ASSETS_DIRECTORY) -type f -exec basename {} \; ); do \
        hash=$$(md5 -q $(ASSETS_DIRECTORY)/$$filename); \
        hashed_filename="$${filename%%.*}-$$hash.$${filename#*.}"; \
        cp $(ASSETS_DIRECTORY)/$$filename $(ASSETS_DIRECTORY)/$$hashed_filename; \
        echo "$$filename: $$hashed_filename" >> $(MANIFEST_FILE); \
    done
{% endhighlight %}

Firstly, Make executes each line in a recipe separately. And if you need to write multi-line command, then you can use line continuations. Make also prints out each command before it gets executed, and the `@` character in the start of the line prevents the command from such echoing.

Secondly, the `$` character is used to reference variables in makefiles, so does the shell. And in order to get `$filename` passed to the shell, rather than having Make trying to find a variable called `filename`, we need to write `$$filename`.

Thus, this is actually what Make will pass to the shell (Bash) when running `build-manifest`:

{% highlight shell %}
for filename in $( find assets -type f -exec basename {} \; ); do \
    hash=$(md5 -q assets/$filename); \
    hashed_filename="${filename%%.*}-$hash.${filename#*.}"; \
    cp asstes/$filename assets/$hashed_filename; \
    echo "$filename: $hashed_filename" >> _data/manifest.yml; \
done
{% endhighlight %}

This command performs the following operations:

- The `find assets -type f -exec basename {} \;` command will find all files in the `assets` directory.
- The `md5 -q assets/$filename` command will calculate a checksum for the given file.
- The `${filename%%.*}` operation will delete the longest match of `.*` from the back of `$filename`. If `$filename` was containing `main.js.map`, it would keep the `main` part only.
- The `${filename#*.}` operation will delete the shortest match of `*.` from the front of `$filename`. If `$filename` was containing `main.js.map`, it would keep the `js.map` part only.
- The `echo "…" >> _data/manifest.yml` command will append a string containing both file names to the manifest file.

Basically, for each file that it finds in the `assets` directory, it will calculate a checksum, make a copy of the file and generate the manifest file containing key-value pairs:

{% highlight text %}
main.js: main-a2f40c69875a90f46f961febe52d4989.js
…
{% endhighlight %}

This is how I use this information later in Jekyll to reference JavaScript bundles:

{% highlight liquid %}{% raw %}
{% if site.data.manifest %}
    <script src="{{ site.url }}/assets/{{ site.data.manifest['main.js'] }}"></srcipt>
{% else %}
    <script src="{{ site.url }}/assets/main.js"></srcipt>
{% endif %}
{% endraw %}{% endhighlight %}

### Deploying to GitHub Pages

I keep the source code of the web site in the `master` branch and the contents of the `_site` directory in the `gh-pages` branch. Thus, to publish a new version of the web site I just need to push changes in the `_site` directory to GitHub. To automate this I created a target called `deploy`:

{% highlight make %}
build-deploy: build
    …
    JEKYLL_ENV=production bundle exec jekyll build
    …

reset-site:
    git --git-dir=_site/.git reset --hard origin/gh-pages
    git --git-dir=_site/.git pull origin gh-pages

deploy: reset-site build-deploy
    git --git-dir=_site/.git add -A
    git --git-dir=_site/.git commit -m "Deploy"
    git --git-dir=_site/.git push origin gh-pages
{% endhighlight %}

## Conclusion

Make is a great cross-platform tool suitable for projects of different sizes and complexities. More powerful and expressive in a certain way than NPM scripts, Grunt or Gulp.

And I hope this article has sparked your interest in learning and getting out of your comfort zone as a front-end developer.

