import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { getClients } from '@/actions/client-actions';
import { ClientsList } from "./components/clients-list";
import type { User } from '@/types';

// En un futuro, este usuario vendrá de la sesión.
const currentUser: User = { id: 'admin_camilo_toro', name: 'Camilo Toro', role: 'admin', cedula: '1091656511', phone: '3156765529'};

export default async function ClientesPage() {
    // Fetch clients from the database on the server
    const clients = await getClients();

    return (
        <div>
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Gestión de Clientes</h1>
                    <p className="text-muted-foreground">Administra la información y el historial de tus clientes.</p>
                </div>
                {/* The button to open the dialog is now inside ClientsList */}
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Clientes</CardTitle>
                    <CardDescription>
                        Aquí podrás ver, editar y añadir nuevos clientes desde la base de datos.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <ClientsList initialClients={clients} currentUser={currentUser} />
                </CardContent>
            </Card>
        </div>
    );
}
