import {
  parseMarkdownToList,
  parseMarkdownFromTable,
} from '../js/markdown-parser.js';

describe('parseMarkdownToList', () => {
  test('parses headings and nested questions', () => {
    const md = '## Heading\n1. Main?\n   a. Sub?\n   - Detail';
    const result = parseMarkdownToList(md);
    expect(result[0]).toEqual({ isHeading: true, text: 'Heading' });
    const main = result[1];
    expect(main.id).toBe('1');
    expect(main.children[0].id).toBe('1a');
    expect(main.children[0].children[0].id).toBe('1a-1');
  });
});

describe('parseMarkdownFromTable', () => {
  test('parses table rows into questions', () => {
    const md = '## Heading\n| 1 | Question one |\n| 2 | Question two |';
    const result = parseMarkdownFromTable(md);
    expect(result[0]).toEqual({ isHeading: true, text: 'Heading' });
    expect(result[1].id).toBe('1');
    expect(result[2].text).toBe('Question two');
  });
});
