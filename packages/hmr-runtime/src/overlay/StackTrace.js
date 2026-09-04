export function parseStackTrace(stackStr) {
  if (!stackStr) return [];

  const frames = [];
  const lines = stackStr.split('\n');

  for (const line of lines) {
    const v8Match = line.match(/at\s+(?:(.*?)\s+\()?(.+?):(\d+):(\d+)\)?/);
    if (v8Match) {
      frames.push({
        functionName: v8Match[1] || 'anonymous',
        fileName: v8Match[2],
        lineNumber: parseInt(v8Match[3], 10),
        columnNumber: parseInt(v8Match[4], 10),
      });
    } else {
      const ffMatch = line.match(/^\s*(?:(.*?)\s*@\s*)?(.+?):(\d+):(\d+)\s*$/);
      if (ffMatch && ffMatch[2]) {
        frames.push({
          functionName: ffMatch[1] || 'anonymous',
          fileName: ffMatch[2],
          lineNumber: parseInt(ffMatch[3], 10),
          columnNumber: parseInt(ffMatch[4], 10),
        });
      }
    }
  }

  return frames;
}
