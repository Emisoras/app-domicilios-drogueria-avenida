import { getOrders } from "@/actions/order-actions";
import { getUsers, getUserByCedula } from "@/actions/user-actions";
import { getClients } from "@/actions/client-actions";
import { RoutePlanner } from "./components/route-planner";
import type { Order } from "@/types";
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
  // Fetch initial data on the server in parallel for better performance
  const session = await getSession();
  if (!session) {
    redirect('/');
  }

  const currentUser = await getUserByCedula(session.userId);

  if (!currentUser) {
    redirect('/');
  }

  const [allOrders, deliveryPeople, clients] = await Promise.all([
    getOrders(),
    getUsers('delivery'),
    getClients()
  ]);

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
      agent={currentUser}
      initialClients={clients}
    />
  );
}
