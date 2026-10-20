import Link from "next/link";
import { fmtDate } from "@/lib/format";
import { renderMarkdown, spotifyEmbed, youtubeEmbed } from "@/lib/markdown";
import { FORMATS, type Post } from "@/lib/posts";

/** Portada: la imagen de la nota o, si no tiene, una portada de marca con la categoría. */
export function Cover({ post, tall = false }: { post: Pick<Post, "image_url" | "category" | "format">; tall?: boolean }) {
  if (post.image_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={"cover" + (tall ? " tall" : "")} src={post.image_url} alt="" loading="lazy" />;
  }
  return (
    <div className={"cover brand" + (tall ? " tall" : "")} aria-hidden="true">
      <span>{FORMATS[post.format]}</span>
      <b>{post.category}</b>
    </div>
  );
}

export function PostCard({ post, base }: { post: Post; base: string }) {
  return (
    <Link className="post-card" href={`${base}/${post.id}`}>
      <Cover post={post} />
      <div className="post-body">
        <span className="chip info">{post.category}</span>
        <h3>{post.title}</h3>
        <p>{post.summary}</p>
        <span className="small muted">{FORMATS[post.format]} · {fmtDate(post.published_at)}</span>
      </div>
    </Link>
  );
}

export function PostList({ posts, base, empty }: { posts: Post[]; base: string; empty: string }) {
  if (posts.length === 0) return <section className="card"><p className="muted">{empty}</p></section>;
  return (
    <div className="post-grid">
      {posts.map((p) => <PostCard key={p.id} post={p} base={base} />)}
    </div>
  );
}

/** Tarjeta corta para el inicio: las últimas publicaciones. */
export function CommunityCard({ posts, base }: { posts: Post[]; base: string }) {
  return (
    <section className="card">
      <div className="row-h">
        <h2>Comunidad</h2>
        <Link href={base}>Ver todo</Link>
      </div>
      <div className="list">
        {posts.map((p) => (
          <Link className="li" key={p.id} href={`${base}/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="grow"><b>{p.title}</b><span>{p.category} · {FORMATS[p.format]}</span></div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function PostView({ post, back }: { post: Post; back: string }) {
  const spotify = spotifyEmbed(post.media_url);
  const youtube = youtubeEmbed(post.media_url);
  return (
    <article className="card article">
      <Link href={back} className="small">← Volver a Comunidad</Link>
      <Cover post={post} tall />
      <div className="article-meta">
        <span className="chip info">{post.category}</span>
        <span className="small muted">{FORMATS[post.format]} · {fmtDate(post.published_at ?? post.created_at)} · {post.author}</span>
      </div>
      <h1>{post.title}</h1>
      {post.summary && <p className="lead">{post.summary}</p>}
      {spotify && <iframe className="embed audio" src={spotify} title={post.title} allow="encrypted-media" loading="lazy" />}
      {youtube && <iframe className="embed video" src={youtube} title={post.title} allow="encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />}
      {post.media_url && !spotify && !youtube && (
        <p><a className="btn sec" href={post.media_url} target="_blank" rel="noopener noreferrer">Abrir el contenido</a></p>
      )}
      <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} />
      {post.sources.length > 0 && (
        <div className="sources">
          <h3>Fuentes</h3>
          <ul>
            {post.sources.map((s) => (
              <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
