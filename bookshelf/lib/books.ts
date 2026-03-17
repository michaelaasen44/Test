export type ReadStatus = "read" | "reading" | "want-to-read";

export interface Book {
  id: number;
  title: string;
  author: string;
  cover: string; // emoji placeholder until real covers are added
  genre: string;
  status: ReadStatus;
  rating?: number; // 1–5, only for "read" books
  review?: string;
  dateRead?: string;
  pages?: number;
}

export const books: Book[] = [
  {
    id: 1,
    title: "The Night Circus",
    author: "Erin Morgenstern",
    cover: "🎪",
    genre: "Fantasy",
    status: "read",
    rating: 5,
    review:
      "An utterly enchanting story woven in black and white — and the occasional flash of red. The prose is as magical as the circus itself. I read it in one sitting wrapped in a blanket with a cup of tea and I have zero regrets.",
    dateRead: "2024-11-03",
    pages: 387,
  },
  {
    id: 2,
    title: "Circe",
    author: "Madeline Miller",
    cover: "🌿",
    genre: "Mythology",
    status: "read",
    rating: 5,
    review:
      "Miller breathes life into a character history forgot. Circe is fierce, lonely, curious, and deeply human despite being a goddess. Absolutely dazzling writing.",
    dateRead: "2024-09-15",
    pages: 393,
  },
  {
    id: 3,
    title: "Mexican Gothic",
    author: "Silvia Moreno-Garcia",
    cover: "🌹",
    genre: "Gothic Horror",
    status: "read",
    rating: 4,
    review:
      "Dripping with atmosphere. The house is practically a character in itself. A gorgeous, unsettling read perfect for a stormy night.",
    dateRead: "2024-10-31",
    pages: 301,
  },
  {
    id: 4,
    title: "Piranesi",
    author: "Susanna Clarke",
    cover: "🏛️",
    genre: "Fantasy",
    status: "read",
    rating: 5,
    review:
      "Nothing quite like it. A puzzle box of a book that rewards patience and attention. I finished it and immediately started re-reading.",
    dateRead: "2025-01-10",
    pages: 272,
  },
  {
    id: 5,
    title: "The Atlas Six",
    author: "Olivie Blake",
    cover: "🔮",
    genre: "Dark Academia",
    status: "reading",
    pages: 450,
  },
  {
    id: 6,
    title: "Babel",
    author: "R.F. Kuang",
    cover: "🗝️",
    genre: "Dark Academia",
    status: "want-to-read",
    pages: 545,
  },
  {
    id: 7,
    title: "The Secret History",
    author: "Donna Tartt",
    cover: "🍂",
    genre: "Dark Academia",
    status: "want-to-read",
    pages: 559,
  },
  {
    id: 8,
    title: "Jonathan Strange & Mr Norrell",
    author: "Susanna Clarke",
    cover: "✨",
    genre: "Fantasy",
    status: "want-to-read",
    pages: 846,
  },
];

export function getByStatus(status: ReadStatus): Book[] {
  return books.filter((b) => b.status === status);
}

export function getReviewed(): Book[] {
  return books.filter((b) => b.status === "read" && b.review);
}
