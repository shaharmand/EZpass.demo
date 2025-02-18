// MathJax type declarations
declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements: HTMLElement[]) => Promise<void>;
      tex?: {
        inlineMath: string[][];
        displayMath: string[][];
        processEscapes: boolean;
        processEnvironments: boolean;
      };
      options?: {
        skipHtmlTags: string[];
      };
      startup?: {
        typeset: boolean;
      };
    };
  }
}

// MathJax configuration and helper functions
export const configureMathJax = async () => {
  if (window.MathJax) {
    return;
  }

  // Load MathJax script
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
  script.async = true;

  // Configure MathJax
  window.MathJax = {
    tex: {
      inlineMath: [['$', '$']],
      displayMath: [['$$', '$$']],
      processEscapes: true,
      processEnvironments: true
    },
    options: {
      skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
    },
    startup: {
      typeset: false
    }
  };

  // Wait for script to load
  await new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  // Wait for MathJax to initialize
  await new Promise((resolve) => {
    const checkMathJax = () => {
      if (window.MathJax?.typesetPromise) {
        resolve(undefined);
      } else {
        setTimeout(checkMathJax, 100);
      }
    };
    checkMathJax();
  });
}; 