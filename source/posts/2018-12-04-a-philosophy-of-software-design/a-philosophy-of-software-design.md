<!--
tags:
  - worth-watching
  - computer-science
description: Notes on how to (and how to not) design software.
share-image: og-preview.png
-->

# A philosophy of Software Design

In his “[A Philosophy of Software Design](https://www.youtube.com/watch?v=bmSAYlu0NcY)” presentation at Google in 2018, John Ousterhout talked about how to (and how not to) design software and touched on a few key topics.

- Problem decomposition is the most important concept of computer science.
- Classes should be deep. Interface (methods signatures, dependencies and etc.) is a cost and functionality is a benefit. Aim for greater benefit, least cost. UNIX file I/O is a great example of a deep interface.
- Exceptions are a huge source of complexity. Minimize the number of places where exceptions should be handled. For instance, instead of throwing an exception if either index is outside of the range of the string, define a method to extract a substring as returning an overlap between the indexes and the available contents.
- Complexity isn’t one mistake you make, it’s a result of hundreds and thousands mistakes made by many people over a period of time.
- Working code isn’t enough. Tactical programming (“Move fast and break things”) incrementally increases complexity.
- You have to invest in a good design. It should be fine to go slower by 10-20%.

<!--: class="post__content-list" -->
