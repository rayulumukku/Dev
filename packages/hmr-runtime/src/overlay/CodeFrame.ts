import { CodeFrameSnippet } from './types.js';

export function generateCodeFrame(sourceCode: string, lineNumber: number, columnNumber?: number): CodeFrameSnippet {
  const allLines = sourceCode.split('\n');
  const targetIdx = lineNumber - 1;
  const startIdx = Math.max(0, targetIdx - 2);
  const endIdx = Math.min(allLines.length - 1, targetIdx + 2);

  const lines = [];
  for (let i = startIdx; i <= endIdx; i++) {
    lines.push({
      lineNumber: i + 1,
      content: allLines[i] || '',
      isTarget: i === targetIdx,
    });
  }

  return {
    lines,
    startLine: startIdx + 1,
    endLine: endIdx + 1,
    columnNumber,
  };
}
