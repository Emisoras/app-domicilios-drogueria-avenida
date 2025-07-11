import { getOrders } from "@/actions/order-actions";
import { getUsers, getUserByCedula } from "@/actions/user-actions";
import { RoutePlanner } from "./components/route-planner";
import type { Order, User } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

// Helper function to group orders by delivery person on the server
const groupOrdersByDeliveryPerson = (orders: Order[]): Record<string, Order[]> => {
    const assignedOrders = orders.filter(o => (o.status === 'in_transit' || o.status === 'assigned') && o.assignedTo);

    return assignedOrders.reduce<Record<string, Order[]>>((acc, order) => {
        const personId = order.assignedTo!.id;
        if (!acc[personId]) {
            acc[personId] = [];
        }
        acc[personId].push(order);
        // Sort orders for each person by creation date to have a consistent route order
        acc[personId].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return acc;
    }, {});
};

export default async function RutasPage() {
  // Fetch initial data on the server
  const allOrders = await getOrders();
  const deliveryPeople = await getUsers('delivery');
  
  // In a real app, the logged-in user would come from an auth session.
  // For now, we'll fetch the main admin user, who is acting as the agent creating orders.
  const agentUser = await getUserByCedula('1091656511');

  if (!agentUser) {
    // This is a critical error. The admin user should always exist due to the self-healing login.
    // A proper error page should be shown in a real app.
    return (
        <Card>
            <CardContent className="p-8 text-center text-destructive">
                Error Crítico: No se pudo encontrar al usuario administrador. La aplicación no puede funcionar.
            </CardContent>
        </Card>
    );
  }


  // Filter and group orders on the server
  const pendingOrders = allOrders
    .filter(o => o.status === 'pending')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
  const assignedRoutes = groupOrdersByDeliveryPerson(allOrders);

  return (
    <RoutePlanner 
      initialPendingOrders={pendingOrders}
      initialAssignedRoutes={assignedRoutes}
      deliveryPeople={deliveryPeople}
      agent={agentUser}
    />
  );
}