import pikkaMascot from '@/assets/pikka.png'

/** Pikka otter mascot image. */
export function Mascot({ className = '' }: { className?: string }) {
  return <img src={pikkaMascot} alt="Pikka, la nutria mensajera" className={className} />
}
