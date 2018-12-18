<!--
tags:
  - javascript
  - hacking-web
  - information-retrieval
description: How to implement a full-text search for a static website from scratch.
-->

# Adding full-text search to a static website



## Theory

Full-text search is the most common application of the [information retrieval](https://en.wikipedia.org/wiki/Information_retrieval) techniques. There’re a vast number of resources (and white papers in particular) available if you find yourself interested, so I’ll keep this part short and simple.

### Vector space

Search deals with queries and documents. Both can be represented as multi-dimensional vectors:

```math
d_j = ( w_{1,j} ,w_{2,j} , \dotsc ,w_{n,j} ), \:
q = ( w_{1,q} ,w_{2,q} , \dotsc ,w_{n,q} ).
```
<!--: caption="(1)" -->

Each vector dimension corresponds to a single _term_ in the entire collection of documents. Typically terms are single words or word stems. If the term `$t$` occurs in the document `$d_j$`, its value in the vector `$w_{t,j} > 0$`.

There’re many different methods to calculate those values (weights), and one of the most commonly used term-weighting schemes is _tf-idf_ (short for _term frequency–inverse document frequency_).

### Tf-idf

The term frequency `$\mathrm{tf}(t,d)$` is how often the term `$t$` occurs in the document `$d$`. In the simplest case:

```math
\mathrm{tf}(t,d) = f_{t,d},
```

where `$f_{t,d}$` is the number of times the term `$t$` appears in the document `$d$`.

The inverse document frequency `$\mathrm{idf}(t)$` is the inverse fraction of the number of documents that contain at least one instance of the term `$t$`:

```math
\mathrm{idf}(t) = \log \frac{ N }{ n_t },
```

where `$N$` is the total number of documents in the collection and `$n_t$` is the number of documents where the term `$t$` appears.

In other words, the term frequency is a measure of how important the term is to the document and the inverse document frequency is a measure of how much information the term provides.

Tf-idf is a product of the term frequency and the inverse document frequency:

```math
\text{tf-idf}(t,d) = \mathrm{tf}(t,d) \cdot \mathrm{idf}(t)
```

A high value in tf–idf is reached by a high term frequency (in the given document) and a low document frequency of the term (in the entire collection of documents). As a term appears in more documents, the ratio inside the logarithm approaches `1`, bringing the idf and tf–idf closer to `0`. This is exactly how tf-idf penalizes the commonly used terms.

As for `$w_{i,j}$` and `$w_{i,q}$` from (1), there’re various tf-idf weighting schemes exist for terms that appear in documents and queries. I picked the following one without any particular reason:

```math
w_{t,j} = f_{t,d_j} \cdot \log { \frac {N}{n_{t}} },
```
<!--: caption="(2)" -->

```math
w_{t,q} = \left( 0.5 + 0.5 { \frac {f_{t,q}}{\max _{t}f_{t,q}} } \right) \cdot \log { \frac {N}{n_{t}} }.
```
<!--: caption="(3)" -->

### Cosine similarity

To calculate the relevance of a document to a query, we’ll use a measure called _cosine similarity_.

The angle, `$0 \leq \theta \leq \pi/_2$`, between two vectors represents how similar they are to each other. For identical vectors `$\cos(\theta) = 1$`, while it’s equal to `$0$` for completely opposite vectors.

The formula for the cosine of the angle between two vectors is:

```math
\cos(\theta) = \frac
{
  A \cdot B
}{
  \left\lVert A \right\rVert \left\lVert B \right\rVert
},
```

where `$A$` and `$B$` are vectors, `$A \cdot B$` is the dot product of those vectors, `$\left\lVert A \right\rVert$` and `$\left\lVert B \right\rVert$` are the magnitudes (or lengths) of vector `$A$` and `$B$` respectively.

Having the document `$d_j$` and the query `$q$` represented as two vectors (1), their similarity can be defined as:

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

That’s all we need to know for now.
