import { useState, useEffect } from "react";

const SLIDE_INTERVAL_MS = 10000; // 10 seconds
const BG_IMAGES = ["/bg1.png", "/bg2.png", "/bg3.png", "/bg4.png", "/bg5.png"];

const HeroSlideshow = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % BG_IMAGES.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {BG_IMAGES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out"
          style={{
            backgroundImage: `url(${src})`,
            opacity: i === index ? 1 : 0,
            zIndex: i === index ? 1 : 0,
          }}
          aria-hidden={i !== index}
        />
      ))}
      {/* Dark overlay for text readability */}
      <div
        className="absolute inset-0 bg-black/50 z-[2]"
        aria-hidden
      />
    </div>
  );
};

export default HeroSlideshow;
