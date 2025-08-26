import {
  parseMarkdownToList,
  parseMarkdownFromTable,
} from './markdown-parser.js';

document.addEventListener('DOMContentLoaded', () => {
  // --- App State ---
  let currentProgram = null;
  let currentUser = null;
  let dossierStatus = 'open'; // 'open', 'ingediend', 'gereviewd', 'afgesloten'
  let availableYears = [];

  // --- DOM Element References ---
  const dom = {
    dashboardScreen: document.getElementById('dashboard-screen'),
    werkprogrammaScreen: document.getElementById('werkprogramma-screen'),
    btnLogout: document.getElementById('btn-logout'),
    userDisplayDashboard: document.getElementById('user-display-dashboard'),
    userDisplayWerkprogramma: document.getElementById(
      'user-display-werkprogramma',
    ),
    apiKeyInput: document.getElementById('api-key-input'),
    fiscalYearSelect: document.getElementById('fiscal-year-select'),
    btnAddYear: document.getElementById('btn-add-year'),
    btnIb: document.getElementById('btn-ib'),
    btnVpb: document.getElementById('btn-vpb'),
    clientSelectionContainer: document.getElementById(
      'client-selection-container',
    ),
    clientSelect: document.getElementById('client-select'),
    btnOpenWerkprogramma: document.getElementById('btn-open-werkprogramma'),
    btnBackToDashboard: document.getElementById('btn-back-to-dashboard'),
    headerSubtitle: document.getElementById('header-subtitle'),
    werkprogrammaContainer: document.getElementById('werkprogramma-container'),
    dossierStatusContainer: document.getElementById('dossier-status-container'),
    dossierStatusBadge: document.getElementById('dossier-status-badge'),
    btnSubmit: document.getElementById('btn-submit'),
    btnReview: document.getElementById('btn-review'),
    btnClose: document.getElementById('btn-close'),
    btnReopen: document.getElementById('btn-reopen'),
    btnExport: document.getElementById('btn-export'),
    importFile: document.getElementById('import-file'),
  };

  // --- Data ---
  const clients = {
    ib: ['Jan Jansen', 'Pim Jansen', 'Anne de Jong'],
    vpb: ['Test B.V.', 'Test 2 B.V.', 'Holding X B.V.'],
  };
  const permissions = {
    opsteller: {
      canSubmit: true,
      canReview: false,
      canClose: false,
      canReopen: false,
      canAddYear: false,
    },
    reviewer: {
      canSubmit: true,
      canReview: true,
      canClose: true,
      canReopen: true,
      canAddYear: true,
    },
    admin: {
      canSubmit: true,
      canReview: true,
      canClose: true,
      canReopen: true,
      canAddYear: true,
    },
  };

  // --- Initialization ---
  async function init() {
    const token = sessionStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html';
      return;
    }
    try {
      const res = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      currentUser = data.user;
    } catch (err) {
      window.location.href = 'login.html';
      return;
    }

    const currentYear = new Date().getFullYear();
    availableYears = [currentYear, currentYear - 1, currentYear - 2];
    populateFiscalYears();

    // Event Listeners
    dom.btnLogout.addEventListener('click', handleLogout);
    dom.btnAddYear.addEventListener('click', handleAddYear);
    dom.btnIb.addEventListener('click', () => setupClientSelection('ib'));
    dom.btnVpb.addEventListener('click', () => setupClientSelection('vpb'));
    dom.clientSelect.addEventListener('change', () => {
      dom.btnOpenWerkprogramma.disabled = !dom.clientSelect.value;
    });
    dom.btnOpenWerkprogramma.addEventListener('click', openWerkprogramma);
    dom.btnBackToDashboard.addEventListener('click', showDashboard);
    dom.btnExport.addEventListener('click', handleExport);
    dom.importFile.addEventListener('change', handleImport);

    dom.btnSubmit.addEventListener('click', () =>
      updateDossierStatus('ingediend', 'Dossier ingediend.'),
    );
    dom.btnReview.addEventListener('click', () =>
      updateDossierStatus('gereviewd', 'Dossier gereviewd.'),
    );
    dom.btnClose.addEventListener('click', () =>
      updateDossierStatus('afgesloten', 'Dossier afgesloten.'),
    );
    dom.btnReopen.addEventListener('click', () => {
      const reason = prompt('Reden voor heropenen:');
      if (reason && reason.trim() !== '') {
        console.log(
          `MOCK AUDIT TRAIL: Dossier heropend door ${currentUser.name}. Reden: ${reason}`,
        );
        updateDossierStatus('open', 'Dossier heropend.');
      } else if (reason !== null) {
        showToast('Een reden is verplicht om het dossier te heropenen.');
      }
    });

    dom.userDisplayDashboard.textContent = `Ingelogd als: ${currentUser.name}`;
    dom.userDisplayWerkprogramma.textContent = `Ingelogd als: ${currentUser.name}`;
    dom.btnAddYear.classList.toggle(
      'hidden',
      !permissions[currentUser.role].canAddYear,
    );

    showDashboard();
  }

  // --- Core Functions ---
  function populateFiscalYears() {
    dom.fiscalYearSelect.innerHTML = '';
    availableYears
      .sort((a, b) => b - a)
      .forEach((year) => {
        dom.fiscalYearSelect.appendChild(new Option(year, year));
      });
  }

  async function handleLogout() {
    const token = sessionStorage.getItem('token');
    try {
      await fetch('/api/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {}
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
  }

  function handleAddYear() {
    const latestYear = Math.max(...availableYears);
    const newYear = prompt('Voer het nieuwe fiscale jaar in:', latestYear + 1);
    if (newYear && !isNaN(newYear) && newYear > 1900) {
      const year = parseInt(newYear, 10);
      if (availableYears.includes(year)) {
        showToast(`Fiscaal jaar ${year} bestaat al.`);
        return;
      }
      availableYears.push(year);
      populateFiscalYears();
      dom.fiscalYearSelect.value = year;
      showToast(
        `Fiscaal jaar ${year} aangemaakt. Commentaren met 'doorrol' optie zijn (gesimuleerd) overgenomen.`,
      );
    } else if (newYear !== null) {
      showToast('Ongeldig jaartal ingevoerd.');
    }
  }

  function showDashboard() {
    dom.dashboardScreen.classList.remove('hidden');
    dom.werkprogrammaScreen.classList.add('hidden');
  }

  function openWerkprogramma() {
    if (!currentProgram || !dom.clientSelect.value) return;
    dom.dashboardScreen.classList.add('hidden');
    dom.werkprogrammaScreen.classList.remove('hidden');
    dossierStatus = 'open';
    loadAndRenderWorkProgram(
      currentProgram,
      dom.clientSelect.value,
      dom.fiscalYearSelect.value,
    );
  }

  function setupClientSelection(programType) {
    currentProgram = programType;
    setActiveButton(
      programType === 'ib' ? dom.btnIb : dom.btnVpb,
      '.program-btn',
    );

    dom.clientSelect.innerHTML = '<option value="">-- Selecteer --</option>';
    clients[programType].forEach((client) => {
      dom.clientSelect.appendChild(new Option(client, client));
    });

    dom.clientSelectionContainer.classList.remove('hidden');
    dom.btnOpenWerkprogramma.disabled = true;
  }

  function updateDossierStatus(newStatus, toastMessage) {
    dossierStatus = newStatus;
    updateUIForRoleAndStatus();
    showToast(toastMessage);
  }

  function updateUIForRoleAndStatus() {
    if (!currentUser) return;
    const rolePerms = permissions[currentUser.role];
    const isLocked = dossierStatus === 'afgesloten';

    dom.dossierStatusBadge.textContent =
      dossierStatus.charAt(0).toUpperCase() + dossierStatus.slice(1);
    dom.dossierStatusBadge.className =
      'font-bold px-2 py-1 rounded-full ' +
      (isLocked ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800');
    if (dom.clientSelect.value) {
      dom.dossierStatusContainer.classList.remove('hidden');
    }

    const fieldset = document.getElementById('form-fieldset');
    if (fieldset) {
      fieldset.disabled = isLocked && currentUser.role === 'opsteller';
    }

    dom.btnSubmit.classList.toggle(
      'hidden',
      !rolePerms.canSubmit || dossierStatus !== 'open',
    );
    dom.btnReview.classList.toggle(
      'hidden',
      !rolePerms.canReview || dossierStatus !== 'ingediend',
    );
    dom.btnClose.classList.toggle(
      'hidden',
      !rolePerms.canClose || dossierStatus !== 'gereviewd',
    );
    dom.btnReopen.classList.toggle('hidden', !rolePerms.canReopen || !isLocked);
  }

  async function loadAndRenderWorkProgram(type, clientName, fiscalYear) {
    dom.werkprogrammaContainer.innerHTML = `<div class="text-center p-8"><p class="text-gray-500">Werkprogramma wordt geladen...</p></div>`;
    dom.headerSubtitle.textContent = `Werkprogramma ${type.toUpperCase()} voor ${clientName} - Fiscaal Jaar ${fiscalYear}`;

    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const [clientMd, taxMd] = await Promise.all([
        fetch('werkprogramma_client.md').then((r) => r.text()),
        fetch(
          type === 'ib'
            ? 'werkprogramma_inkomstenbelasting.md'
            : 'werkprogramma_vennootschapsbelasting.md',
        ).then((r) => r.text()),
      ]);
      const clientQuestions = parseMarkdownToList(clientMd);
      const taxQuestions =
        type === 'ib'
          ? parseMarkdownToList(taxMd)
          : parseMarkdownFromTable(taxMd);

      dom.werkprogrammaContainer.innerHTML = `
        <fieldset id="form-fieldset">
          <div class="border-b border-gray-200">
            <nav class="-mb-px flex space-x-8" aria-label="Tabs">
              <button id="tab-client" class="tab-btn whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">Klant</button>
              <button id="tab-tax" class="tab-btn whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">Aangifte</button>
            </nav>
          </div>
          <div id="client-pane" class="content-pane py-4"></div>
          <div id="tax-pane" class="content-pane py-4 hidden"></div>
        </fieldset>`;

      const clientPane = document.getElementById('client-pane');
      const taxPane = document.getElementById('tax-pane');
      renderQuestions(clientQuestions, clientPane, 'client');
      renderQuestions(taxQuestions, taxPane, type);

      const tabClient = document.getElementById('tab-client');
      const tabTax = document.getElementById('tab-tax');

      setActiveButton(tabClient, '.tab-btn');
      tabClient.addEventListener('click', () => {
        setActiveButton(tabClient, '.tab-btn');
        clientPane.classList.remove('hidden');
        taxPane.classList.add('hidden');
      });
      tabTax.addEventListener('click', () => {
        setActiveButton(tabTax, '.tab-btn');
        clientPane.classList.add('hidden');
        taxPane.classList.remove('hidden');
      });

      updateUIForRoleAndStatus();
    } catch (error) {
      console.error(`Failed to load work program for ${type}:`, error);
      dom.werkprogrammaContainer.innerHTML =
        '<p class="text-red-500 text-center">Fout bij het laden van het werkprogramma.</p>';
    }
  }

  // --- Import/Export Functions ---
  function handleExport() {
    let content = `# Werkprogramma ${currentProgram.toUpperCase()} - ${dom.clientSelect.value}\n`;
    content += `# Fiscaal Jaar: ${dom.fiscalYearSelect.value}\n`;
    content += `# Status: ${dossierStatus}\n\n`;

    document.querySelectorAll('.question-container').forEach((q) => {
      const id = q.dataset.questionId;
      if (!id) return;
      const text = q.querySelector('p').textContent.replace(`${id}. `, '');
      const checkedRadio = q.querySelector(
        `input[name="answer-${id}"]:checked`,
      );
      const comment = q.querySelector(`#comment-${id}`).value;
      const rollover = q.querySelector(`#comment-rollover-${id}`).checked;

      if (checkedRadio) {
        const answer = checkedRadio.parentElement.textContent.trim();
        content += `${id}. ${text}\n`;
        content += `   Antwoord: ${answer}\n`;
        content += `   Commentaar: ${comment}\n`;
        content += `   Doorrollen: ${rollover ? 'Ja' : 'Nee'}\n\n`;
      }
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `werkprogramma-${dom.clientSelect.value.replace(/ /g, '_')}-${dom.fiscalYearSelect.value}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Dossier geëxporteerd.');
  }

  function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const lines = content.split('\n');
      let currentId = null;

      lines.forEach((line) => {
        let match;
        if ((match = line.match(/^([0-9a-zA-Z]+)\./))) {
          currentId = match[1];
        } else if (
          currentId &&
          (match = line.match(/^\s+Antwoord:\s(Ja|Nee|N\.v\.t\.)/i))
        ) {
          const answer = match[1].toLowerCase().replace('n.v.t.', 'na');
          const radio = document.querySelector(
            `input[name="answer-${currentId}"][value="${answer}"]`,
          );
          if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
          }
        } else if (currentId && (match = line.match(/^\s+Commentaar:\s(.*)/))) {
          const commentEl = document.getElementById(`comment-${currentId}`);
          if (commentEl) commentEl.value = match[1];
        } else if (
          currentId &&
          (match = line.match(/^\s+Doorrollen:\s(Ja|Nee)/i))
        ) {
          const rolloverEl = document.getElementById(
            `comment-rollover-${currentId}`,
          );
          if (rolloverEl) rolloverEl.checked = match[1].toLowerCase() === 'ja';
        }
      });
      showToast('Dossier geïmporteerd.');
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  // --- Utility Functions ---
  function setActiveButton(activeButton, selector) {
    document
      .querySelectorAll(selector)
      .forEach((btn) => btn.classList.remove('active'));
    if (activeButton) activeButton.classList.add('active');
  }

  function renderQuestions(questions, container, type) {
    questions.forEach((q) =>
      container.appendChild(createQuestionElement(q, type)),
    );
  }

  function createQuestionElement(q, type) {
    if (q.isHeading) {
      const heading = document.createElement('h2');
      heading.className = 'werkprogramma-heading';
      heading.textContent = q.text;
      return heading;
    }

    const hasChildren = q.children && q.children.length > 0;
    const questionWrapper = document.createElement(
      hasChildren ? 'details' : 'div',
    );
    questionWrapper.className =
      'question-container py-4 border-b border-gray-200';
    questionWrapper.id = `question-${q.id}`;
    questionWrapper.dataset.questionId = q.id;

    const contentWrapper = document.createElement(
      hasChildren ? 'summary' : 'div',
    );

    const questionText = document.createElement('p');
    questionText.className = 'font-semibold text-gray-700 inline';
    questionText.textContent = q.isDetail ? q.text : `${q.id}. ${q.text}`;
    contentWrapper.appendChild(questionText);

    if (!q.isDetail) {
      const radioContainer = document.createElement('div');
      radioContainer.className = 'mt-2 flex items-center gap-x-6';
      radioContainer.innerHTML = `
        <label class="flex items-center space-x-2 cursor-pointer"><input type="radio" name="answer-${q.id}" value="yes" class="form-radio h-4 w-4 text-blue-600"><span>Ja</span></label>
        <label class="flex items-center space-x-2 cursor-pointer"><input type="radio" name="answer-${q.id}" value="no" class="form-radio h-4 w-4 text-blue-600"><span>Nee</span></label>
        <label class="flex items-center space-x-2 cursor-pointer"><input type="radio" name="answer-${q.id}" value="na" class="form-radio h-4 w-4 text-blue-600" checked><span>N.v.t.</span></label>`;
      if (type === 'ib' || type === 'client') {
        radioContainer.addEventListener('change', (e) =>
          handleAnswerChange(questionWrapper, q, e.target.value),
        );
      }
      contentWrapper.appendChild(radioContainer);
    }

    const commentContainer = document.createElement('div');
    commentContainer.className = 'mt-3 space-y-2';
    commentContainer.innerHTML = `
      <textarea id="comment-${q.id}" class="w-full p-2 border border-gray-300 rounded-md text-sm" placeholder="Voeg commentaar toe..." aria-label="Commentaar"></textarea>
      <label class="flex items-center space-x-2 cursor-pointer text-sm text-gray-600">
        <input type="checkbox" id="comment-rollover-${q.id}" class="form-checkbox h-4 w-4 text-blue-600 rounded">
        <span>Commentaar overnemen naar volgend jaar</span>
      </label>`;
    contentWrapper.appendChild(commentContainer);

    const uploadContainer = document.createElement('div');
    uploadContainer.className = 'mt-3 flex items-center gap-x-2';
    uploadContainer.innerHTML = `
      <input type="file" id="file-${q.id}" class="text-sm text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" aria-label="Upload bestand"/>
      <button class="upload-btn text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded-md">Upload</button>
      <span id="upload-status-${q.id}" class="text-xs text-green-600"></span>`;
    uploadContainer
      .querySelector('.upload-btn')
      .addEventListener('click', () => handleFileUpload(q.id));
    contentWrapper.appendChild(uploadContainer);
    questionWrapper.appendChild(contentWrapper);

    if (hasChildren) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'sub-question';
      renderQuestions(q.children, childrenContainer, type);
      questionWrapper.appendChild(childrenContainer);
    }
    return questionWrapper;
  }

  function handleAnswerChange(element, question, answer) {
    const condition = question.condition;
    if (!condition) return;
    const shouldTrigger = condition.on === answer;
    if (condition.action === 'hide_children') {
      shouldTrigger
        ? element.removeAttribute('open')
        : element.setAttribute('open', '');
    } else if (condition.action === 'skip') {
      const allQuestions = document.querySelectorAll('.question-container');
      const startSkipId = parseInt(question.id, 10) + 1;
      const endSkipId = parseInt(condition.target, 10);
      allQuestions.forEach((el) => {
        const currentId = parseInt(el.dataset.questionId, 10);
        if (currentId >= startSkipId && currentId < endSkipId)
          el.classList.toggle('hidden', shouldTrigger);
      });
    }
  }

  function handleFileUpload(questionId) {
    const apiKey = document.getElementById('api-key-input').value;
    if (!apiKey) {
      showToast('Fout: AuditCase X-API-KEY ontbreekt.');
      console.error(
        'MOCK API CALL FAILED: Status 400 (Bad Request) - X-API-KEY header is missing.',
      );
      return;
    }
    const fileInput = document.getElementById(`file-${questionId}`);
    const statusEl = document.getElementById(`upload-status-${questionId}`);
    if (fileInput.files.length > 0) {
      statusEl.textContent = 'Uploading...';
      setTimeout(() => {
        statusEl.textContent = `✔ ${fileInput.files[0].name} uploaded.`;
        showToast(
          `Bestand ${fileInput.files[0].name} verzonden naar AuditCase.`,
        );
        console.log(
          `MOCK API CALL: POST /ac/api/document/dossier/create/... with X-API-KEY: ${apiKey.substring(0, 8)}...`,
        );
        console.log('MOCK API RESPONSE: Status 201 (Created)');
      }, 1000);
    } else {
      showToast('Selecteer eerst een bestand.');
    }
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  // --- Initialize the App ---
  init();
});
