import { getReviewed, Book } from "@/lib/books";
import StarRating from "@/components/StarRating";

function ReviewCard({ book }: { book: Book }) {
  return (
    <article
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "2rem",
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: "1.5rem",
        alignItems: "start",
      }}
    >
      <div
        style={{
          width: 72,
          height: 96,
          backgroundColor: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2.5rem",
          flexShrink: 0,
        }}
      >
        {book.cover}
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "0.2rem" }}>{book.title}</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{book.author}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem", flexShrink: 0 }}>
            {book.rating && <StarRating rating={book.rating} />}
            <span
              style={{
                fontSize: "0.72rem",
                backgroundColor: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: "0.15rem 0.6rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {book.genre}
            </span>
          </div>
        </div>

        {book.review && (
          <blockquote
            style={{
              borderLeft: "3px solid var(--accent)",
              paddingLeft: "1rem",
              marginTop: "1rem",
              color: "var(--text)",
              lineHeight: 1.75,
              fontStyle: "italic",
              fontSize: "0.95rem",
            }}
          >
            {book.review}
          </blockquote>
        )}

        <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {book.pages && <span>{book.pages} pages</span>}
          {book.dateRead && (
            <span>
              Read{" "}
              {new Date(book.dateRead).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function ReviewsPage() {
  const reviewed = getReviewed();

  const avgRating =
    reviewed.length > 0
      ? (reviewed.reduce((s, b) => s + (b.rating ?? 0), 0) / reviewed.length).toFixed(1)
      : "–";

  const fiveStars = reviewed.filter((b) => b.rating === 5).length;

  return (
    <div>
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.4rem" }}>Book Reviews</h1>
        <p style={{ color: "var(--text-muted)" }}>
          {reviewed.length} reviews · avg rating {avgRating} · {fiveStars} five-star reads
        </p>
      </div>

      {/* Rating filter hint */}
      <div
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "1rem 1.25rem",
          marginBottom: "2rem",
          display: "flex",
          gap: "1.5rem",
          flexWrap: "wrap",
          fontSize: "0.85rem",
          color: "var(--text-muted)",
        }}
      >
        {[5, 4, 3, 2, 1].map((n) => {
          const count = reviewed.filter((b) => b.rating === n).length;
          return (
            <span key={n} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ color: "var(--gold)" }}>{"★".repeat(n)}</span>
              <span>({count})</span>
            </span>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {reviewed.map((book) => (
          <ReviewCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
}
