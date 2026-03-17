import { getByStatus, Book } from "@/lib/books";
import StarRating from "@/components/StarRating";

function BookCard({ book }: { book: Book }) {
  return (
    <div
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "1.25rem",
        display: "flex",
        gap: "1rem",
        alignItems: "flex-start",
      }}
    >
      <span style={{ fontSize: "2.25rem", flexShrink: 0 }}>{book.cover}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: "bold", fontSize: "1rem", marginBottom: "0.15rem" }}>{book.title}</div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{book.author}</div>
        <div
          style={{
            display: "inline-block",
            marginTop: "0.4rem",
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
        </div>
        {book.pages && (
          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.3rem" }}>
            {book.pages} pages
          </div>
        )}
        {book.rating && (
          <div style={{ marginTop: "0.4rem" }}>
            <StarRating rating={book.rating} />
          </div>
        )}
        {book.dateRead && (
          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.3rem" }}>
            Read{" "}
            {new Date(book.dateRead).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  emoji,
  books,
  accent,
}: {
  title: string;
  emoji: string;
  books: Book[];
  accent?: string;
}) {
  return (
    <section style={{ marginBottom: "3rem" }}>
      <h2
        style={{
          fontSize: "1.2rem",
          marginBottom: "1.25rem",
          color: accent ?? "var(--accent)",
          letterSpacing: "0.05em",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span>{emoji}</span> {title}
        <span
          style={{
            marginLeft: "0.5rem",
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            fontWeight: "normal",
          }}
        >
          ({books.length})
        </span>
      </h2>
      {books.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Nothing here yet…</p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
        >
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function TrackerPage() {
  const reading = getByStatus("reading");
  const read = getByStatus("read");
  const wantToRead = getByStatus("want-to-read");

  return (
    <div>
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.4rem" }}>My Books</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Tracking {read.length} books read · {reading.length} in progress · {wantToRead.length} on the list
        </p>
      </div>

      <Section title="Currently Reading" emoji="📖" books={reading} accent="var(--accent)" />
      <Section title="Read" emoji="✅" books={read} accent="var(--gold)" />
      <Section title="Want to Read" emoji="🔖" books={wantToRead} accent="var(--text-muted)" />
    </div>
  );
}
