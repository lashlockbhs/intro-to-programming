import github from './github';
import { $$, icon, text, a, url } from './whjqah';

const GITHUB_ORG = 'gigamonkeys'; // FIXME: load this from config file from website.
const TEMPLATE_OWNER = 'gigamonkey';
const TEMPLATE_REPO = 'itp-template';

const KEY = 'anonymousUntil';
const TTL = 15 * 60 * 1000; // fifteen minutes in milliseconds.

// FIXME, unify this with the one in whjqah
const $ = (selector) => document.querySelector(selector);

class Login {
  constructor() {
    this.username = null;
    this.profileURL = null;
    this.isMember = false;
    this.problemMakingRepo = null;
    this.createdRepo = false;
    this.repoURL = null;
  }

  logIn(username, profileURL) {
    this.username = username;
    this.profileURL = profileURL;
  }

  /* eslint-disable class-methods-use-this */
  get anonymous() {
    const v = sessionStorage.getItem(KEY);
    if (v === null) {
      return false;
    } else {
      const expiresAt = Number.parseInt(v, 10);
      if (expiresAt < Date.now()) {
        sessionStorage.removeItem(KEY);
        return false;
      } else {
        sessionStorage.setItem(KEY, String(Date.now() + TTL));
        return true;
      }
    }
  }

  set anonymous(value) {
    if (value) {
      sessionStorage.setItem(KEY, String(Date.now() + TTL));
    } else {
      sessionStorage.removeItem(KEY);
    }
  }
  /* eslint-enable */

  goAnonymous() {
    this.anonymous = true;
    this.showBanner();
  }

  get isLoggedIn() {
    return this.username !== null;
  }

  get ok() {
    return this.isLoggedIn && this.isMember && this.problemMakingRepo === null;
  }

  async connectToGithub() {
    $('#banner').hidden = true;

    const siteId = '6183282f-af29-4a93-a442-6c5bfb43a44f';
    const gh = await github.connect(siteId);

    this.logIn(gh.user.login, gh.user.html_url);

    let repo = null;

    if (await gh.membership(GITHUB_ORG)) {
      this.isMember = true;

      try {
        repo = await gh.orgRepos(GITHUB_ORG).getRepo(this.username);
      } catch (e) {
        try {
          repo = await gh
            .orgRepos(GITHUB_ORG)
            .makeRepoFromTemplate(this.username, TEMPLATE_OWNER, TEMPLATE_REPO);

          // Record that we created the repo now so we can show a banner about it.
          this.createdRepo = true;
        } catch (e) {
          console.log(e); // So I can debug if student runs into this.
          this.problemMakingRepo = e;
          repo = null;
        }
      }
    }

    if (repo !== null) {
      if (await repo.tryToProtectMain()) {
        console.log("Protected main");
      } else {
        console.log("Couldn't protect main. Will try again later.");
      }
      this.repoURL = repo.url;
    }

    this.showLoggedIn();

    if (repo === null || this.createdRepo) {
      this.showBanner();
    }

    return repo;
  }

  showBanner() {
    const b = $('#banner');

    if (this.anonymous || (this.ok && !this.createdRepo)) {
      b.hidden = true;
    } else {
      // Hide everything ...
      $$('#banner > div').forEach((e) => {
        e.hidden = true;
      });
      b.querySelector('.x').style.display = 'none';

      // ... and then show the right thing.
      if (!this.isLoggedIn) {
        b.querySelector('.logged-out').hidden = false;
      } else if (!this.isMember) {
        $('#banner .profile-url > span').replaceChildren(url(this.profileURL));
        $('#banner .profile-url > svg').onclick = () => {
          navigator.clipboard.writeText(this.profileURL);
        };
        b.querySelector('.not-a-member').hidden = false;
      } else if (this.problemMakingRepo) {
        b.querySelector('.x').style.display = 'inline';
        b.querySelector('.problem-with-repo').hidden = false;
      } else if (this.createdRepo) {
        b.querySelector('.x').style.display = 'inline';
        const div = b.querySelector('.created-repo');
        div.querySelector('span').replaceChildren(url(this.repoURL));
        div.hidden = false;
      }
      b.hidden = false;
    }
  }

  showLoggedIn() {
    const button = document.querySelector('.itp-toolbar .buttons .github');
    if (button) {
      const span = document.createElement('span');
      span.className = 'github-user';
      const u = this.repoURL ? a(this.username, this.repoURL, '_blank') : text(this.username);
      span.append(icon('github'));
      span.append(u);
      button.replaceWith(span);
    }
  }
}

export default Login;
