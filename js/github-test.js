import github from './modules/github';

const siteId = '1d7e043c-5d02-47fa-8ba8-9df0662ba82b';

const toJSON = (r) => JSON.stringify(r, null, 2);

const test = async () => {
  let out = '';

  const gh = await github.connect(siteId);

  out += '\n// Getting repos\n';
  const repos = await gh.orgRepos('bhs-intro-to-programming').listRepos();
  //out += toJSON(repos);

  for (const r of repos) {
    if (!r.raw.is_template) {
      out += `In ${r.name} code.js exists: `;
      const exists = await r
        .newFileExists('assignments/simple-draw/code.js', 'assignments/simple-draw')
        .catch(() => false);
      out += exists;
      out += '\n';
      /*
      const text = await r.getFile("assignments/simple-draw/code.js", "assignments/simple-draw")
            .then((f) => atob(f.content))
            .catch(() => "Nothing");
            out += toJSON(text);
            */
    }
  }

  /*
  out += toJSON(gh.user);
  out += '\n// lookiing for gigamonkeys membership\n';
  out += toJSON(await gh.membership('gigamonkeys'));

  out += '\n// Getting repo//`n';
  const r = await gh.orgRepos('gigamonkeys').getRepo('gigamonkey');
  out += toJSON(r);

  out += '\n// Checking .version exists\n';
  out += toJSON(await r.fileExists('.version', 'main'));

  out += '\n// Checking .garbage exists\n';
  out += toJSON(await r.fileExists('.garbage', 'main'));

  out += `\n// Getting branch protection\n`;
  out += toJSON(await r.getBranchProtection('main').catch(() => 'No branch protection.'));

  out += `\n// Updating branch protection\n`;
  out += toJSON(
    await r.updateBranchProtection('main', {
      required_status_checks: null,
      enforce_admins: true,
      restrictions: null,
      required_pull_request_reviews: null,
      required_linear_history: false,
      allow_force_pushes: false,
      allow_deletions: false,
      block_creations: false,
      required_conversation_resolution: false,
    }),
  );
  */
  // out += `\n// Updating branch pull request review protection\n`;
  // out += toJSON(await r.updateBranchPullRequestReviewProtection('main'));

  document.getElementById('stuff').innerText = out;
};

test();
