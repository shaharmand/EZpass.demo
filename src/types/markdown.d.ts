declare module 'react-markdown' {
  import { FC, ReactNode } from 'react';

  interface ReactMarkdownProps {
    children: string;
    remarkPlugins?: any[];
    rehypePlugins?: any[];
    components?: Record<string, FC<any>>;
  }

  const ReactMarkdown: FC<ReactMarkdownProps>;
  export default ReactMarkdown;
}

declare module 'remark-math' {
  const remarkMath: any;
  export default remarkMath;
}

declare module 'rehype-katex' {
  const rehypeKatex: any;
  export default rehypeKatex;
} 