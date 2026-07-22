export class ModuleMapper {
  static formatModuleId(filePath: string): string {
    return filePath.replace(/\\/g, '/');
  }
}
