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

// Esta es la forma definitiva y recomendada por Next.js para gestionar los iconos.
// Asegúrate de que los archivos 'favicon.ico', 'icon.png' y 'apple-icon.png'
// estén en la carpeta 'public' en la raíz de tu proyecto.
export const metadata: Metadata = {
  title: 'Droguería - Domicilios',
  description: 'Gestión de domicilios para Droguería Avenida.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${poppins.variable}`}>
      {/* La etiqueta <head> ahora es gestionada automáticamente por Next.js a través del objeto metadata */}
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
