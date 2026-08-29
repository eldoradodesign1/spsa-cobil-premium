/** SPSA COBIL — logo officiel servi depuis les ressources publiques du build. */
type AppLogoProps = { compact?: boolean; className?: string };

export function AppLogo({ compact = false, className = "" }: AppLogoProps) {
  return <div className={`brand-lockup ${compact ? "brand-lockup--compact" : ""} ${className}`}>
    <img src={`${import.meta.env.BASE_URL}icons/spsa-cobil-logo.png`} alt="" className="brand-mark" />
    {!compact && <div className="brand-wordmark"><strong>SPSA</strong><span>COBIL</span></div>}
  </div>;
}
