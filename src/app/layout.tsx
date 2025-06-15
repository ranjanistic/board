
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Inter_Tight, Poppins } from 'next/font/google'; // Import specific fonts

// Configure Inter Tight for body
const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight', // CSS variable for Inter Tight
  display: 'swap',
  weight: ['400', '500', '600', '700']
});

// Configure Poppins for headlines
const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins', // CSS variable for Poppins
  display: 'swap',
  weight: ['400', '500', '600', '700'] // Poppins often used bolder for headlines
});

export const metadata: Metadata = {
  title: 'Payr Board',
  description: 'Create and refine sketches on multiple whiteboards.',
};

// Updated SVG with theme colors for favicon
const faviconSvg = `
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 76 73' fill='none'>
    <circle cx='43.984' cy='33.3027' r='7.91935' stroke='%23ffd42a' stroke-width='2'/> {/* accent */}
    <circle cx='40.8492' cy='57.3548' r='6.93548' stroke='%236497EE' stroke-width='2'/> {/* primary */}
    <line x1='22.0737' y1='62.0967' x2='40.8491' y2='57.3548' stroke='%23ffd42a' stroke-width='11.871' stroke-linecap='round'/>
    <line x1='40.8491' y1='57.3548' x2='51.0307' y2='42.7661' stroke='%23ffd42a' stroke-width='11.871' stroke-linecap='round'/>
    <line x1='43.9839' y1='33.3027' x2='57.7985' y2='23.5124' stroke='%236497EE' stroke-width='13.8468' stroke-linecap='round'/>
    <line x1='43.9839' y1='33.3027' x2='60.7502' y2='48.8833' stroke='%236497EE' stroke-width='13.8468' stroke-linecap='round'/>
    <circle cx='18.0077' cy='64.0645' r='10.8871' fill='%23ffd42a'/>
    <circle cx='40.8491' cy='57.3548' r='5.93548' fill='%23ffd42a'/>
    <circle cx='53.9835' cy='38.8306' r='5.93548' fill='%23ffd42a'/>
    <circle cx='61.7338' cy='17.5806' r='12.8629' fill='%236497EE'/>
    <circle cx='43.9839' cy='33.3027' r='6.91935' fill='%236497EE'/>
    <circle cx='64.7015' cy='52.8185' r='6.91935' fill='%236497EE'/>
  </svg>
`.replace(/\n\s*/g, ''); // Minify SVG string

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${interTight.variable} ${poppins.variable}`}>
      <head>
        <link rel="icon" href={`data:image/svg+xml,${encodeURIComponent(faviconSvg)}`} />
      </head>
      <body className="font-body antialiased"> {/* font-body will use Inter Tight via Tailwind config */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
