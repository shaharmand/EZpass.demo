import type MarkdownIt from 'markdown-it';
import markdownit from 'markdown-it';
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';
import { $createListNode, $createListItemNode } from '@lexical/list';
import type { EditorState, LexicalNode } from 'lexical';

const md = new markdownit();

interface LexicalEditorState {
  root: {
    children: Array<any>;
    direction: string;
    format: string;
    indent: number;
    type: string;
    version: number;
  }
}

export function markdownToLexical(markdown: string): string {
  try {
    // Parse markdown to tokens
    const tokens = md.parse(markdown, {});
    
    // Create editor state
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

    let currentList: any = null;
    
    // Convert tokens to Lexical nodes
    for (const token of tokens) {
      if (token.type === 'paragraph_open') {
        const paragraph = {
          children: [],
          direction: 'rtl',
          format: '',
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
          const parts = token.content.split(/(\$[^\$]+\$|\!\[.*?\]\(.*?\))/g);
          for (const part of parts) {
            if (part.startsWith('$') && part.endsWith('$')) {
              // Math formula
              const latex = part.slice(1, -1);
              const mathNode = {
                type: 'math',
                __latex: latex,
                version: 1
              };
              lastChild.children.push(mathNode);
            } 
            else if (part.startsWith('![') && part.includes('](')) {
              // Image
              const altMatch = part.match(/\!\[(.*?)\]/);
              const srcMatch = part.match(/\((.*?)\)/);
              if (srcMatch) {
                const imageNode = {
                  type: 'image',
                  src: srcMatch[1],
                  altText: altMatch ? altMatch[1] : '',
                  width: null,
                  height: null,
                  maxWidth: 800,
                  showCaption: false,
                  caption: altMatch ? altMatch[1] : '',
                  version: 1
                };
                lastChild.children.push(imageNode);
              }
            }
            else if (part) {
              // Regular text
              const textNode = {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: part,
                type: 'text',
                version: 1,
              };
              lastChild.children.push(textNode);
            }
          }
        }
      }
      else if (token.type === 'image') {
        const lastChild = editorState.root.children[editorState.root.children.length - 1];
        if (lastChild) {
          const imageNode = {
            type: 'image',
            src: token.attrs[0][1], // src is usually the first attribute
            altText: token.attrs[1] ? token.attrs[1][1] : '',
            width: null,
            height: null,
            maxWidth: 800,
            showCaption: false,
            caption: token.attrs[1] ? token.attrs[1][1] : '',
            version: 1
          };
          lastChild.children.push(imageNode);
        }
      }
      // Add support for lists
      else if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') {
        currentList = {
          children: [],
          direction: 'rtl',
          format: '',
          indent: 0,
          type: token.type === 'bullet_list_open' ? 'bullet' : 'number',
          listType: token.type === 'bullet_list_open' ? 'bullet' : 'number',
          start: 1,
          tag: token.type === 'bullet_list_open' ? 'ul' : 'ol',
          version: 1,
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
          const listItem = {
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
          const parts = token.content.split(/(\$[^\$]+\$|\!\[.*?\]\(.*?\))/g);
          for (const part of parts) {
            if (part.startsWith('$') && part.endsWith('$')) {
              // Math formula
              const latex = part.slice(1, -1);
              const mathNode = {
                type: 'math',
                __latex: latex,
                version: 1
              };
              lastList.children.push(mathNode);
            }
            else if (part.startsWith('![') && part.includes('](')) {
              // Image
              const altMatch = part.match(/\!\[(.*?)\]/);
              const srcMatch = part.match(/\((.*?)\)/);
              if (srcMatch) {
                const imageNode = {
                  type: 'image',
                  src: srcMatch[1],
                  altText: altMatch ? altMatch[1] : '',
                  width: null,
                  height: null,
                  maxWidth: 800,
                  showCaption: false,
                  caption: altMatch ? altMatch[1] : '',
                  version: 1
                };
                lastList.children.push(imageNode);
              }
            }
            else if (part) {
              // Regular text
              const textNode = {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: part,
                type: 'text',
                version: 1,
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
    // Return a valid empty editor state
    return JSON.stringify({
      root: {
        children: [{
          children: [{
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: '',
            type: 'text',
            version: 1,
          }],
          direction: 'rtl',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        }],
        direction: 'rtl',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      }
    });
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
          return node.children.map(processNode).join('') + '\n\n';
        case 'bullet':
        case 'number':
          return node.children.map((item: any) => {
            const content = item.children.map(processNode).join('');
            return `${node.type === 'bullet' ? '* ' : '1. '}${content}\n`;
          }).join('');
        case 'listitem':
          return node.children.map(processNode).join('');
        case 'math':
          // Add inline math formula with $ delimiters
          return `$${node.__latex}$`;
        case 'image':
          // Convert image to markdown format
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