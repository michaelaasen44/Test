import { instagramPosts } from "@/lib/instagramPosts";
import InstagramEmbed from "@/components/InstagramEmbed";

export default function InstagramPage() {
  const hasPosts = instagramPosts.length > 0;

  return (
    <div>
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>From the &lsquo;Gram</h1>
          <a
            href="https://www.instagram.com/mychaoticshelf"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "0.8rem",
              color: "var(--accent)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: "0.2rem 0.75rem",
              whiteSpace: "nowrap",
            }}
          >
            @mychaoticshelf ↗
          </a>
        </div>
        <p style={{ color: "var(--text-muted)" }}>
          Book photos, cozy vibes, and unhinged opinions — straight from Instagram.
        </p>
      </div>

      {!hasPosts ? (
        <div
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "3rem",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📸</div>
          <p style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>No posts added yet.</p>
          <p style={{ fontSize: "0.9rem" }}>
            Add Instagram post URLs to{" "}
            <code
              style={{
                backgroundColor: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: "0.1rem 0.4rem",
                fontFamily: "monospace",
                color: "var(--accent)",
              }}
            >
              lib/instagramPosts.ts
            </code>{" "}
            to show them here.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "2rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          }}
        >
          {instagramPosts.map((post, i) => (
            <div key={i}>
              {post.caption && (
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                    marginBottom: "0.5rem",
                    textAlign: "center",
                  }}
                >
                  {post.caption}
                </p>
              )}
              <InstagramEmbed postUrl={post.url} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
