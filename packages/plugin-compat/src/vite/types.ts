export interface CompatiblePlugin {
  name: string;
  enforce?: 'pre' | 'post';
  resolveId?(this: any, id: string, importer?: string, options?: any): Promise<any> | any;
  load?(this: any, id: string, options?: any): Promise<any> | any;
  transform?(this: any, code: string, id: string, options?: any): Promise<any> | any;
  handleHotUpdate?(this: any, ctx: any): Promise<any> | any;
}
