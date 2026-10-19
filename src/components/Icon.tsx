const P: Record<string, string> = {
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  clip: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path d="M9 12h6M9 16h4"/>',
  alert: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 13h6M9 17h6"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M8 11h2l1-2 2 4 1-2h2"/>',
  cap: '<path d="M3 9l9-5 9 5-9 5z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/>',
  team: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M15 15c3 0 6 1.8 6 5"/>',
  users: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
  pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  chat: '<path d="M4 5h16v11H8l-4 4z"/>',
  check: '<path d="M5 12l4 4 10-10"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  down: '<path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v6H4V6h6"/>',
  pulse: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
};

export function Icon({ name }: { name: keyof typeof P | string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: P[name] ?? "" }}
    />
  );
}

export function Isotipo() {
  return (
    <svg viewBox="0 0 1000 1000" aria-hidden="true">
      <line x1="135" y1="765" x2="510" y2="236" stroke="#0052FD" strokeWidth="78" strokeLinecap="round" />
      <line x1="510" y1="236" x2="865" y2="765" stroke="#08AF4C" strokeWidth="78" strokeLinecap="round" />
      <line x1="135" y1="765" x2="865" y2="765" stroke="#16BDD2" strokeWidth="78" strokeLinecap="round" />
      <circle cx="135" cy="765" r="135" fill="#0052FD" />
      <circle cx="510" cy="236" r="135" fill="#08AF4C" />
      <circle cx="865" cy="765" r="135" fill="#16BDD2" />
    </svg>
  );
}

export function Logo({ subtitle = "Portal de clientes · by IDT" }: { subtitle?: string }) {
  return (
    <div className="logo">
      <Isotipo />
      <div className="t">
        saludocupacional<span>.com.ar</span>
        <span className="by">{subtitle}</span>
      </div>
    </div>
  );
}
