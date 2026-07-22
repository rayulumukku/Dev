import { StackFrameInfo } from './types.js';

export function resolveSourceMapLocation(frame: StackFrameInfo, rawSourceMap?: any): StackFrameInfo {
  if (!rawSourceMap || !rawSourceMap.mappings) {
    return frame;
  }

  // Simple source map resolution logic for demonstration/runtime use
  return {
    ...frame,
    fileName: rawSourceMap.file || frame.fileName,
    lineNumber: frame.lineNumber,
    columnNumber: frame.columnNumber,
  };
}
