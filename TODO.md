- Make fake Console methods into properties so .forEach(console.log) works.

- Fix REPL pretty printer

- Give a way to explicitly save with a comment so the branches aren't 100% "Updating".

- Add link to branch (or to create PR) from assignment pages. (Could maybe be
  extra fancy and mark the assignment as turned in if the branch has been merged
  to main.)

- Break out DOM manipulation stuff into module. (And harmonize with with whjqah.js)

- Add README to itp-template

- Move itp-template into gigamonkeys org

- Rename gigamonkeys org or make new one.

- Kick out testers

- Move "Saving" indicator into web page.

- Work on responsive design, esp. for games.

- Inject run-tests.js into the iframe if testing is on rather than requiring a
  frame to specify it.

- Show stack traces (see error.stack also
  https://github.com/stacktracejs/stacktrace.js)

- Support multiple files in a project/assignment.

- Make the clipboard icon in the banner move a bit when you press it.

- Someday, should probably figure out if this thing should really be a GitHub
  App for finer grained permissions plus maybe the ability to do stuff in the
  org that the user doesn't have permission to do.

- Can we use web workers for evaluation? They can only load from files, it
  seems, which might be a problem. (Maybe just pass the code in as a string via
  postMessage and `eval` or `Function()` it in the worker.)

- Deal with array out of bounds rather than returning undefined. (???)

- Show all the values that would have worked.

- Better commentary when expected answer is array and the given answer
  is an array but the element at the index is not the right type.

- Maybe add a version of holes game where the answers are just types.

- Show what wrong answers would have evaluated to (or that they
  wouldn't because of a type mismattch.)

- Add expressions in answers (e.g. 3 + 2 could be the answer to 6 >
  ??? ==> true).

- Actually use leveling, adjust it upwards when enough questions are
  answered correctly.

- Add variables somehow. Possibly just a table of variable values and
  then some answers are variable names.

- Maybe display log like a REPL: show the expression with the answer
  filled in, then what it evaluates to or "Type error" with some
  explanation. And maybe then the correct expression and what it
  evaluates to.

# Maybe not.

- Investigate using data URLs to import editor code as module into REPL. (Idea
  being: repl code is evaluated as a module but includes a line that does a
  dynamic import of a data URL containing the current code from the editor. That
  would mean that only exported things would be available in the REPL but that
  might actually be good?)

- Use netlify \_rewrite rule
  (https://docs.netlify.com/routing/redirects/rewrites-proxies/) to have a
  single page that handles all branches

- Show SHA subtly somewhere in web page.
