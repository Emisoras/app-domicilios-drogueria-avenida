import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Truck, DollarSign, Package, Map } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getDashboardStats } from "@/actions/order-actions";
import { WeeklyRevenueChart } from "./components/weekly-revenue-chart";
import type { OrderStatus } from "@/types";
import { getSession } from '@/lib/auth';
import { getUserByCedula } from '@/actions/user-actions';
import { redirect } from 'next/navigation';


const getStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case 'in_transit': return <Badge variant="accent">En Camino</Badge>;
    case 'assigned': return <Badge variant="secondary">Asignado</Badge>;
    case 'pending': return <Badge variant="outline">Pendiente</Badge>;
    case 'delivered': return <Badge variant="success">Entregado</Badge>;
    case 'cancelled': return <Badge variant="destructive">Cancelado</Badge>;
    default: return <Badge>{status}</Badge>;
  }
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/');
  }

  const currentUser = await getUserByCedula(session.userId);

  if (!currentUser) {
    redirect('/');
  }

  const stats = await getDashboardStats(currentUser.id, currentUser.role);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
        <p className="text-muted-foreground">Un resumen de la operación de hoy.</p>
      </div>
      {currentUser.role === 'admin' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos del Día</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dailyOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entregas Pendientes</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingDeliveries}</div>
              <p className="text-xs text-muted-foreground">Asignados o en tránsito</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recaudado (Hoy)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dailyRevenue.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</div>
              <p className="text-xs text-muted-foreground">Caja parcial de entregados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gestión de Rutas</CardTitle>
              <Map className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">Optimiza Entregas</div>
              <p className="text-xs text-muted-foreground mb-4">Planifica y asigna rutas.</p>
              <Button asChild size="sm">
                <Link href="/dashboard/rutas">Ir a Rutas</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {currentUser.role === 'delivery' && (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mis Pedidos Asignados</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingDeliveries}</div>
              <p className="text-xs text-muted-foreground">Pedidos en ruta o asignados a ti</p>
              <Button asChild size="sm" className="mt-4">
                <Link href="/dashboard/mis-rutas">Ver Mis Rutas</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Entregados Hoy</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dailyRevenue.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</div>
              <p className="text-xs text-muted-foreground">Valor total de tus entregas de hoy</p>
              <Button asChild size="sm" className="mt-4">
                <Link href="/dashboard/cuadre-caja">Cuadre de Caja</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pedidos Recientes</CardTitle>
            <CardDescription>Los últimos 5 pedidos {currentUser.role === 'delivery' ? 'asignados a ti' : 'gestionados en la plataforma'}.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id.slice(-6)}</TableCell>
                      <TableCell>{order.client?.fullName || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-right">{order.total.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</TableCell>
                    </TableRow>
                  ))
                ) : (
                   <TableRow>
                      <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                        No hay pedidos recientes.
                      </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {currentUser.role === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle>Ingresos de la Semana</CardTitle>
              <CardDescription>Resumen de ventas de los últimos 7 días.</CardDescription>
            </CardHeader>
            <CardContent>
              <WeeklyRevenueChart data={stats.weeklyRevenue} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
