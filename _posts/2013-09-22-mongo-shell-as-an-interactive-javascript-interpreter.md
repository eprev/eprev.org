---
title: Mongo shell as an interactive JavaScript interpreter
layout: post
tags:
    - javascript
    - mongodb
excerpt: Do you know that MongoDB has JavaScript interpreter? And yes, you can use it.
---

Do you have MongoDB installed? If you do then you have JavaScript interpreter. MongoDB has SpiderMonkey JavaScript engine. To start an interactive shell you have to type `mongo --nodb` in the shell.

~~~
$ mongo --nodb
MongoDB shell version: 2.2.0
> var user = {name: "Anton Eprev", age: 27}
> user
{ "name" : "Anton Eprev", "age" : 27 }
> print(user)
[object Object]
> printjson(user)
{ "name" : "Anton Eprev", "age" : 27 }
> var numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9]
> print(numbers)
1,2,3,4,5,6,7,8,9
> printjson(numbers)
[ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]
~~~
{:.javascript}

And of course the shell allows you to use loops, user functions and etc.:

~~~
> for (var i in user) { print(i, user[i]) }
name Anton Eprev
age 27
> function add(x){ return function(y){ return x + y } }
> add(3)(4)
7
> {
... for (var i = 0; i < 10; i++)
...     print(i)
... }
0
1
…
9
~~~
{:.javascript}


You can also use the `cat` function to read the file’s contents.

~~~
> var profile = cat('.profile')
> profile
export PATH=/opt/local/bin:/opt/local/sbin:$PATH
…
~~~
{:.javascript}

You may even explore global scope by executing `printjson(this)` and find out the following functions:

~~~
pwd()
ls()
cd()
mkdir()
hostname()
sleep()
hex_md5()
~~~
{:.javascript}

And finally, you can run a JavaScript file using MongoDB shell.

~~~
$ cat hello.js
print("Hello World!");
$ mongo --nodb hello.js
MongoDB shell version: 2.2.0
Hello World!
~~~

Happy coding =]
