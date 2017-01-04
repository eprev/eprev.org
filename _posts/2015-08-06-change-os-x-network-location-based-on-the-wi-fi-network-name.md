---
title: Change OS X network location based on the Wi-Fi network name
layout: post
tags:
  - os-x
excerpt: How to change automatically OS X’s network location based on the name of Wi-Fi network and run arbitrary scrips when it happens.
ghIssueId: 9
---

You might have heard about [Network locations](https://support.apple.com/en-us/HT202480) in OS X.
It allows you to have different network configurations and quickly switch between them. For instance,
if you have to use a corporate proxy server at work and you don’t need it when you get back home,
you can create a new location named “Work” (with any necessary network proxy settings) and keep
the default “Automatic” location for home. But still, you would need to switch between those locations
manually. How annoying!

Wouldn’t it be great if OS X could switch location automatically based on the name of Wi-Fi network
that I’m connected to? Moreover, I would like to change automatically some Security Preferences,
because I have to lock the computer immediately at work when I go away. But I found it annoying
to have it at home.

So, how to change automatically OS X’s network location based on the name of Wi-Fi network or run
arbitrary scrips when it happens? Pretty easy! We will be following a convention over configuration
paradigm to reduce the overall complexity.

First of all, we have to name locations after Wi-Fi network names. For instance, if the name of
your corporate wireless network is “Corp Wi-Fi”, you have to create a new location “Corp Wi-Fi”.
If you connect to a wireless network that you don’t have a specific location for, then
the default location “Automatic” will be used.

Then, we need to install [`locationchanger`](https://github.com/eprev/locationchanger). It‘s a tool
that watches for wireless network changes and responds accordingly. Its installation process
is extremely easy:

{% highlight shell %}
$ curl -L https://github.com/eprev/locationchanger/raw/master/locationchanger.sh | bash
{% endhighlight %}

It will ask only for a root password to install `locationchanger` service. Now, every time you connect to
a wireless network it will change the location to either the corresponding or the default one.

That’s not all. We still want to change Security Preferences automatically when the location
has been changed. Let’s create scripts that will be executed every time it happens. One is
for “Corp Wi-Fi” location:

{% highlight shell %}
#!/usr/bin/env bash

# Require password immediately after sleep or screen saver
osascript -e 'tell application "System Events" to set require password to wake of security preferences to true'
{% endhighlight %}

Another is for the default location:

{% highlight shell %}
#!/usr/bin/env bash

# Don’t require password after sleep or screen saver
osascript -e 'tell application "System Events" to set require password to wake of security preferences to false'
{% endhighlight %}

Save them as `~/.locations/Corp Wi-Fi` and `~/.locations/Automatic` respectively. Voilà!
You’re not limited by changing only the security preferences, you can do whatever
you want to…
