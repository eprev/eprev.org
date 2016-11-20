---
title: Open all modified files in editor
layout: post
tags:
    - git
excerpt: How to open all modified files tracked by Git in your favorite editor.
---

Often I finish working day without committing changes to the repository. Thus, next morning
I need to open all the files I was working yesterday. And I found an efficient way to do this.

{% highlight shell %}
$ vim -p $(git diff --name-only HEAD | sed "s,$(git rev-parse --show-prefix),," | tr "\n" " ")
{% endhighlight %}

It opens Vim and loads all modified files in tabs. You could add this command as an alias to your `.bashrc`,
but adding this to `.gitconfig` seems like a better option. This is what you need to add to your `~/.gitconfig`.

{% highlight shell %}
[alias]
open = "!vim -c \"cd $GIT_PREFIX\" -p $(git diff --name-only HEAD | tr '\\n' ' ')"
{% endhighlight %}

To run this command you need to type `git open` in the terminal. Since all commands prefixed with an exclamation
point are executed from the top-level directory of a repository, we need to change working directory in Vim to
the current one. And of course you can replace Vim by your favorite editor or event by `$EDITOR`.

Besides, If you use sort of file watchers to perform certain operations when files change, then
you would find the following command quite helpful. It changes modification time of all modified files at once.

{% highlight shell %}
[alias]
touch = "!touch -c $(git diff --name-only HEAD | tr '\\n' ' ')"
{% endhighlight %}

You can find more handy aliases in [.dotfiles](https://github.com/eprev/dotfiles/blob/master/gitconfig) of mine.
