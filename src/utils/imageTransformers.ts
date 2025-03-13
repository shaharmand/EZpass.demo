import { TextMatchTransformer } from '@lexical/markdown';
import { $createImageNode, ImageNode } from '../components/editor/nodes/ImageNode';

export const IMAGE_TRANSFORMERS: Array<TextMatchTransformer> = [
  {
    dependencies: [],
    export: (node) => {
      if (node instanceof ImageNode) {
        const altText = node.__altText || '';
        const src = node.__src || '';
        const width = node.__width || 100;
        const alignment = node.__alignment || 'center';
        return `![${altText}](${src}){width=${width} align=${alignment}}`;
      }
      return null;
    },
    importRegExp: /!\[(.*?)\]\((.*?)\)(?:{width=(\d+)\s+align=(left|center|right)})?/,
    regExp: /!\[(.*?)\]\((.*?)\)(?:{width=(\d+)\s+align=(left|center|right)})?/,
    replace: (textNode, match) => {
      const [, altText, src, width, alignment] = match;
      const imageNode = $createImageNode(
        src,
        altText,
        width ? parseInt(width) : 100,
        (alignment as 'left' | 'center' | 'right') || 'center'
      );
      textNode.replace(imageNode);
    },
    trigger: '!',
    type: 'text-match'
  }
]; 