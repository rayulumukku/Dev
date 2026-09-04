import { OverlayError, ErrorCategory } from './types.js';
import { parseStackTrace } from './StackTrace.js';
import { getSuggestedFixes } from './Diagnostics.js';
import { generateCodeFrame } from './CodeFrame.js';

export function parseOverlayError(rawError: any, category: ErrorCategory = 'runtime'): OverlayError {
  const message = rawError?.message || String(rawError);
  const title = rawError?.name || `${category.toUpperCase()} Error`;
  const stackFrames = parseStackTrace(rawError?.stack);

  const fileName = rawError?.fileName || (stackFrames[0]?.fileName);
  const lineNumber = rawError?.lineNumber || (stackFrames[0]?.lineNumber);
  const columnNumber = rawError?.columnNumber || (stackFrames[0]?.columnNumber);

  let codeFrame;
  if (rawError?.sourceCode && lineNumber) {
    codeFrame = generateCodeFrame(rawError.sourceCode, lineNumber, columnNumber);
  }

  const diagnostics = getSuggestedFixes(message);

  return {
    id: `${category}-${fileName || 'unknown'}-${lineNumber || 0}-${message}`,
    category,
    title,
    message,
    fileName,
    lineNumber,
    columnNumber,
    stackFrames,
    codeFrame,
    diagnostics,
    timestamp: Date.now(),
  };
}
