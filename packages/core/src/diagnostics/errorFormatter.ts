import path from 'path';

export interface FormattedError {
  message: string;
  frame: string;
  suggestion: string;
}

/**
 * Beautifully formats code syntax/parse errors with colored frames and corrections.
 */
export function formatCodeError(params: {
  message: string;
  code: string;
  filePath: string;
  line: number;
  column: number;
}): FormattedError {
  const { message, code, filePath, line, column } = params;
  const lines = code.split('\n');
  const errorLineIdx = line - 1;

  // Frame extraction (up to 2 lines context)
  const startIdx = Math.max(0, errorLineIdx - 2);
  const endIdx = Math.min(lines.length - 1, errorLineIdx + 2);

  let frame = `\n  Error in ${path.basename(filePath)}:${line}:${column}\n\n`;
  for (let i = startIdx; i <= endIdx; i++) {
    const isErrorLine = i === errorLineIdx;
    const prefix = isErrorLine ? ' > ' : '   ';
    const lineNum = (i + 1).toString().padStart(4, ' ');
    frame += `\x1b[90m${lineNum} | ${prefix}\x1b[0m${lines[i]}\n`;
    if (isErrorLine) {
      const caretIndent = ' '.repeat(5 + column + prefix.length);
      frame += `${caretIndent}\x1b[31m^\x1b[0m\n`;
    }
  }

  // Smart suggestions
  let suggestion = 'Check syntax and verify all brackets/tags are closed.';
  const lowerMsg = message.toLowerCase();
  const lowerCode = code.toLowerCase();

  if (lowerMsg.includes('mismatched') || lowerMsg.includes('expected tag')) {
    suggestion = 'Ensure all JSX opening tags are paired with a valid closing tag (e.g. <div> -> </div>).';
  } else if (lowerMsg.includes('unexpected token') || lowerMsg.includes('failed to parse')) {
    if (lowerCode.includes('import ') && !lowerCode.includes('from')) {
      suggestion = 'Verify import syntax: "import Name from \'module\'".';
    } else if (lowerCode.includes('const ') && !lowerCode.includes('=')) {
      suggestion = 'Constant declarations must be initialized with an assignment: "const x = val;".';
    }
  } else if (lowerMsg.includes('cannot find module') || lowerMsg.includes('failed to resolve')) {
    suggestion = 'Run "npm install" to ensure all workspace dependencies are locally installed.';
  }

  return {
    message,
    frame,
    suggestion: `\x1b[36m💡 Suggestion:\x1b[0m ${suggestion}\n`
  };
}
