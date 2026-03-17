"use client";

import { useEffect, useRef } from "react";

interface Props {
  postUrl: string;
}

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

export default function InstagramEmbed({ postUrl }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Normalise URL — strip query params / trailing slash variants
    const cleanUrl = postUrl.split("?")[0].replace(/\/$/, "");

    if (window.instgrm) {
      window.instgrm.Embeds.process();
      return;
    }

    // Load the Instagram embed script once
    if (!document.getElementById("instagram-embed-script")) {
      const script = document.createElement("script");
      script.id = "instagram-embed-script";
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, [postUrl]);

  const cleanUrl = postUrl.split("?")[0].replace(/\/$/, "");

  return (
    <div ref={ref} style={{ display: "flex", justifyContent: "center" }}>
      <blockquote
        className="instagram-media"
        data-instgrm-captioned
        data-instgrm-permalink={`${cleanUrl}/?utm_source=ig_embed`}
        data-instgrm-version="14"
        style={{
          background: "#1a1612",
          border: "1px solid #3a3028",
          borderRadius: 12,
          maxWidth: 540,
          width: "100%",
          minWidth: 300,
          padding: 0,
          margin: "0 auto",
        }}
      >
        <a href={cleanUrl} target="_blank" rel="noopener noreferrer">
          View on Instagram
        </a>
      </blockquote>
    </div>
  );
}
