import { getOrdersByDeliveryPerson } from "@/actions/order-actions";
import { getUserByCedula } from "@/actions/user-actions";
import { AssignedRoutesList } from "./components/assigned-routes-list";
import { Card, CardContent } from "@/components/ui/card";

export default async function MisRutasPage() {
    // In a real app, this would come from the auth session.
    // We'll use the hardcoded delivery person for this demo.
    const deliveryUser = await getUserByCedula('789012');

    if (!deliveryUser) {
        return (
             <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    <p>No se pudo encontrar el usuario del domiciliario.</p>
                </CardContent>
            </Card>
        );
    }
    
    const orders = await getOrdersByDeliveryPerson(deliveryUser.id);

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold font-headline">Mis Rutas Asignadas</h1>
                <p className="text-muted-foreground">Aquí puedes ver los detalles de los pedidos que debes entregar hoy.</p>
            </div>
            <AssignedRoutesList initialOrders={orders} />
        </div>
    );
}
