const WaveBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />

    {/* Wave SVGs */}
    <svg
      className="absolute bottom-0 left-0 w-[200%] h-40 opacity-[0.07] wave-animation"
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
    >
      <path
        fill="hsl(222, 80%, 33%)"
        d="M0,224L48,208C96,192,192,160,288,165.3C384,171,480,213,576,213.3C672,213,768,171,864,149.3C960,128,1056,128,1152,149.3C1248,171,1344,213,1392,234.7L1440,256L1440,320L0,320Z"
      />
    </svg>
    <svg
      className="absolute bottom-0 left-0 w-[200%] h-32 opacity-[0.05] wave-animation-slow"
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
    >
      <path
        fill="hsl(187, 94%, 43%)"
        d="M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,229.3C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L0,320Z"
      />
    </svg>

    {/* Floating bubbles */}
    {[...Array(8)].map((_, i) => (
      <div
        key={i}
        className="bubble"
        style={{
          width: `${12 + i * 8}px`,
          height: `${12 + i * 8}px`,
          left: `${10 + i * 12}%`,
          animationDuration: `${8 + i * 3}s`,
          animationDelay: `${i * 1.5}s`,
        }}
      />
    ))}
  </div>
);

export default WaveBackground;
