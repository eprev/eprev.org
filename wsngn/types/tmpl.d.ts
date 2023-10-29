import{
  html as tmplHtml,
  TemplateRender
} from "../lib/template.js"

declare global {
  const html: typeof tmplHtml;
  const render: TemplateRender,
  const __name__: string | undefined;
  const __dirname__: string | undefined;
  const escape: (pathname: string) => string;
  const stringify: (pathname: string) => string;
  const url: (pathname: string) => string;
  const require: (pathname: string) => string;
  const read: (pathname: string) => string | undefined;
  const page: unknown;
}
