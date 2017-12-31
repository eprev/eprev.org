<!--
tags:
  - svg
description: There is an easy way to convert bit-mapped images into SVG using command-line tool called Potrace.
og-image: og-preview.png
gh-issue-id: 10
-->

# Converting PNG to SVG

Let’s say, you’ve found a funny black-and-white picture on the Internet and you want it badly in hi-res or vector which is even better. Well, there is a command-line tool called [Potrace](http://potrace.sourceforge.net).

## Installation

It has precompiled distributions for OS X, Linux and Windows. Potrace is also available in major package managers, including [Homebrew](http://brew.sh/):

```shell
$ brew install potrace
```

The manual installation is super easy though. For OS X do the following:

```shell
$ cd potrace-1.12.mac-i386
$ sudo cp mkbitmap.1 potrace.1 /usr/share/man/
$ sudo cp mkbitmap potrace /usr/local/bin
```

## Usage

Potrace works with bitmaps (PBM, PGM, PPM, or BMP format). It means you have to convert the image you have to one of those formats. We will be using [ImageMagick](http://www.imagemagick.org)’s `convert` program. If you don’t have it installed, you can use Homebrew to get it:

```shell
$ brew install imagemagick
```

Alright. Let's say you’ve got this image (by [Nation of Amanda](http://nationofamanda-blog.tumblr.com/)) in PNG format with transparency:

![‘Nap all day, sleep all night, party never’ by Nation of Amanda](party-never.png "Original black-and-white PNG image.")
<!--: layout="responsive" -->

All you need to do is to run this:

```shell
$ convert -alpha remove party-never.png pgm: \
| mkbitmap -f 32 -t 0.4 - -o - \
| potrace --svg -o party-never.svg
```

It converts PNG file to PGM format, removes image transparency, outputs the result image to the standard input of `mkbitmap` that transforms the input with highpass filtering and thresholding into a suitable for the `potrace` program format, that finally generates SVG file. You can play around with highpass filtering (`-f`) and thresholding (`-t`) values until you have the final look that you want.

As a result you might have now:

![‘Nap all day, sleep all night, party never’ by Nation of Amanda](party-never.svg "Generated SVG image (zoom the page in).")
<!--: layout="responsive" -->

That’s it.
