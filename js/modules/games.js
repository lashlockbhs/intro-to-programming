import { $, icon } from './whjqah';

const addToolbarButtons = () => {
  const toolbarButtons = document.querySelector('.itp-toolbar .buttons');

  const infoToggler = icon('info-circle');
  infoToggler.onclick = visibilityToggler('#info');
  toolbarButtons.append(infoToggler);

  const logToggler = icon('list');
  logToggler.onclick = visibilityToggler('#log');
  toolbarButtons.append(logToggler);
};

const visibilityToggler = (id) => {
  return () => {
    const element = $(id);
    element.style.display = element.style.display === 'none' ? 'block' : 'none';
  };
};

export { addToolbarButtons };
