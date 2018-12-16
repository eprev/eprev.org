<!--
tags:
  - javascript
  - hacking-web
  - information-retrieval
description: How to implement a full-text search for a static website from scratch.
-->

# Adding full-text search to a static website

## Theory

### Vector space model

Both documents and queries can be represented as multi-dimensional vectors:

```math
d_j = ( w_{1,j} ,w_{2,j} , \dotsc ,w_{n,j} ), \:
q = ( w_{1,q} ,w_{2,q} , \dotsc ,w_{n,q} ).
```

Each dimension corresponds to a single _term_ in the entire set of documents. Typically terms are single words or word stems. If the term `$t$` occurs in the document `$d_j$`, its value in the vector `$w_{t,j} > 0$`. There’re many different methods to calculate those values (weights), and one of the most commonly used term-weighting schemes is _tf-idf_ (short for _term frequency–inverse document frequency_).

### TF-IDF

### Cosine similarity

To calculate the relevance of a document to a query, we’ll be using a measure called _cosine similarity_. The angle, `$0 \leq \theta \leq \pi/_2$`, between two term frequency vectors represents how similar they are to each other. For identical vectors `$\cos(\theta) = 1$`, while it’s equal to `$0$` for completely opposite vectors.

The formula for the cosine of the angle between two vectors is:

```math
\cos(\theta) = \frac
{
  A \cdot B
}{
  \left\lVert A \right\rVert \left\lVert B \right\rVert
} = \frac
{
  \sum \limits_{i=1}^{n} A_{i}B_{i}
}{
  \sqrt { \sum \limits_{i=1}^{n} A_{i}^{2} }
  \sqrt { \sum \limits_{i=1}^{n} B_{i}^{2} }
},
```

where `$A$` and `$B$` are vectors, `$A \cdot B$` is the dot product of those vectors, `$\left\lVert A \right\rVert$` and `$\left\lVert B \right\rVert$` are the magnitudes (or lengths) of those vectors, and `$A_{i}$` and `$B_{i}$` are the components of vector `$A$` and `$B$` respectively.

Therefore, for given the document `$d_j$` and the query `$q$`, their similarity can be defined as:

```math
similarity(d_j, q) = \frac
{
  \sum \limits_{i=1}^{n} w_{i,j}w_{i,q}
}{
  \sqrt { \sum \limits_{i=1}^{n} w_{i,j}^{2} }
  \sqrt { \sum \limits_{i=1}^{n} w_{i,q}^{2} }
}.
```
