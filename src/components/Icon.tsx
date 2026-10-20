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
  whatsapp: '<path d="M4.5 19.5l1.2-4A8 8 0 1 1 9 18.6z"/><path d="M9.5 9.2c.2 1.9 2.4 4.3 4.6 4.8l.9-1.1 1.6.7-.3 1.4c-3.4.4-7.5-3.4-7.4-6.9l1.4-.4.8 1.5z"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  microscope: '<path d="M6 21h12M9 21v-3a6 6 0 0 0 9-5"/><path d="M10 3l4 2-3 6-4-2z"/><path d="M8.5 14.5h3"/>',
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
