export function parseStackTrace(stackStr) {
  if (!stackStr) return [];

  const frames = [];
  const lines = stackStr.split('\n');

  for (const line of lines) {
    const match = line.match(/at\s+(?:(.*?)\s+\()?(.+?):(\d+):(\d+)\)?/);
    if (match) {
      frames.push({
        functionName: match[1] || 'anonymous',
        fileName: match[2],
        lineNumber: parseInt(match[3], 10),
        columnNumber: parseInt(match[4], 10),
      });
    }
  }

  return frames;
}
