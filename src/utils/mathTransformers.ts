import { TextMatchTransformer } from '@lexical/markdown';
import { $createMathNode, MathNode } from '../components/editor/nodes/MathNode';
import { $createTextNode } from 'lexical';

export const MATH_TRANSFORMERS: Array<TextMatchTransformer> = [
  // Display math (must come first to match $$ before $)
  {
    dependencies: [],
    export: (node) => {
      if (node.getType() === 'math' && (node as MathNode).__isDisplay) {
        return `$$${(node as MathNode).__latex}$$`;
      }
      return null;
    },
    importRegExp: /\$\$([^$]+)\$\$/,
    regExp: /\$\$([^$]+)\$\$/,
    replace: (textNode, match) => {
      const [, latex] = match;
      const mathNode = $createMathNode(latex, true); // true for display math
      textNode.replace(mathNode);
    },
    trigger: '$',
    type: 'text-match'
  },
  // Inline math
  {
    dependencies: [],
    export: (node) => {
      if (node.getType() === 'math' && !(node as MathNode).__isDisplay) {
        return `$${(node as MathNode).__latex}$`;
      }
      return null;
    },
    importRegExp: /\$([^$]+)\$/,
    regExp: /\$([^$]+)\$/,
    replace: (textNode, match) => {
      const [, latex] = match;
      const mathNode = $createMathNode(latex, false); // false for inline math
      textNode.replace(mathNode);
    },
    trigger: '$',
    type: 'text-match'
  }
]; 