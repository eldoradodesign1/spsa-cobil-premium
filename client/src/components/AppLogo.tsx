/** SPSA COBIL — Lentille Boréale : symbole de lentille stratifiée, toujours lisible sur verre. */
type AppLogoProps = { compact?: boolean; className?: string };

export function AppLogo({ compact = false, className = "" }: AppLogoProps) {
  return <div className={`brand-lockup ${compact ? "brand-lockup--compact" : ""} ${className}`}>
    <img src="/manus-storage/spsa-cobil-mark_2a35566d.png" alt="" className="brand-mark" />
    {!compact && <div className="brand-wordmark"><strong>SPSA</strong><span>COBIL</span></div>}
  </div>;
}
