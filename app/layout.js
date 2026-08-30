import "./globals.css";
import AddToHomeScreen from "./components/AddToHomeScreen";

export const metadata = {
  title: "The Predictor | Telford & Wrekin HC",
  description: "Telford & Wrekin Hockey Club Match Result Predictor",

  manifest: "/manifest.webmanifest",

  applicationName: "The Predictor",

  appleWebApp: {
    capable: true,
    title: "The Predictor",
    statusBarStyle: "black-translucent",
  },

  icons: {
    icon: [
      {
        url: "/favicon.ico",
      },
      {
        url: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],

    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport = {
  themeColor: "#020812",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <AddToHomeScreen />
      </body>
    </html>
  );
}
