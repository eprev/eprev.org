---
title: Converting PNG to SVG
layout: post
tags:
    - svg
excerpt: There is an easy way to convert bit-mapped images into SVG using command-line tool called Potrace.
share-image: share-party-never.png
ghIssueId: 10
---

Let’s say, you’ve found a funny black-and-white picture on the Internet and you want it badly in hi-res or vector which is even better. Well, there is a command-line tool called [Potrace](http://potrace.sourceforge.net).

## Installation

It has precompiled distributions for OS X, Linux and Windows. Potrace is also available in major package managers, including [Homebrew](http://brew.sh/):

{% highlight shell %}
$ brew install potrace
{% endhighlight %}

The manual installation is super easy, however. For OS X do the following:

{% highlight shell %}
$ cd potrace-1.12.mac-i386
$ sudo cp mkbitmap.1 potrace.1 /usr/share/man/
$ sudo cp mkbitmap potrace /usr/local/bin
{% endhighlight %}

## Usage

Potrace works with bitmaps (PBM, PGM, PPM, or BMP format). It means you have to convert the image you have to one of those formats. We will be using [ImageMagick](http://www.imagemagick.org)’s `convert` program. If you don’t have it installed, you can use Homebrew to get it:

{% highlight shell %}
$ brew install imagemagick
{% endhighlight %}

Alright. Let's say you’ve got this image (by [Nation of Amanda](http://nationofamanda.tumblr.com/)) in PNG format with transparency:
![‘Nap all day, sleep all night, party never’ by Nation of Amanda]({{ site_url }}/images/posts/party-never.png)
All you need to do is to run this:

{% highlight shell %}
$ convert -alpha remove party-never.png pgm: \
| mkbitmap -f 32 -t 0.4 - -o - \
| potrace --svg -o party-never.svg
{% endhighlight %}

It converts PNG file to PGM format, removes image transparency, outputs the result image to the standard input of `mkbitmap` that transforms the input with highpass filtering and thresholding into a suitable for the `potrace` program format, that finally generates SVG file. You can play around with highpass filtering (`-f`) and thresholding (`-t`) values until you have the final look that you want.

As a result you might have now:
![‘Nap all day, sleep all night, party never’ by Nation of Amanda]({{ site_url }}/images/posts/party-never.svg)
That’s it.
