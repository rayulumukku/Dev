export function resolveSourceMapLocation(frame, rawSourceMap) {
  if (!rawSourceMap || !rawSourceMap.mappings) {
    return frame;
  }

  return {
    ...frame,
    fileName: rawSourceMap.file || frame.fileName,
    lineNumber: frame.lineNumber,
    columnNumber: frame.columnNumber,
  };
}
