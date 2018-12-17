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
<!--: caption="(1)" -->

Each dimension corresponds to a single _term_ in the entire set of documents. Typically terms are single words or word stems. If the term `$t$` occurs in the document `$d_j$`, its value in the vector `$w_{t,j} > 0$`. There’re many different methods to calculate those values (weights), and one of the most commonly used term-weighting schemes is _tf-idf_ (short for _term frequency–inverse document frequency_).

### Tf-idf

The term frequency `$\mathrm{tf}(t,d)$` is how often the term `$t$` occurs in the document `$d$`. In the simplest case, `$\mathrm{tf}(t,d) = f_{t,d}$`, where `$f_{t,d}$` is the number of times the term `$t$` appears in the document `$d$`.

The inverse document frequency `$\mathrm{idf}(t, D)$` is the inverse fraction of the number of documents that contain at least one instance of the term `$t$`:

```math
\mathrm{idf}(t, D) = \log \frac{ |D| }{ |\{d \in D: t \in d\}| } = \log \frac{ N }{ n_t },
```

where `$N$` is the total number of documents and `$n_t$` is the number of documents where the term `$t$` appears.

The term frequency is a measure of how important the term is to the document and the inverse document frequency is a measure of how much information the term provides.

Tt-idf is a product of the term frequency and the inverse document frequency:

```math
\text{tf-idf}(t,d,D) = \mathrm{tf}(t,d) \cdot \mathrm{idf}(t,D)
```

A high weight in tf–idf is reached by a high term frequency (in the given document) and a low document frequency of the term in the whole collection of documents. As a term appears in more documents, the ratio inside the logarithm approaches `1`, bringing the idf and tf–idf closer to `0`, thereby penalizing commonly used therms.

There’re different schemes exist for weighting of therms in documents and queries. I picked the following one without any particular reason.

The document term weighting scheme is:

```math
w_{t,j} = f_{t,d_j} \cdot \log { \frac {N}{n_{t}} }.
```
<!--: caption="(2)" -->

And the query term weighting scheme is:

```math
w_{t,q} = \left( 0.5 + 0.5 { \frac {f_{t,q}}{\max _{t}f_{t,q}} } \right) \cdot \log { \frac {N}{n_{t}} }.
```
<!--: caption="(3)" -->

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
<!--: caption="(4)" -->
