import github from './modules/github';

const scopes = ['repo', 'user'];
const siteId = '1d7e043c-5d02-47fa-8ba8-9df0662ba82b';

const toJSON = (r) => JSON.stringify(r, null, 2);

let gh = null;

const login = async () => {
  try {
    gh = await github.connect(siteId, scopes);
    document.getElementById('after-login').hidden = false;
  } catch (e) {
    document.getElementById('bad-login').hidden = false;
  }
};

const showAlreadyExists = (name) => {
  const p = document.getElementById('already-exists');
  p.querySelector('code').innerText = name;
  p.hidden = false;
};

const showLink = (link) => {
  const p = document.getElementById('send-link');
  const a = p.querySelector('a.link');
  a.href = link;
  a.innerText = link;
  p.hidden = false;
};

const showProblem = (e) => {
  const p = document.getElementById('show-problem');
  p.querySelector('code').innerText = String(e);
  p.hidden = false;
};

const makeRepo = async () => {
  const name = document.getElementById('repo-name').value;

  if (await gh.repoExists(name)) {
    showAlreadyExists(name);
  } else {
    document.getElementById('creating').hidden = false;
    try {
      const repo = await gh.makeRepoFromTemplate(name, 'gigamonkey', 'itp-template');
      showLink(repo.html_url);
    } catch (e) {
      showProblem(e);
    }
  }
};

document.getElementById('login').onclick = login;
document.getElementById('doit').onclick = makeRepo;