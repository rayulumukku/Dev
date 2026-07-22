export function getSuggestedFixes(errorMessage) {
  const hints = [];

  if (errorMessage.includes('Cannot find module') || errorMessage.includes('Failed to resolve import')) {
    hints.push({
      message: 'Unresolved import detected.',
      suggestion: 'Verify the file path exists or install the missing package via package manager.',
    });
  } else if (errorMessage.includes('Unexpected token') || errorMessage.includes('JSX')) {
    hints.push({
      message: 'Syntax or JSX compilation error.',
      suggestion: 'Ensure proper syntax and that the file extension is .tsx or .jsx.',
    });
  } else if (errorMessage.includes('export')) {
    hints.push({
      message: 'Export mismatch.',
      suggestion: 'Check named vs default export signatures in the target module.',
    });
  }

  return hints;
}
