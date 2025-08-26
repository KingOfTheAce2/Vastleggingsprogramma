export function parseMarkdownToList(markdown) {
  const lines = markdown.split('\n');
  const questions = [];
  const stack = [{ children: questions, level: -1 }];
  const headingRegex = /^##\s+(.*)/;
  const mainQRegex = /^(\d+)\.\s*(.*)/;
  const subQRegex = /^\s+([a-zA-Z])\.\s*(.*)/;
  const detailQRegex = /^\s+-\s*(.*)/;

  lines.forEach((line) => {
    let match;
    if ((match = line.match(headingRegex))) {
      questions.push({ isHeading: true, text: match[1].trim() });
      stack.length = 1;
    } else if ((match = line.match(mainQRegex))) {
      let text = match[2].trim();
      const condition = parseCondition(text);
      if (condition) text = text.replace(/Zo nee,.*|Zo ja,.*/i, '').trim();
      const question = {
        id: match[1],
        text,
        children: [],
        condition,
        level: 0,
      };
      questions.push(question);
      stack.length = 1;
      stack.push(question);
    } else if ((match = line.match(subQRegex))) {
      while (stack.length > 2 && stack[stack.length - 1].level >= 1) {
        stack.pop();
      }
      const parent = stack[stack.length - 1];
      const id = `${parent.id}${match[1]}`;
      const question = {
        id,
        text: match[2].trim(),
        children: [],
        level: parent.level + 1,
      };
      parent.children.push(question);
      stack.push(question);
    } else if ((match = line.match(detailQRegex))) {
      const parent = stack[stack.length - 1];
      const id = `${parent.id}-${parent.children.length + 1}`;
      parent.children.push({
        id,
        text: match[1].trim(),
        level: parent.level + 1,
        isDetail: true,
      });
    }
  });
  return questions;
}

export function parseMarkdownFromTable(markdown) {
  const lines = markdown.split('\n');
  const questions = [];
  const vpbQRegex = /^\|\s*(\d+)\s*\|([^|]+)\|/;
  const headingRegex = /^##\s+(.*)/;
  lines.forEach((line) => {
    let match;
    if ((match = line.match(headingRegex))) {
      questions.push({ isHeading: true, text: match[1].trim() });
    } else if ((match = line.match(vpbQRegex))) {
      questions.push({
        id: match[1].trim(),
        text: match[2].trim().replace(/<br>/g, ' '),
        children: [],
        level: 0,
      });
    }
  });
  return questions;
}

function parseCondition(text) {
  const skipMatch = text.match(
    /Zo (nee|ja)[\s,:]*(?:ga naar vraag|ga naar)\s*(\d+)/i,
  );
  if (skipMatch)
    return {
      on: skipMatch[1].toLowerCase(),
      action: 'skip',
      target: skipMatch[2],
    };
  if (/Zo nee, ga naar vraag \d+/.test(text))
    return { on: 'no', action: 'hide_children' };
  return null;
}
