type DistressFilterProps = {
  id: string;
};

export function DistressFilter({ id }: DistressFilterProps) {
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.07"
        numOctaves={3}
        result="noise"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="noise"
        scale={3.5}
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  );
}

