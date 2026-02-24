import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import CustomCursor from "@/components/CustomCursor";
import Navbar from "@/components/Navbar";
import ScrollProgress from "@/components/ScrollProgress";

const roboto = Roboto({
  weight: ["300", "400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "EduGrade AI — SNS Institutions | Controller of Examinations",
  description:
    "Fast, Accurate, AI-powered Answer Sheet Evaluation for SNS Institutions. On-premise intelligence for the Controller of Examinations.",
  keywords: ["EduGrade AI", "SNS Institutions", "Answer Sheet Evaluation", "Controller of Examinations", "AI Grading"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={roboto.variable}>
      <body className="font-sans antialiased">
        <ScrollProgress />
        <CustomCursor />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
