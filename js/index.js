import Login from './modules/login';
import makeEvaluator from './modules/evaluator';
import monaco from './modules/editor';
import replize from './modules/repl';
import testing from './modules/testing';
import { jsonIfOk } from './modules/fetch-helpers';
import { choice } from './modules/shuffle';
import fruit from './modules/fruit';

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

// End UI manipulations
////////////////////////////////////////////////////////////////////////////////

const editor = monaco('editor');
const repl = replize('repl');

const configuration = async () => fetch('config.json').then(jsonIfOk);

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

const setup = async () => {
  const config = await configuration();
  const storage = await login.makeStorage();
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
  const onAttachToGithub = async () => {
    const current = editor.getValue();
    const starter = await storage.loadFromWeb(filename);

    if (login.isMember && !login.pending) {
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
    }
  };

  login.setupToolbar(onAttachToGithub);

  if (storage.repo !== null) {
    storage.ensureFileInBranch(filename).then(fillEditor);
  } else {
    storage.load(filename).then(fillEditor);
  }

  $('.itp-editor .itp-run-code').onclick = reevaluateCode;

  $('.itp-editor .minibuffer').onclick = () => {
    $('.itp-editor .minibuffer').innerText = '';
  };
};

setup();
