import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUsers } from '@/actions/user-actions';
import type { User } from '@/types';
import { AgentsList } from "./components/agents-list";

// In a real app, this user would come from context or auth.
const currentUser: User = { id: 'admin_camilo_toro', name: 'Camilo Toro', role: 'admin', cedula: '1091656511', phone: '3156765529'};

export default async function AgentesPage() {
    // Fetch agents from the database on the server
    const agents = await getUsers('agent');

    return (
        <div>
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Gestión de Agentes</h1>
                    <p className="text-muted-foreground">Administra los usuarios del call center.</p>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Agentes</CardTitle>
                    <CardDescription>
                        Aquí podrás ver, editar y añadir nuevos agentes desde la base de datos.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <AgentsList initialAgents={agents} currentUser={currentUser} />
                </CardContent>
            </Card>
        </div>
    );
}
