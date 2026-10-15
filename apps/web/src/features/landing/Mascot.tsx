import pikkaMascot from '@/assets/pikka.png'

/** Pikka otter mascot image. */
export function Mascot({ className = '' }: { className?: string }) {
  return <img src={pikkaMascot} alt="Pikka, la nutria mensajera" width={1536} height={1024} decoding="async" className={className} />
}
