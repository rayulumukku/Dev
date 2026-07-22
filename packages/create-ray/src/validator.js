import fs from 'fs';

export function validateProjectName(name) {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'Project name cannot be empty.' };
  }
  if (!/^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name)) {
    return { valid: false, error: `Invalid project name "${name}". Must be lowercase npm package name.` };
  }
  return { valid: true };
}

export function validateTargetDirectory(targetDir, overwrite = false) {
  if (fs.existsSync(targetDir)) {
    const files = fs.readdirSync(targetDir);
    if (files.length > 0 && !overwrite) {
      return { valid: false, error: `Target directory "${targetDir}" is not empty. Use overwrite flag or select empty directory.` };
    }
  }
  return { valid: true };
}
