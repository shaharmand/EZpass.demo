import { TextMatchTransformer } from '@lexical/markdown';
import { $createMathNode, MathNode } from '../components/editor/nodes/MathNode';
import { $createTextNode } from 'lexical';

export const MATH_TRANSFORMERS: Array<TextMatchTransformer> = [
  {
    dependencies: [],
    export: (node) => {
      if (node.getType() === 'math') {
        return `$${(node as MathNode).__latex}$`;
      }
      return null;
    },
    importRegExp: /\$([^$]+)\$/,
    regExp: /\$([^$]+)\$/,
    replace: (textNode, match) => {
      const [, latex] = match;
      const mathNode = $createMathNode(latex);
      textNode.replace(mathNode);
    },
    trigger: '$',
    type: 'text-match'
  }
]; 