export type Post = {
  id: string;
  status: "borrador" | "publicado" | "archivado";
  audience: ("empresa" | "comercio" | "colaborador")[];
  category: string;
  format: "nota" | "tip" | "noticia" | "podcast" | "video" | "capacitacion";
  title: string;
  summary: string;
  body: string;
  image_url: string | null;
  media_url: string | null;
  sources: { title: string; url: string }[];
  author: string;
  published_at: string | null;
  created_at: string;
};

export const POST_FIELDS = "id, status, audience, category, format, title, summary, body, image_url, media_url, sources, author, published_at, created_at";

/** Categorías en orden de prioridad: salud ocupacional, seguridad e higiene, RR.HH., medicina laboral. */
export const CATEGORIES = [
  "Salud ocupacional",
  "Seguridad e higiene",
  "Recursos humanos",
  "Medicina laboral",
  "Normativa",
  "Campaña de salud",
  "Bienestar",
  "Podcast",
];

export const FORMATS: Record<Post["format"], string> = {
  nota: "Nota",
  tip: "Tip",
  noticia: "Noticia",
  podcast: "Podcast",
  video: "Video",
  capacitacion: "Capacitación",
};

export const AUDIENCES: Record<string, string> = { empresa: "Empresas", comercio: "Comercios", colaborador: "Colaboradores" };
