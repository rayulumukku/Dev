import { OverlayError, ErrorCategory } from './types.js';
import { parseStackTrace } from './StackTrace.js';
import { getSuggestedFixes } from './Diagnostics.js';
import { generateCodeFrame } from './CodeFrame.js';

export function parseOverlayError(rawError: any, category: ErrorCategory = 'runtime'): OverlayError {
  const message = rawError.message || String(rawError);
  const title = rawError.name || `${category.toUpperCase()} Error`;
  const stackFrames = parseStackTrace(rawError.stack);

  let codeFrame;
  if (rawError.sourceCode && rawError.lineNumber) {
    codeFrame = generateCodeFrame(rawError.sourceCode, rawError.lineNumber, rawError.columnNumber);
  }

  const diagnostics = getSuggestedFixes(message);

  return {
    id: `${category}-${rawError.fileName || 'unknown'}-${rawError.lineNumber || 0}-${message}`,
    category,
    title,
    message,
    fileName: rawError.fileName,
    lineNumber: rawError.lineNumber,
    columnNumber: rawError.columnNumber,
    stackFrames,
    codeFrame,
    diagnostics,
    timestamp: Date.now(),
  };
}
