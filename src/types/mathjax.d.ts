declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements: HTMLElement[]) => Promise<void>;
      tex?: {
        inlineMath: string[][];
        displayMath: string[][];
        processEscapes: boolean;
        processEnvironments: boolean;
        packages?: string[];
      };
      options?: {
        skipHtmlTags: string[];
        ignoreHtmlClass?: string;
      };
      startup?: {
        typeset: boolean;
      };
    };
  }
}

export {}; 