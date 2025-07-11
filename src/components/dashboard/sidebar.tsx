import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Logo } from '@/components/icons/logo';
import { LayoutDashboard, Bike, Users, Map, ClipboardList, LogOut, Settings, ListOrdered, Calculator, Headset } from 'lucide-react';
import type { User } from '@/types';

const navItems: { href: string; icon: React.ElementType; label: string; }[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/pedidos', icon: ClipboardList, label: 'Pedidos' },
  { href: '/dashboard/clientes', icon: Users, label: 'Clientes' },
  { href: '/dashboard/agentes', icon: Headset, label: 'Agentes' },
  { href: '/dashboard/domiciliarios', icon: Bike, label: 'Domiciliarios' },
  { href: '/dashboard/rutas', icon: Map, label: 'Rutas' },
  { href: '/dashboard/mis-rutas', icon: ListOrdered, label: 'Mis Rutas' },
  { href: '/dashboard/cuadre-caja', icon: Calculator, label: 'Cuadre de Caja' },
  { href: '/dashboard/configuracion', icon: Settings, label: 'Configuración' },
];

export function Sidebar({ user }: { user: User }) {
  const accessibleNavItems = navItems;

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link href="#" className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base">
          <Logo className="h-5 w-5 transition-all group-hover:scale-110" />
          <span className="sr-only">Droguería Avenida</span>
        </Link>
        <TooltipProvider>
          {accessibleNavItems.map((item) => (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <Link href={item.href} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8">
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <TooltipProvider>
           <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8">
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Cerrar Sesión</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Cerrar Sesión</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
  );
}
