import MarkdownIt from 'markdown-it';
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';
import { $createListNode, $createListItemNode } from '@lexical/list';
import type { EditorState, LexicalNode } from 'lexical';

interface EditorNode {
  children: EditorNode[];
  direction: string;
  format: string;
  indent: number;
  type: string;
  version: number;
  [key: string]: any; // For additional properties
}

interface LexicalEditorState {
  root: EditorNode;
}

export function markdownToLexical(markdown: string): string {
  try {
    const editorState: LexicalEditorState = {
      root: {
        children: [],
        direction: 'rtl',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      }
    };

    let currentList: EditorNode | null = null;
    let currentAlignment = '';

    const md = new MarkdownIt();
    const tokens = md.parse(markdown, {});
    
    for (const token of tokens) {
      if (token.type === 'html_block' || token.type === 'html_inline') {
        // Check for alignment divs
        const alignMatch = token.content.match(/<div style="text-align:\s*(left|center|right)">/i);
        if (alignMatch) {
          currentAlignment = alignMatch[1];
        } else if (token.content.includes('</div>')) {
          currentAlignment = '';
        }
      }
      else if (token.type === 'paragraph_open') {
        const paragraph: EditorNode = {
          children: [],
          direction: 'rtl',
          format: currentAlignment || '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        };
        editorState.root.children.push(paragraph);
      }
      else if (token.type === 'inline' && token.content) {
        const lastChild = editorState.root.children[editorState.root.children.length - 1];
        if (lastChild) {
          // Process content for math formulas and images
          const parts = token.content.split(/(\$\$[^\$]+\$\$|\$[^\$]+\$|\!\[.*?\]\(.*?\))/g);
          for (const part of parts) {
            if (part.startsWith('$$') && part.endsWith('$$')) {
              // Display math formula
              const latex = part.slice(2, -2);
              const mathNode: EditorNode = {
                type: 'math',
                direction: 'ltr',
                format: '',
                indent: 0,
                __latex: latex,
                __isDisplay: true,
                version: 1,
                children: []
              };
              lastChild.children.push(mathNode);
            }
            else if (part.startsWith('$') && part.endsWith('$')) {
              // Inline math formula
              const latex = part.slice(1, -1);
              const mathNode: EditorNode = {
                type: 'math',
                direction: 'ltr',
                format: '',
                indent: 0,
                __latex: latex,
                __isDisplay: false,
                version: 1,
                children: []
              };
              lastChild.children.push(mathNode);
            }
            else if (part.startsWith('![') && part.includes('](')) {
              // Image
              const altMatch = part.match(/\!\[(.*?)\]/);
              const srcMatch = part.match(/\((.*?)\)/);
              if (srcMatch) {
                const imageNode: EditorNode = {
                  type: 'image',
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  src: srcMatch[1],
                  altText: altMatch ? altMatch[1] : '',
                  width: null,
                  height: null,
                  maxWidth: 800,
                  showCaption: false,
                  caption: altMatch ? altMatch[1] : '',
                  version: 1,
                  children: []
                };
                lastChild.children.push(imageNode);
              }
            }
            else if (part) {
              // Regular text
              const textNode: EditorNode = {
                type: 'text',
                direction: 'rtl',
                format: '',
                indent: 0,
                detail: 0,
                mode: 'normal',
                style: '',
                text: part,
                version: 1,
                children: []
              };
              lastChild.children.push(textNode);
            }
          }
        }
      }
      else if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') {
        currentList = {
          children: [],
          direction: 'rtl',
          format: '',
          indent: 0,
          type: token.type === 'bullet_list_open' ? 'bullet' : 'number',
          version: 1,
          start: token.type === 'ordered_list_open' ? 1 : undefined,
        };
      }
      else if (token.type === 'bullet_list_close' || token.type === 'ordered_list_close') {
        if (currentList) {
          editorState.root.children.push(currentList);
          currentList = null;
        }
      }
      else if (token.type === 'list_item_open') {
        if (currentList) {
          const listItem: EditorNode = {
            children: [],
            direction: 'rtl',
            format: '',
            indent: 0,
            type: 'listitem',
            value: 1,
            version: 1,
          };
          currentList.children.push(listItem);
        }
      }
      else if (token.type === 'text' && currentList) {
        const lastList = currentList.children[currentList.children.length - 1];
        if (lastList) {
          // Process content for math formulas and images in list items
          const parts = token.content.split(/(\$\$[^\$]+\$\$|\$[^\$]+\$|\!\[.*?\]\(.*?\))/g);
          for (const part of parts) {
            if (part.startsWith('$$') && part.endsWith('$$')) {
              // Display math formula
              const latex = part.slice(2, -2);
              const mathNode: EditorNode = {
                type: 'math',
                direction: 'ltr',
                format: '',
                indent: 0,
                __latex: latex,
                __isDisplay: true,
                version: 1,
                children: []
              };
              lastList.children.push(mathNode);
            }
            else if (part.startsWith('$') && part.endsWith('$')) {
              // Inline math formula
              const latex = part.slice(1, -1);
              const mathNode: EditorNode = {
                type: 'math',
                direction: 'ltr',
                format: '',
                indent: 0,
                __latex: latex,
                __isDisplay: false,
                version: 1,
                children: []
              };
              lastList.children.push(mathNode);
            }
            else if (part.startsWith('![') && part.includes('](')) {
              // Image
              const altMatch = part.match(/\!\[(.*?)\]/);
              const srcMatch = part.match(/\((.*?)\)/);
              if (srcMatch) {
                const imageNode: EditorNode = {
                  type: 'image',
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  src: srcMatch[1],
                  altText: altMatch ? altMatch[1] : '',
                  width: null,
                  height: null,
                  maxWidth: 800,
                  showCaption: false,
                  caption: altMatch ? altMatch[1] : '',
                  version: 1,
                  children: []
                };
                lastList.children.push(imageNode);
              }
            }
            else if (part) {
              // Regular text
              const textNode: EditorNode = {
                type: 'text',
                direction: 'rtl',
                format: '',
                indent: 0,
                detail: 0,
                mode: 'normal',
                style: '',
                text: part,
                version: 1,
                children: []
              };
              lastList.children.push(textNode);
            }
          }
        }
      }
    }

    return JSON.stringify(editorState);
  } catch (error) {
    console.error('Error converting markdown to Lexical:', error);
    return '';
  }
}

