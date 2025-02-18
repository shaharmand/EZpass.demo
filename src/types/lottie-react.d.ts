declare module 'lottie-react' {
  import { CSSProperties, FC } from 'react';

  interface LottieProps {
    animationData: any;
    loop?: boolean;
    autoplay?: boolean;
    style?: CSSProperties;
  }

  const Lottie: FC<LottieProps>;
  export default Lottie;
} 