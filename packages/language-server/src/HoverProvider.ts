import { Hover, Position } from './types.js';
import { ConfigProvider } from './ConfigProvider.js';

export class HoverProvider {
  private configProvider = new ConfigProvider();

  getHover(uri: string, position: Position, content: string): Hover | null {
    const lines = content.split('\n');
    const lineText = lines[position.line] || '';

    const options = this.configProvider.getConfigOptions();
    for (const opt of options) {
      if (lineText.includes(opt.name)) {
        return {
          contents: `### Ray Config: \`${opt.name}\`\n\n**Type**: \`${opt.type}\`\n${opt.default ? `**Default**: \`${opt.default}\`\n` : ''}\n${opt.description}`,
        };
      }
    }

    if (lineText.includes('plugins')) {
      return {
        contents: '### Ray Plugins\n\nArray of Ray plugins extending build, resolve, transform, and HMR lifecycles.',
      };
    }

    return null;
  }
}
