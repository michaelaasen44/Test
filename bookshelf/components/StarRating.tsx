export default function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span style={{ color: "var(--gold)", fontSize: "1rem", letterSpacing: "0.1em" }}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i}>{i < rating ? "★" : "☆"}</span>
      ))}
    </span>
  );
}
