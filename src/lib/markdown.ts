/**
 * Markdown mínimo y seguro para las notas de la Comunidad:
 * ## títulos, párrafos, listas con "- ", **negrita** y [enlaces](https://...).
 * Todo el texto se escapa: no se permite HTML.
 */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inline(s: string) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

export function renderMarkdown(md: string) {
  const out: string[] = [];
  let para: string[] = [];
  let list: string[] = [];
  const flushPara = () => {
    if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list.length) out.push(`<ul>${list.map((i) => `<li>${inline(i)}</li>`).join("")}</ul>`);
    list = [];
  };
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) { flushPara(); flushList(); continue; }
    const h = line.match(/^#{2,3}\s+(.*)$/);
    if (h) { flushPara(); flushList(); out.push(`<h3>${inline(h[1])}</h3>`); continue; }
    const li = line.match(/^[-*]\s+(.*)$/);
    if (li) { flushPara(); list.push(li[1]); continue; }
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();
  return out.join("\n");
}

/** Enlace de inserción de Spotify (episodio, show o lista) a partir del enlace normal. */
export function spotifyEmbed(url: string | null) {
  const m = url?.match(/open\.spotify\.com\/(episode|show|playlist)\/([A-Za-z0-9]+)/);
  return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : null;
}

/** Enlace de inserción de YouTube a partir del enlace normal. */
export function youtubeEmbed(url: string | null) {
  const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
}
