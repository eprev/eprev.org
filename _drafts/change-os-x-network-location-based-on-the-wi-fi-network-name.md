---
title: Change OS X network location based on the Wi-Fi network name
layout: post
tags:
    - os-x
excerpt: How to change automatically OS X’s network location based on the name of Wi-Fi network and run scrips when it happens.
---

You might have heard about [Network locations](https://support.apple.com/en-us/HT202480) in OS X. It allows you to have different network configurations and quickly switch between them. For instance, if you need to use a specific network preferences at work (let’s say, corporate proxy server) and you don’t need it when you get home, you could create a new location named “Work” for work environment and use the default “Automatic” location for home. But still, you will need to switch between those locations manually. How annoying!

Fortunately or not, I love to automate things. And I wanted OS X to switch location automatically based on the name of Wi-Fi network that I’m connected to. Furthermore, I wanted to change automatically Security Preferences. I have to lock the computer immediately at work when I go away. But I found it annoying to have it at home.

So, how to change automatically OS X’s network location based on the name of Wi-Fi network and run scrips when it happens? Let’s follow convention over configuration paradigm, it will reduce the overall complexity.

