'use server';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Smartphone, HandCoins, Users, PackageCheck } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getOrders } from "@/actions/order-actions";
import type { Order } from '@/types';

export default async function CuadreCajaPage() {
    const allOrders = await getOrders();
    const completedOrders: Order[] = allOrders.filter((o: Order) => o.status === 'delivered');

    const totalCash = completedOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
    const totalTransfer = completedOrders.filter(o => o.paymentMethod === 'transfer').reduce((sum, o) => sum + o.total, 0);
    const totalOrders = completedOrders.length;
    const totalCollected = totalCash + totalTransfer;

    const ordersByDeliveryPerson = completedOrders.reduce<Record<string, Order[]>>((acc, order) => {
        const deliveryPersonName = order.assignedTo?.name;
        if (!deliveryPersonName) return acc; // Skip if for some reason a delivered order has no assigned person

        if (!acc[deliveryPersonName]) {
            acc[deliveryPersonName] = [];
        }
        acc[deliveryPersonName].push(order);
        return acc;
    }, {});

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Cuadre de Caja General</h1>
                <p className="text-muted-foreground">Consolidado de todas las entregas y recaudos del turno.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Resumen General del Día</CardTitle>
                    <CardDescription>Totales combinados de todos los domiciliarios.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-start gap-4 rounded-lg border p-4">
                        <PackageCheck className="h-8 w-8 text-muted-foreground" />
                        <div>
                            <p className="font-semibold">Pedidos Entregados</p>
                            <p className="text-2xl font-bold">{totalOrders}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 rounded-lg border p-4">
                        <HandCoins className="h-8 w-8 text-success" />
                        <div>
                            <p className="font-semibold">Total Efectivo</p>
                            <p className="text-2xl font-bold">{totalCash.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 rounded-lg border p-4">
                        <Smartphone className="h-8 w-8 text-accent" />
                        <div>
                            <p className="font-semibold">Total Transferencias</p>
                            <p className="text-2xl font-bold">{totalTransfer.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 rounded-lg border bg-primary text-primary-foreground p-4">
                        <Users className="h-8 w-8 text-primary-foreground/80" />
                        <div>
                            <p className="font-semibold">Total Recaudado</p>
                            <p className="text-2xl font-bold">{totalCollected.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div>
                <h2 className="text-2xl font-bold font-headline mb-4">Desglose por Domiciliario</h2>
                {Object.keys(ordersByDeliveryPerson).length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {Object.entries(ordersByDeliveryPerson).map(([name, orders]) => {
                            const subTotal = orders.reduce((sum, order) => sum + order.total, 0);
                            return (
                                <AccordionItem value={name} key={name}>
                                    <AccordionTrigger className="text-lg font-medium hover:no-underline">
                                        <div className="flex items-center gap-4">
                                            <span>{name}</span>
                                            <Badge variant="outline">{orders.length} entregas</Badge>
                                        </div>
                                        <span className="text-xl font-bold text-primary">
                                            {subTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                                        </span>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <Card>
                                            <CardContent className="pt-6">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Pedido</TableHead>
                                                            <TableHead>Cliente</TableHead>
                                                            <TableHead>Método</TableHead>
                                                            <TableHead className="text-right">Total</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {orders.map((order) => (
                                                            <TableRow key={order.id}>
                                                                <TableCell className="font-medium">#{order.id.slice(-6)}</TableCell>
                                                                <TableCell>{order.client.fullName}</TableCell>
                                                                <TableCell>
                                                                    <Badge variant={order.paymentMethod === 'cash' ? 'success' : 'accent'}>
                                                                        {order.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-right">{order.total.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                    <TableFooter>
                                                        <TableRow>
                                                            <TableCell colSpan={3} className="font-bold text-lg">Total Domiciliario</TableCell>
                                                            <TableCell className="text-right font-bold text-lg">{subTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</TableCell>
                                                        </TableRow>
                                                    </TableFooter>
                                                </Table>
                                            </CardContent>
                                        </Card>
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                    </Accordion>
                ) : (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            No hay pedidos entregados para mostrar en el cuadre de caja aún.
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
