import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "./ConvexClientProvider";
import { dark } from "@clerk/themes";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

export const metadata = {
  title: "Project Mohenjo",
  description: "The zero-cost, high-scale developer city.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: { colorPrimary: "#f59e0b" } // Amber-500
      }}
    >
      <html lang="en">
        <body className="bg-neutral-950 text-neutral-50 antialiased min-h-screen flex flex-col">
          <ConvexClientProvider>
            {/* Add the Navbar here! */}
            <Navbar />

            {/* Make the main content fill the rest of the screen */}
            <div className="flex-1 flex flex-col">
              {children}
            </div>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
