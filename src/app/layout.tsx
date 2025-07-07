import type {Metadata} from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Droguería Avenida - Domicilios',
  description: 'Gestión de domicilios para Droguería Avenida.',
  icons: {
    icon: '/icon.png', // Para navegadores modernos y como ícono de Android
    shortcut: '/favicon.ico', // El favicon clásico para todas las pestañas
    apple: '/apple-icon.png', // Para cuando se añade a la pantalla de inicio en iPhones y iPads
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
