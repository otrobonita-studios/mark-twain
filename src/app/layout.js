import "./globals.css";

export const metadata = {
  title: "Mark Twain Reappears",
  description: "An operative AI media series following Mark Twain as he navigates modern technology, AI bubbles, and the boardroom of Stella Studios.",
  icons: {
    icon: "/favicon/favicon.ico",
    shortcut: "/favicon/favicon.ico",
    apple: "/favicon/apple-touch-icon.png",
    other: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        url: "/favicon/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        url: "/favicon/favicon-16x16.png",
      },
    ],
  },
  manifest: "/favicon/site.webmanifest",
  openGraph: {
    title: "Mark Twain Reappears",
    description: "An operative AI media series following Mark Twain as he navigates modern technology, AI bubbles, and the boardroom of Stella Studios.",
    images: [{ url: "/images/mark-twain-reappears-poster.webp" }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
