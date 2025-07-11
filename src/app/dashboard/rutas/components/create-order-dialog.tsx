'use client';

import { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Order, User, Location, PaymentMethod } from "@/types";
import { Loader2, MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { geocodeAddress } from '@/ai/flows/geocode-address-flow';
import { reverseGeocode } from '@/ai/flows/reverse-geocode-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { createOrder } from '@/actions/order-actions';
import { getClients } from '@/actions/client-actions';
import { Combobox } from '@/components/ui/combobox';

// Dynamically import map component to avoid SSR issues with Leaflet
const AddressMapPicker = dynamic(() => import('./address-map-picker'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full rounded-lg" />
});

const formSchema = z.object({
    deliveryAddress: z.string().min(5, { message: "La dirección de entrega es requerida." }),
    deliveryLat: z.number().optional(),
    deliveryLng: z.number().optional(),
    orderDescription: z.string().min(5, { message: "La descripción del pedido es requerida." }),
    totalAmount: z.preprocess(
        (val) => Number(val), 
        z.number().min(0, { message: "El monto total debe ser un número positivo." })
    ),
    paymentMethod: z.enum(["cash", "credit_card", "transfer"], { message: "Método de pago inválido." }),
}).superRefine((data, ctx) => {
    if (data.clientType === 'new') {
        if (!data.clientName || data.clientName.length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "El nombre del cliente es requerido para nuevos clientes.",
                path: ['clientName'],
            });
        }
        if (!data.clientPhone || data.clientPhone.length < 7) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "El teléfono del cliente es requerido para nuevos clientes.",
                path: ['clientPhone'],
            });
        }
    } else if (data.clientType === 'existing') {
        if (!data.clientId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Debe seleccionar un cliente existente.",
                path: ['clientId'],
            });
        }
    }
});

interface CreateOrderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onOrderCreated: (order: Order) => void;
    agent: User;
}

const ocanaCenter = { lat: 8.250890339840987, lng: -73.35842108942335 }; // Droguería Avenida

import { Client } from '@/models/client-model';

