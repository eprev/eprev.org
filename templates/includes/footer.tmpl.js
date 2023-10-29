/** @type {import('@eprev/wsngn').TemplateFunction} */
export default async ({ html, read, env }) => {
  return html`
      </div> <!-- .page__content -->
    </div> <!-- .page -->
    <script>
      ${env == 'production' && read('./gc.js')}
    </script>
  </body>
</html>`;
};
