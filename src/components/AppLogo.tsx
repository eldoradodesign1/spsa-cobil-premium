import { useState } from "react";

type AppLogoProps = {
  compact?: boolean;
  className?: string;
  showText?: boolean;
  size?: number;
};

/**
 * Logo officiel SPSA COBIL en pur SVG vectoriel.
 * - Le texte suit la couleur de texte du thème (currentColor / var(--ink)) pour une lisibilité optimale
 * - Au survol (hover), les deux barres (verte et rouge) s'écartent avec une transition fluide
 * - Rendu 100% vectoriel et net sur tous les écrans
 */
export function AppLogo({
  compact = false,
  className = "",
  showText = true,
  size,
}: AppLogoProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`brand-lockup ${compact ? "brand-lockup--compact" : ""} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: "pointer" }}
    >
      <svg
        viewBox="0 0 1024 927"
        className="brand-mark-svg"
        style={{
          width: size || (compact ? 38 : 42),
          height: size ? (size * 927) / 1024 : compact ? 34 : 38,
          display: "inline-block",
          flexShrink: 0,
          overflow: "visible",
        }}
        aria-label="Logo SPSA COBIL"
        role="img"
      >
        <defs>
          <filter id="brand-svg-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodOpacity="0.22" floodColor="#007648" />
          </filter>
        </defs>

        {/* Barre / Aile Supérieure (Verte Officielle SPSA #007648) - S'écarte vers le haut au survol */}
        <g
          className="brand-svg-wing brand-svg-wing--top"
          style={{
            transform: isHovered ? "translateY(-16px)" : "translateY(0px)",
            transition: "transform 320ms cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        >
          <path
            d="M 469 23 L 586 25 L 711 39 L 807 61 L 890 91 L 894 99 L 894 254 L 888 253 L 857 233 L 815 214 L 773 199 L 710 182 L 606 166 L 481 163 L 376 171 L 285 189 L 235 204 L 191 221 L 129 256 L 130 92 L 209 63 L 291 43 L 364 31 L 469 24 Z"
            fill="#007648"
          />
        </g>

        {/* Typographie Centrale SPSA COBIL - Suit la couleur du texte courant (var(--ink)) */}
        <g fill="currentColor" className="brand-svg-text" style={{ transition: "fill 220ms ease" }}>
          {/* Texte SPSA */}
          <text
            x="512"
            y="410"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
            fontWeight="900"
            fontSize="158"
            letterSpacing="8"
            style={{ userSelect: "none" }}
          >
            SPSA
          </text>

          {/* Texte COBIL */}
          <text
            x="512"
            y="575"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
            fontWeight="900"
            fontSize="148"
            letterSpacing="18"
            style={{ userSelect: "none" }}
          >
            COBIL
          </text>
        </g>

        {/* Barre / Aile Inférieure (Rouge Officielle SPSA #F50006) - S'écarte vers le bas au survol */}
        <g
          className="brand-svg-wing brand-svg-wing--bottom"
          style={{
            transform: isHovered ? "translateY(16px)" : "translateY(0px)",
            transition: "transform 320ms cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        >
          <path
            d="M 132 652 L 148 665 L 195 691 L 277 721 L 326 733 L 394 744 L 492 751 L 612 746 L 672 738 L 718 728 L 808 700 L 810 697 L 854 678 L 893 652 L 893 820 L 855 839 L 789 862 L 696 882 L 608 893 L 490 897 L 443 895 L 389 891 L 297 877 L 194 849 L 130 821 L 130 653 L 132 653 Z"
            fill="#F50006"
          />
        </g>
      </svg>

      {!compact && showText && (
        <div className="brand-wordmark">
          <strong>SPSA</strong>
          <span>COBIL</span>
        </div>
      )}
    </div>
  );
}
