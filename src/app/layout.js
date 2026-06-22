import "./globals.css";
import Navigation from "@/components/Navigation";
import MusicDesk from "@/components/MusicDesk";

export const metadata = {
  metadataBase: new URL("https://mark.otrobonita.com"),
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&family=Inter:wght@300;400;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Special+Elite&family=IM+Fell+DW+Pica:ital@0;1&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Navigation />
        {children}
        <MusicDesk />
      </body>
    </html>
  );
}
