/**
 * Add your bookstagram post URLs here.
 *
 * To get a post URL:
 * 1. Open the post on Instagram
 * 2. Copy the URL from your browser (e.g. https://www.instagram.com/p/ABC123xyz/)
 * 3. Paste it below as a new entry
 *
 * Posts appear on the /instagram page in the order listed here.
 */
export interface InstagramPost {
  url: string;
  caption?: string; // optional short label shown above the embed
}

export const instagramPosts: InstagramPost[] = [
  // Add your posts here, for example:
  // { url: "https://www.instagram.com/p/ABC123xyz/", caption: "The Night Circus 🎪" },
  // { url: "https://www.instagram.com/p/DEF456uvw/", caption: "Circe 🌿" },
];
