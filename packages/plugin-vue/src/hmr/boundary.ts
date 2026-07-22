export interface HMRBoundary {
  file: string;
  isSelfAccepting: boolean;
  parents: string[];
}

export function createHMRBoundary(file: string, parents: string[] = []): HMRBoundary {
  return {
    file,
    isSelfAccepting: true,
    parents,
  };
}
