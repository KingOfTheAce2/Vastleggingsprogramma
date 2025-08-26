// Placeholder for future AuditCase API bridge
// In the future, replace the fetch URL with the real AuditCase endpoint

async function fetchAuditCase() {
  try {
    // Simulated data until AuditCase API is available
    const data = { message: 'Sample data from AuditCase placeholder' };
    document.getElementById('output').textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById('output').textContent = 'Error loading data';
  }
}

async function loadWorkProgram(type) {
  const path = type === 'ib'
    ? 'werkprogramma_inkomstenbelasting.md'
    : 'werkprogramma_vennootschapsbelasting.md';
  try {
    const response = await fetch(path);
    const markdown = await response.text();
    const questions = parseWorkProgram(markdown, type);
    document.getElementById('output').textContent = JSON.stringify(questions, null, 2);
  } catch (err) {
    document.getElementById('output').textContent = 'Error loading work program';
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

document.getElementById('load-ib').addEventListener('click', () => loadWorkProgram('ib'));
document.getElementById('load-vpb').addEventListener('click', () => loadWorkProgram('vpb'));
