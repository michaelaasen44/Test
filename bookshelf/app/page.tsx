import Link from "next/link";
import { books, getByStatus } from "@/lib/books";
import StarRating from "@/components/StarRating";

export default function Home() {
  const reading = getByStatus("reading");
  const recentlyRead = getByStatus("read").slice(-3).reverse();
  const totalRead = getByStatus("read").length;
  const totalPages = books
    .filter((b) => b.status === "read" && b.pages)
    .reduce((sum, b) => sum + (b.pages ?? 0), 0);

  return (
    <div>
      {/* Hero */}
      <section style={{ textAlign: "center", padding: "3rem 0 2rem" }}>
        <p style={{ color: "var(--accent)", fontSize: "1rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
          a bookstagram
        </p>
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: "bold",
            color: "var(--text)",
            lineHeight: 1.2,
            marginBottom: "1rem",
          }}
        >
          The Reading Nook
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", maxWidth: 480, margin: "0 auto 2rem" }}>
          Books devoured, worlds explored, and stories shared — one page at a time.
        </p>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            gap: "2rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {[
            { label: "Books Read", value: totalRead },
            { label: "Pages Turned", value: totalPages.toLocaleString() },
            { label: "Currently Reading", value: reading.length },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "1rem 2rem",
                minWidth: 130,
              }}
            >
              <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "var(--gold)" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "2rem 0" }} />

      {/* Currently Reading */}
      {reading.length > 0 && (
        <section style={{ marginBottom: "3rem" }}>
          <h2 style={{ color: "var(--accent)", fontSize: "1.3rem", marginBottom: "1.25rem", letterSpacing: "0.05em" }}>
            Currently Reading
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {reading.map((book) => (
              <div
                key={book.id}
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "1.25rem 1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1.25rem",
                }}
              >
                <span style={{ fontSize: "2.5rem" }}>{book.cover}</span>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{book.title}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    {book.author} · {book.genre}
                  </div>
                </div>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "0.75rem",
                    backgroundColor: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: 20,
                    padding: "0.25rem 0.75rem",
                    color: "var(--accent)",
                    whiteSpace: "nowrap",
                  }}
                >
                  📖 Reading now
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Reviews */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ color: "var(--accent)", fontSize: "1.3rem", letterSpacing: "0.05em" }}>
            Recent Reviews
          </h2>
          <Link href="/reviews" style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            View all →
          </Link>
        </div>
        <div style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {recentlyRead.map((book) => (
            <div
              key={book.id}
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "1.5rem",
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{book.cover}</div>
              <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>{book.title}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>{book.author}</div>
              {book.rating && <StarRating rating={book.rating} />}
              {book.review && (
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: "0.75rem", lineHeight: 1.6 }}>
                  {book.review.slice(0, 120)}…
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "2.5rem 0" }} />

      {/* Instagram CTA */}
      <section style={{ textAlign: "center", padding: "1rem 0 0.5rem" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
          Follow along on Instagram for book photos &amp; chaotic opinions
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href="https://www.instagram.com/mychaoticshelf"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "0.6rem 1.25rem",
              color: "var(--accent)",
              fontSize: "0.9rem",
            }}
          >
            @mychaoticshelf ↗
          </a>
          <Link
            href="/instagram"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "0.6rem 1.25rem",
              color: "var(--text-muted)",
              fontSize: "0.9rem",
            }}
          >
            View posts on site →
          </Link>
        </div>
      </section>
    </div>
  );
}
