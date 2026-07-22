export function createHMRBoundary(file, parents = []) {
  return {
    file,
    isSelfAccepting: true,
    parents,
  };
}
