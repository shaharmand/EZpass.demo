declare module 'markdown-it' {
  interface Token {
    type: string;
    tag: string;
    attrs: [string, string][];
    map: [number, number];
    nesting: number;
    level: number;
    children: Token[] | null;
    content: string;
    markup: string;
    info: string;
    meta: any;
    block: boolean;
    hidden: boolean;
  }

  interface MarkdownIt {
    new(options?: any): MarkdownIt;
    render(md: string, env?: any): string;
    parse(src: string, env?: any): Token[];
  }

  const MarkdownIt: MarkdownIt;
  export default MarkdownIt;
} 