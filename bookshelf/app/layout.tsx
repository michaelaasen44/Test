import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Reading Nook",
  description: "Books, reviews, and a life well-read.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav
          style={{
            backgroundColor: "var(--surface)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              maxWidth: 900,
              margin: "0 auto",
              padding: "1rem 1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Link
              href="/"
              style={{
                fontSize: "1.4rem",
                fontWeight: "bold",
                color: "var(--gold)",
                letterSpacing: "0.02em",
              }}
            >
              📚 The Reading Nook
            </Link>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <Link href="/reviews" style={{ color: "var(--text-muted)" }}>
                Reviews
              </Link>
              <Link href="/tracker" style={{ color: "var(--text-muted)" }}>
                My Books
              </Link>
              <Link href="/instagram" style={{ color: "var(--text-muted)" }}>
                &lsquo;Gram
              </Link>
            </div>
          </div>
        </nav>
        <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem" }}>
          {children}
        </main>
        <footer
          style={{
            borderTop: "1px solid var(--border)",
            textAlign: "center",
            padding: "2rem",
            color: "var(--text-muted)",
            fontSize: "0.85rem",
          }}
        >
          Made with love & late nights reading 🕯️
        </footer>
      </body>
    </html>
  );
}
