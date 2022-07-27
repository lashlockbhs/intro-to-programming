import Login from './modules/login';
import files from './modules/files';
import github from './modules/github';
import makeEvaluator from './modules/evaluator';
import monaco from './modules/editor';
import replize from './modules/repl';
import testing from './modules/testing';
import { jsonIfOk } from './modules/fetch-helpers';
import { choice } from './modules/shuffle';
import fruit from './modules/fruit';
import { $$, icon } from './modules/whjqah';

const $ = (selector) => document.querySelector(selector);

const login = new Login();

////////////////////////////////////////////////////////////////////////////////
// UI manipulations

const message = (text, fade) => {
  $('.itp-editor .minibuffer').innerText = text;
  if (fade) {
    setTimeout(() => {
      if ($('.itp-editor .minibuffer').innerText === text) {
        $('.itp-editor .minibuffer').innerText = '';
      }
    }, fade);
  }
};

const toggleInfo = () => {
  if ($('#banner').hidden) {
    showInfo();
  } else {
    hideInfo();
  }
};

const showInfo = () => {
  const b = $('#banner');
  $$('#banner > div').forEach((e) => {
    e.hidden = true;
  });
  b.querySelector('.x').style.display = 'inline';
  b.querySelector('.info').hidden = false;
  b.hidden = false;
};

const hideInfo = () => {
  $('#banner').hidden = true;
};

// End UI manipulations
////////////////////////////////////////////////////////////////////////////////

const editor = monaco('editor');
const repl = replize('repl');

// The window.location.pathname thing below is part of our base href kludge to
// deal with the monaco worker plugin files (see modules/editor.js). Since we've
// likely set a <base> in our HTML we need to do this gross thing to convert
// this back to a relative link. FIXME: is this still needed. I don't think so.
const configuration = async () => fetch(`${window.location.pathname}config.json`).then(jsonIfOk);

const makeStorage = async () => {
  let branch = window.location.pathname.substring(1);

  if (branch.endsWith('/')) {
    branch = branch.substring(0, branch.length - 1);
  }

  let repo = null;
  if (github.hasToken()) {
    repo = await login.connectToGithub();
  } else {
    repo = null;
    login.showBanner();
  }

  return files(branch, repo);
};

const maybeSetupTesting = (config) => {
  if (config.testing) {
    const testCases = config.testing.cases;
    const t = testing($(config.testing.id), testCases);
    return () => {
      window.runTests(testCases, (r) => t.update(r));
    };
  } else {
    return () => console.log('no testing callback');
  }
};

/* eslint-disable no-unused-vars */
const randomFruitBomb = () => {
  const m = editor.getModel();
  const line = Math.floor(Math.random() * m.getLineCount());
  const column = Math.floor(Math.random() * m.getLineContent(line).length);
  m.applyEdits([
    {
      range: { startLineNumber: line, endLineNumber: line, startColumn: column, endColumn: column },
      text: choice(fruit),
    },
  ]);
};
/* eslint-enable */

const setupToolbar = (attachToGithub) => {
  const toolbarButtons = document.querySelector('.itp-toolbar .buttons');

  const login = toolbarButtons.querySelector('.github');
  if (login) {
    login.onclick = attachToGithub;
  }

  const infoToggler = icon('info-circle');
  infoToggler.onclick = toggleInfo;
  toolbarButtons.append(infoToggler);
};

const setup = async () => {
  const config = await configuration();
  const storage = await makeStorage();
  const evaluator = makeEvaluator(config.iframe, config.script, repl, message);

  const testingCallback = maybeSetupTesting(config);

  const [filename] = config.files;

  // Put code in editor and evaluate it.
  const fillEditor = (code) => {
    editor.setValue(code);
    evaluator.load(code, filename, testingCallback);
  };

  // Evaluate code now in editor and also save it.
  const reevaluateCode = () => {
    const code = editor.getValue();
    storage.save(filename, code).then((f) => {
      if (f.updated || f.created) {
        console.log('Saved.'); // FIXME: should show this in the web UI somewhere.
      }
    });
    evaluator.load(code, filename, testingCallback);
  };

  // For when we log in to GitHub after the user has loaded the page and maybe
  // even edited the file. FIXME: this doesn't do anything with the machinery
  // (which probably isn't fully baked) for saving versions of files while
  // disconnected.
  const attachToGithub = async () => {
    if (login.isLoggedIn) return;

    storage.repo = await login.connectToGithub();

    const current = editor.getValue();
    const starter = await storage.loadFromWeb(filename);
    const inRepo = await storage.ensureFileInBranch(filename);

    if (current === starter && inRepo !== starter) {
      // I.e. we loaded the page, got the starter, and then logged in
      // immediately. Switch to repo version.
      fillEditor(inRepo);
    } else if (current !== starter && current !== inRepo) {
      // We loaded the page, messed about with the code, and then logged in.
      // Don't really need to do anything since we're just going to leave things
      // as they are. However might be nice to ask if they want to revert to
      // what's in the repo. Or show a diff. Or whatever. If they then evaluate
      // the code it will be saved, stomping the latet verson in git. Of course,
      // old versions are recoverable from git though not presently through this
      // code UI.
    }
  };

  setupToolbar(attachToGithub);

  if (storage.repo !== null) {
    storage.ensureFileInBranch(filename).then(fillEditor);
  } else {
    storage.load(filename).then(fillEditor);
  }

  $('#login').onclick = attachToGithub;
  $('#anonymous').onclick = () => login.goAnonymous();
  $('#banner svg.x').onclick = hideInfo;

  $('.itp-editor .itp-run-code').onclick = reevaluateCode;

  $('.itp-editor .minibuffer').onclick = () => {
    $('.itp-editor .minibuffer').innerText = '';
  };

  repl.focus();
};

setup();
