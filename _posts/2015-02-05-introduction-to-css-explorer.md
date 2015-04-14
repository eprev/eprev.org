---
title: Introduction to CSS Explorer
layout: post
tags:
    - css
    - javascript
excerpt: Explore your project’s CSS with node-specificity.
share-image: css-explorer-distribution.png
---

I’ve been curious about the state of our CSS code and its changes over the time.
So I’ve written recently a program called [`specificity`](https://github.com/eprev/specificity).
What does it do? It answers the following questions:

1. What is a total number of selectors in your CSS codebase?
How has it been changing over the time?
2. What is a maximum/average/median selector‘s specificity of your CSS codebase?
How has it been changing over the time?
3. How does the distribution of selector‘s specificity of your CSS codebase look like?
How has it been changing over the time?
4. How many selectors in your CSS codebase contain at least one rule with the `!important` directive?
How has it been changing over the time?

Wait, why is it so important? It’s not, until you have a codebase of dozens of
thousands lines of code that is hard to maintain and you do a lot of experiments.
And of course, if it’s not even important, it’s quite interesting at least.

![CSS specificity chart](/assets/posts/css-explorer-distribution.png)

So, `node-specificity` provides two commands. One is for parsing your CSS files and creating profiles.
Second is for reading or “exploring” these profiles. Let’s look at an example. I have a few versions of
[CSS](https://github.com/eprev/specificity/tree/master/spec/fixtures/timeline) of the website
you’re reading right now. As I’m writing this post the website is using `v8.css`.

Alright, let’s create profiles for these files:

~~~
$ node-specificity parse v1.css --label=v1 --output=v1.json
...
$ node-specificity parse v8.css --label=v8 --output=v8.json
~~~

We’ve created a profile for each CSS file since we want to observe changings over the time. If you use
more than one CSS file on your website, you have to create a profile for all of them, for instance:

~~~
$ node-specificity parse main.css print.css --label=2014-12-23 --output=20141223.json
~~~

Label acts as a profile’s name in reports. Once we have profiles created, we are able to run a report.
Let’s start a ‘server’ report:

~~~
$ node-specificity explore v*.json --report=server
Server is running on http://localhost:4000/
Press Ctrl + C to stop it.
~~~

Open a browser and go to “http://localhost:4000/”. Now you’re supposed to be seeing the page
with different controls and a weird graph. It‘s the specificity distribution chart (see in
the picture above). For each specificity (tuple) it shows the total number of selectors
of this specificity in the specific profile.

Other graphs are: number of selectors in your CSS files and total number of selectors in profiles,
how many of them contain rules with the `!important` directive, average and median
values of selector’s specificity for CSS files and profiles.

![Number of selectors chart](/assets/posts/css-explorer-selectors.png)

You are able to explore all these graphs for a specific profile. To do this, you have to
select the particular profile’s label in the dropdown list. For instance, it’s the specificity
distribution bar chart for ‘v8.json’ profile in the picture below.

![CSS specificity chart](/assets/posts/css-explorer-profile.png)

So, `server` report is quite a powerful tool. Bear in mind, images above are for the profiles
of one humble CSS file. If you have a few files for profile, it gets better.

There is also `inspect` report (it’s used as the default one). If you run `node-specificity explore v8.json`,
it will print out the list of all selectors in the given profile, the summary on specificity numbers
and the specificity distribution chart, which is very similar to the one you can see above.

![Screenshot of the ‘inspect’ report](/assets/posts/css-explorer-cli.png)

Reports can accept additional command line options. There are few of them. In the example above,
`--no-inspect-selectors` option has been used. It disables printing out the list of all selectors.

That’s it. Happy exploring!
