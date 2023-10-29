/** @type {import('@eprev/wsngn').TemplateFunction} */
export default async ({ html, render, page }) => {
  const doc = /** @type {import('@eprev/wsngn').Document} */ (page);
  return html` ${render('includes/header')} ${doc.content}
  ${render('includes/footer')}`;
};
