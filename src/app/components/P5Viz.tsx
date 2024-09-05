import React, { useEffect, useRef } from "react";
import p5 from "p5";

type Props = {
  sketch: (p: p5) => void;
};

const P5Viz: React.FC<Props> = ({ sketch }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const p5Instance = new p5(sketch, containerRef.current);

    return () => {
      p5Instance.remove();
    };
  }, [sketch]);

  return <div ref={containerRef}></div>;
};

export default P5Viz;