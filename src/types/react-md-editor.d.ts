declare module '@uiw/react-md-editor' {
  import { FC, ReactNode } from 'react';

  interface MDEditorProps {
    value?: string;
    onChange?: (value?: string) => void;
    commands?: any[];
    preview?: 'live' | 'edit' | 'preview';
    height?: number;
    textareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
    previewOptions?: {
      direction?: 'rtl' | 'ltr';
    };
    [key: string]: any;
  }

  interface CommandsType {
    bold: any;
    italic: any;
    strikethrough: any;
    hr: any;
    title: any;
    divider: any;
    link: any;
    quote: any;
    code: any;
    image: any;
    unorderedListCommand: any;
    orderedListCommand: any;
    checkedListCommand: any;
  }

  const MDEditor: FC<MDEditorProps>;
  export const commands: CommandsType;
  export default MDEditor;
} 