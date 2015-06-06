---
title: Change OS X network location based on the Wi-Fi network name
layout: post
tags:
    - os-x
excerpt: How to change automatically OS X’s network location based on the name of Wi-Fi network and run arbitrary scrips when it happens.
---

You might have heard about [Network locations](https://support.apple.com/en-us/HT202480) in OS X.
It allows you to have different network configurations and quickly switch between them. For instance,
if you need to use a corporate proxy server at the office and you don’t need it when you get back home,
you might create a new location named “Work” (with any necessary network proxy settings) and keep
the default “Automatic” location for home. But still, you will need to switch between those locations
manually. How annoying!

Wouldn’t it be great if OS X could switch location automatically based on the name of Wi-Fi network
that I’m connected to? Furthermore, I would like to change automatically some Security Preferences,
because I have to lock the computer immediately at work when I go away. But I found it annoying
to have it at home.

So, how to change automatically OS X’s network location based on the name of Wi-Fi network or run
arbitrary scrips when it happens? We will be following a convention over configuration paradigm
to reduce the overall complexity.

First of all, we have to name locations after Wi-Fi network names. For instance, if the name of
your corporate wireless network is “Corp Wi-Fi”, you have to create a new location “Corp Wi-Fi”.
If you connect to a wireless network that you don’t have a specific location for, then
the default location “Automatic” will be used.

Now we need the [tools](https://github.com/eprev/locationchanger). The installation process
is extremely easy:

~~~
$ curl -L https://github.com/eprev/locationchanger/raw/master/locationchanger.sh | bash
~~~

It will ask only for a root password to install `locationchanger`. Now every time you connect to
a wireless network, the it will change your location to either corresponding or default one.
