import github from './modules/github';

const siteId = '1d7e043c-5d02-47fa-8ba8-9df0662ba82b';

const toJSON = (r) => JSON.stringify(r, null, 2);

const test = async () => {
  let out = '';

  const gh = await github.connect(siteId);

  out += toJSON(gh.user);
  out += '\n// lookiing for gigamonkeys membership\n';
  out += toJSON(await gh.membership('gigamonkeys'));

  out += '\n// Getting repo//`n';
  const r = await gh.orgRepos('gigamonkeys').getRepo('gigamonkey');
  out += toJSON(r);

  out += '\n// Checking .version exists/\n';
  out += toJSON(await r.fileExists('.version', 'main'));

  out += '\n// Checking .garbage exists/\n';
  out += toJSON(await r.fileExists('.garbage', 'main'));

  document.getElementById('stuff').innerText = out;
};

test();
