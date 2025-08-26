// Placeholder for future AuditCase API bridge
// In the future, replace the fetch URL with the real AuditCase endpoint

let selectedClient = '';

document.getElementById('client-select').addEventListener('change', (e) => {
  selectedClient = e.target.value;
  const disabled = selectedClient === '';
  document.getElementById('load-ib').disabled = disabled;
  document.getElementById('load-vpb').disabled = disabled;
});

async function loadWorkProgram(type) {
  const path = type === 'ib'
    ? 'werkprogramma_inkomstenbelasting.md'
    : 'werkprogramma_vennootschapsbelasting.md';
  try {
    const response = await fetch(path);
    const markdown = await response.text();
    const questions = parseWorkProgram(markdown, type);
    renderQuestions(questions, type);
  } catch (err) {
    document.getElementById('work-area').textContent = 'Error loading work program';
  }
}

function parseWorkProgram(markdown, type) {
  const lines = markdown.split('\n');
  const questions = [];
  if (type === 'ib') {
    for (const line of lines) {
      const match = line.match(/^(\d+)\.\s*(.*)/);
      if (match) {
        questions.push({ number: match[1], question: match[2].trim() });
      }
    }
  } else {
    for (const line of lines) {
      const match = line.match(/^\|(\d+)\|([^|]+)\|/);
      if (match) {
        questions.push({ number: match[1], question: match[2].trim() });
      }
    }
  }
  return questions;
}

function renderQuestions(questions, type) {
  const workArea = document.getElementById('work-area');
  workArea.innerHTML = '';
  questions.forEach(q => {
    const div = document.createElement('div');
    div.className = 'question';

    const qText = document.createElement('p');
    qText.textContent = `${q.number}. ${q.question}`;
    div.appendChild(qText);

    const yesLabel = document.createElement('label');
    const yesRadio = document.createElement('input');
    yesRadio.type = 'radio';
    yesRadio.name = `answer-${q.number}`;
    yesRadio.value = 'yes';
    yesLabel.appendChild(yesRadio);
    yesLabel.appendChild(document.createTextNode('Ja'));

    const noLabel = document.createElement('label');
    const noRadio = document.createElement('input');
    noRadio.type = 'radio';
    noRadio.name = `answer-${q.number}`;
    noRadio.value = 'no';
    noLabel.appendChild(noRadio);
    noLabel.appendChild(document.createTextNode('Nee'));

    div.appendChild(yesLabel);
    div.appendChild(noLabel);

    const comment = document.createElement('textarea');
    comment.id = `comment-${q.number}`;
    comment.placeholder = 'Commentaar';
    div.appendChild(comment);

    const commentRollLabel = document.createElement('label');
    const commentRoll = document.createElement('input');
    commentRoll.type = 'checkbox';
    commentRoll.id = `comment-rollover-${q.number}`;
    commentRollLabel.appendChild(commentRoll);
    commentRollLabel.appendChild(document.createTextNode('Commentaar overnemen naar volgend jaar'));
    div.appendChild(commentRollLabel);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = `file-${q.number}`;
    div.appendChild(fileInput);

    const fileRollLabel = document.createElement('label');
    const fileRoll = document.createElement('input');
    fileRoll.type = 'checkbox';
    fileRoll.id = `file-rollover-${q.number}`;
    fileRollLabel.appendChild(fileRoll);
    fileRollLabel.appendChild(document.createTextNode('Bestand overnemen naar volgend jaar'));
    div.appendChild(fileRollLabel);

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Opslaan';
    saveBtn.addEventListener('click', () => saveQuestionData(q.number, type));
    div.appendChild(saveBtn);

    workArea.appendChild(div);

    loadQuestionData(q.number, type);
  });
}

function saveQuestionData(num, type) {
  if (!selectedClient) return;
  const answer = document.querySelector(`input[name="answer-${num}"]:checked`)?.value || '';
  const comment = document.getElementById(`comment-${num}`).value;
  const commentRoll = document.getElementById(`comment-rollover-${num}`).checked;
  const fileInput = document.getElementById(`file-${num}`);
  const fileName = fileInput.files[0] ? fileInput.files[0].name : '';
  const fileRoll = document.getElementById(`file-rollover-${num}`).checked;
  const data = { answer, comment, commentRoll, fileName, fileRoll };
  const key = `${selectedClient}-${type}-${num}`;
  localStorage.setItem(key, JSON.stringify(data));
}

function loadQuestionData(num, type) {
  if (!selectedClient) return;
  const key = `${selectedClient}-${type}-${num}`;
  const saved = localStorage.getItem(key);
  if (!saved) return;
  const data = JSON.parse(saved);
  if (data.answer) {
    const radio = document.querySelector(`input[name="answer-${num}"][value="${data.answer}"]`);
    if (radio) radio.checked = true;
  }
  document.getElementById(`comment-${num}`).value = data.comment || '';
  document.getElementById(`comment-rollover-${num}`).checked = data.commentRoll || false;
  document.getElementById(`file-rollover-${num}`).checked = data.fileRoll || false;
  if (data.fileName) {
    const info = document.createElement('div');
    info.textContent = `Opgeslagen bestand: ${data.fileName}`;
    const fileEl = document.getElementById(`file-${num}`);
    fileEl.parentNode.insertBefore(info, fileEl.nextSibling);
  }
}

document.getElementById('load-ib').addEventListener('click', () => loadWorkProgram('ib'));
document.getElementById('load-vpb').addEventListener('click', () => loadWorkProgram('vpb'));
