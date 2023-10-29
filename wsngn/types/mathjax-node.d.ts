declare const mj : MathJax;

// https://github.com/mathjax/MathJax-node
type MathJax = {
  typeset: (options: {
    math: string,
    format: "TeX" | "MathML" ,
    html?: boolean,
    svg?: boolean,
  }) => Promise<{svg?: string, html?: string}>,
}

declare module 'mathjax-node' {
    export = mj;
}