export function lexicalToMarkdown(editorState: string): string {
  try {
    const state = JSON.parse(editorState);
    let markdown = '';

    const processNode = (node: any): string => {
      if (!node) return '';

      switch (node.type) {
        case 'text':
          return node.text;
        case 'paragraph':
          const content = node.children.map(processNode).join('');
          // Add alignment if specified
          if (node.format === 'left') {
            return `<div style="text-align: left">\n\n${content}\n\n</div>\n\n`;
          } else if (node.format === 'center') {
            return `<div style="text-align: center">\n\n${content}\n\n</div>\n\n`;
          } else if (node.format === 'right') {
            return `<div style="text-align: right">\n\n${content}\n\n</div>\n\n`;
          }
          return content + '\n\n';
        case 'bullet':
        case 'number':
          return node.children.map((item: any) => {
            const content = item.children.map(processNode).join('');
            return `${node.type === 'bullet' ? '* ' : '1. '}${content}\n`;
          }).join('');
        case 'listitem':
          return node.children.map(processNode).join('');
        case 'math':
          // Use double dollar signs for display math
          return node.__isDisplay ? `$$${node.__latex}$$` : `$${node.__latex}$`;
        case 'image':
          const alt = node.altText || node.caption || '';
          return `![${alt}](${node.src})`;
        default:
          return node.children ? node.children.map(processNode).join('') : '';
      }
    };

    markdown = processNode(state.root);
    return markdown.trim();
  } catch (error) {
    console.error('Error converting Lexical to markdown:', error);
    return '';
  }
} 