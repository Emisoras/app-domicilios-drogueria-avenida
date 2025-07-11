import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUsers } from '@/actions/user-actions';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserByCedula } from '@/actions/user-actions';
import type { User } from '@/types';

export default async function DomiciliariosPage() {
  const session = await getSession();
  if (!session) {
    redirect('/');
  }

  const currentUser = await getUserByCedula(session.userId);

  if (!currentUser) {
    redirect('/');
  }

  const deliveryPeople = await getUsers('delivery');
  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Gestión de Domiciliarios</h1>
          <p className="text-muted-foreground">Administra la información y el historial de tus domiciliarios.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Domiciliarios</CardTitle>
          <CardDescription>
            Aquí podrás ver, editar y añadir nuevos domiciliarios desde la base de datos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeliveryPeopleList initialDeliveryPeople={deliveryPeople} currentUser={currentUser} />
        </CardContent>
      </Card>
    </div>
  );
}
