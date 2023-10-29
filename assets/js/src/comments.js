const plural = function (n, ...forms) {
  return forms[n === 1 ? 0 : 1];
};

const el = document.querySelector('[data-issue-id]');
if (el) {
  const issueId = el.dataset.issueId;
  fetch(`https://api.github.com/repos/eprev/eprev.org/issues/${issueId}`, {
      headers: new Headers({
        'Accept': 'application/vnd.github.v3.text+json'
      })
  }).then(response => {
    if (response.status === 200) {
      response.json().then(json => {
        const comments = json.comments;
        if (comments) {
          const html = `There ${
              plural(comments, 'is', 'are')
            } <a
                href="https://github.com/eprev/eprev.org/issues/${ issueId }"
                data-ga-on="click"
                data-ga-category="Click"
                data-ga-action="Comments"
                data-ga-label="${location.pathname}"
              >${ comments } ${
              plural(comments, 'comment', 'comments')
            }</a> on this (visit the post’s issue page on GitHub).`;
          el.querySelector('.post-comments__text').innerHTML = html;
        }
      })
    }
  });
}
