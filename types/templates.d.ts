type TemplateContext = Record<string, any> & {
  html: (literals: TemplateStringsArray, ...placeholders: string[]) => string,
  read: (path: string) => string,
  url: (pathname: string) => string,
  escape: (text: string) => string,
  stringify: (json: any) => string,
};
type TemplateFunc = (context: TemplateContext) => string;
declare function template(fn: TemplateFunc): void;