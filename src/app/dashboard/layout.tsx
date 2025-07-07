import type { ReactNode } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import type { User } from '@/types';

// Mock users with different roles
const mockAdminUser: User = { 
  id: 'admin_camilo_toro', 
  name: 'Camilo Toro', 
  role: 'admin', 
  cedula: '1091656511', 
  phone: '3156765529'
};

const mockAgentUser: User = { 
  id: 'agent01', 
  name: 'Carlos Rivas', 
  role: 'agent', 
  cedula: '123456', 
  phone: '3001112233'
};

const mockDeliveryUser: User = {
  id: 'delivery01',
  name: 'Miguel Torres',
  role: 'delivery',
  cedula: '789012',
  phone: '3012345678'
};

// --- PARA PROBAR PERFILES ---
// Para ver la vista de Agente, usa esta línea:
// const currentUser = mockAgentUser;

// Para ver la vista de Domiciliario, usa esta línea:
// const currentUser = mockDeliveryUser;

// Para ver la vista de Admin, usa esta línea:
const currentUser = mockAdminUser;


export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <Sidebar user={currentUser} />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 flex-1">
        <Header user={currentUser} />
        <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}
