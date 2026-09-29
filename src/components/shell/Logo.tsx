export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-[7px] bg-yellow font-bold text-green-900"
      style={{ width: size, height: size, fontSize: size * 0.43, letterSpacing: '-0.02em' }}
    >
      MC
    </span>
  );
}
