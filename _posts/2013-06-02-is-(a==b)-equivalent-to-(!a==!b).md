---
title: Is (a == b) equivalent to (!a == !b)?
layout: post
tags:
    - javascript
excerpt: Well, that’s not always true for JavaScript.
---

That’s not always true for JavaScript. Its comparison algorithm is quite complicated (see section [_11.9.3 The Abstract Equality Comparison Algorithm_](http://www.ecma-international.org/ecma-262/5.1/#sec-11.9.3) of ECMA-262 specification). And it returns `false` if `a` is `null` and type of `b` is other than Null or Undefined. Thus `(a == b)` is **false** if `a` is `null` and `b` is equal to `0`.

What’s happening to `(!a == !b)`? The logical Not operator converts its operand to Boolean and then negates it. Null values for Boolean becomes to false. Thus `(!a == !b)` is **true** if `a` is `null` and `b` is equal to `0`.

That’s it. Be careful with `null` values.
