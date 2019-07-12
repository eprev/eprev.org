declare var __name__: string;
declare var page: any;
declare var site: any;
declare var env: any;
declare function print(content: string): void;
declare function read(path: string): string;
declare function url(pathname: string): string;
declare function html(
  literals: TemplateStringsArray,
  ...placeholders: string[]
): string;
declare function escape(text: string): string;
declare function stringify(json: any): string;