export function CreateOrderDialog({ open, onOpenChange, onOrderCreated, agent }: CreateOrderDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
    const [location, setLocation] = useState<Location | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            clientType: 'new',
            clientName: "",
            clientPhone: "",
            clientAddress: "",
            orderDetails: "",
            total: 0,
            paymentMethod: "cash",
        },
    });

    React.useEffect(() => {
        if (open) {
            const fetchClients = async () => {
                const response = await getClients();
                if (response.success && response.data) {
                    setClients(response.data);
                } else {
                    toast({
                        title: "Error al cargar clientes",
                        description: response.error || "Hubo un problema al obtener la lista de clientes.",
                        variant: "destructive",
                    });
                }
            };
            fetchClients();
        }
    }, [open, toast]);

    const handleLocateAddress = async () => {
        const address = form.getValues("clientAddress");
        if (!address) {
            form.setError("clientAddress", { type: "manual", message: "Por favor, ingresa una dirección." });
            return;
        }

        setIsLocating(true);
        try {
            const coordinates = await geocodeAddress({ address: `${address}, Ocaña, Norte de Santander` });
            setLocation({ address, ...coordinates });
            toast({
              title: "Dirección Encontrada",
              description: "La dirección ha sido ubicada en el mapa. Arrastra el marcador para ajustar la posición."
            })
        } catch (error: any) {
            console.error("Geocoding failed", error);
            toast({
                variant: 'destructive',
                title: 'Error de Dirección',
                description: `No pudimos encontrar la dirección. Error: ${error.message}`,
            });
            setLocation(null);
        } finally {
            setIsLocating(false);
        }
    };
    
    const handleLocationChange = async (newCoords: { lat: number; lng: number }) => {
        // Optimistically update location for map responsiveness
        setLocation(prev => prev ? { ...prev, ...newCoords } : { address: form.getValues("clientAddress"), ...newCoords });
        
        setIsReverseGeocoding(true);
        try {
            const { address } = await reverseGeocode(newCoords);
            form.setValue("clientAddress", address, { shouldValidate: true });
            // Update the address in the location state as well
            setLocation(prev => prev ? { ...prev, address } : { address, ...newCoords });
        } catch (error: any) {
            console.error("Reverse geocoding failed", error);
             toast({
                variant: 'destructive',
                title: 'Error de Dirección Inversa',
                description: `No pudimos obtener la dirección para estas coordenadas. Error: ${error.message}`,
            });
        } finally {
            setIsReverseGeocoding(false);
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!location?.lat || !location?.lng) {
            toast({
                variant: 'destructive',
                title: 'Ubicación Requerida',
                description: 'Por favor, ubica la dirección en el mapa antes de guardar.',
            });
            return;
        }

        setIsSubmitting(true);
        
        // Simple transformation of orderDetails string. In a real app, this would be a proper form for items.
        const items = [{
            id: `prod-new-${Date.now()}`,
            name: values.orderDetails.split(',')[0].trim() || 'Producto',
            quantity: 1,
            price: values.total
        }];

        let clientNameToSend: string | undefined;
        let clientPhoneToSend: string | undefined;

        if (values.clientType === 'existing') {
            const selectedClient = clients.find(c => c.id === values.clientId);
            if (selectedClient) {
                clientNameToSend = selectedClient.fullName;
                clientPhoneToSend = selectedClient.phone;
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error de Cliente',
                    description: 'Cliente existente no encontrado.',
                });
                setIsSubmitting(false);
                return;
            }
        } else {
            clientNameToSend = values.clientName;
            clientPhoneToSend = values.clientPhone;
        }

        let result;
        if (values.clientType === 'existing') {
            result = await createOrder({
                clientId: values.clientId,
                deliveryAddress: location.address,
                deliveryLat: location.lat,
                deliveryLng: location.lng,
                orderDescription: values.orderDetails,
                totalAmount: values.total,
                paymentMethod: values.paymentMethod
            });
        } else {
            result = await createOrder({
                clientName: values.clientName,
                clientPhone: values.clientPhone,
                deliveryAddress: location.address,
                deliveryLat: location.lat,
                deliveryLng: location.lng,
                orderDescription: values.orderDetails,
                totalAmount: values.total,
                paymentMethod: values.paymentMethod
            });
        }

        if (result.success && result.order) {
            onOrderCreated(result.order);
            form.reset();
            setLocation(null);
        } else {
            toast({
                variant: 'destructive',
                title: 'Error al Crear Pedido',
                description: result.message || 'Ocurrió un error inesperado.',
            });
        }
        setIsSubmitting(false);
    }
    
    // Reset location state when dialog is closed
    const handleOpenChange = (isOpen: boolean) => {
      if (!isOpen) {
        setLocation(null);
        form.reset();
      }
      onOpenChange(isOpen);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Pedido</DialogTitle>
                    <DialogDescription>
                        Ingresa los detalles, ubica la dirección en el mapa y guarda el pedido.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="max-h-[65vh] overflow-y-auto pr-4">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                             <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="clientType"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel>Tipo de Cliente</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={(value) => {
                                                        field.onChange(value);
                                                        form.resetField('clientId');
                                                        form.resetField('clientName');
                                                        form.resetField('clientPhone');
                                                    }}
                                                    defaultValue={field.value}
                                                    className="flex gap-4"
                                                >
                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="new" id="new-client" />
                                                        </FormControl>
                                                        <FormLabel htmlFor="new-client" className="font-normal cursor-pointer">
                                                            Nuevo Cliente
                                                        </FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="existing" id="existing-client" />
                                                        </FormControl>
                                                        <FormLabel htmlFor="existing-client" className="font-normal cursor-pointer">
                                                            Cliente Existente
                                                        </FormLabel>
                                                    </FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {form.watch('clientType') === 'existing' ? (
                                    <FormField
                                        control={form.control}
                                        name="clientId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Seleccionar Cliente</FormLabel>
                                                <Combobox
                                                    options={clients.map(client => ({ value: client.id, label: `${client.fullName} (${client.phone})` }))}
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    placeholder="Selecciona un cliente..."
                                                    emptyMessage="No se encontraron clientes."
                                                    searchPlaceholder="Buscar cliente..."
                                                />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ) : (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name="clientName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nombre del Cliente</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Nombre completo" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="clientPhone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Teléfono</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="3001234567" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                )}
                                <FormField
                                    control={form.control}
                                    name="clientAddress"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Dirección</FormLabel>
                                            <div className="flex gap-2">
                                                <FormControl>
                                                    <div className="relative w-full">
                                                        <Input placeholder="Escribe la dirección, ej: Calle 11 # 13-50" {...field} />
                                                        {isReverseGeocoding && (
                                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </FormControl>
                                                <Button type="button" variant="secondary" onClick={handleLocateAddress} disabled={isLocating || isReverseGeocoding}>
                                                    {isLocating ? <Loader2 className="animate-spin" /> : <MapPin />}
                                                    <span className="sr-only">Ubicar en mapa</span>
                                                </Button>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="orderDetails"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Productos del Pedido</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Describe los productos, ej: 1x Acetaminofén, 2x Vitamina C" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="total"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Total a Pagar (COP)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="25000" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="paymentMethod"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel>Método de Pago</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    className="flex gap-4"
                                                >
                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="cash" id="cash" />
                                                        </FormControl>
                                                        <FormLabel htmlFor="cash" className="font-normal cursor-pointer">
                                                            Efectivo
                                                        </FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="transfer" id="transfer" />
                                                        </FormControl>
                                                        <FormLabel htmlFor="transfer" className="font-normal cursor-pointer">
                                                            Transferencia
                                                        </FormLabel>
                                                    </FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                             </div>
                             <div className="h-96 md:min-h-[500px] rounded-lg overflow-hidden border">
                                <AddressMapPicker 
                                    center={location || ocanaCenter} 
                                    onLocationChange={handleLocationChange} 
                                />
                             </div>
                           </div>
                        </div>
                        <DialogFooter className="pt-6 border-t">
                            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting || isLocating || isReverseGeocoding}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? 'Guardando...' : 'Guardar Pedido'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
