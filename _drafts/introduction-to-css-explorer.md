---
title: Introduction to CSS Explorer
layout: post
tags:
    - css
    - javascript
excerpt:
share-image: css-explorer-distribution.png
---

I’ve been curious about the state of our CSS code and its changes over the time.
So I’ve written recently a program called `node-specificity`. What does it do?
It answers the following questions:

1. What is a total number of selectors in your CSS codebase?
How has it been changing over the time?
2. What is a maximum/average/median selector‘s specificity of your CSS codebase?
How has it been changing over the time?
3. How does the distribution of selector‘s specificity of your CSS codebase look like?
How has it been changing over the time?
4. How many selectors in your CSS codebase contain at least one rule with the `!important` directive?
How has it been changing over the time?

Wait, why is it so important? It’s not, until you have a codebase of dozens of
thousands lines of code that is hard to maintain and you’re used to do a lot of experiments.
And of course, if it’s not even important, it’s quite interesting at least.

![Screenshot of the ‘server’ report](/assets/posts/css-explorer-distribution.png)

So, `node-specificity` provides two commands. One is for parsing your CSS files and creating profiles.
Second is for reading or “exploring” these profiles.

