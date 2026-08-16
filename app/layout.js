import "./globals.css";

export const metadata = {
  title: "The Predictor | Telford & Wrekin HC",
  description: "Telford & Wrekin Hockey Club Match Result Predictor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
