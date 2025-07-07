'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Map as LeafletMap, LayerGroup } from 'leaflet';
import type { Order, Location, User } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Fix for default icon issue with Leaflet in React
try {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
} catch (e) {
  // This can fail in SSR, it's fine.
}

const createRoutePointIcon = (number: number, bgColor: string = 'hsl(var(--primary))') => {
    const style = `
      background-color: ${bgColor};
      color: hsl(var(--primary-foreground));
      border-radius: 9999px;
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      border: 2px solid white;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    `;
    return new L.DivIcon({
        html: `<div style="${style}">${number}</div>`,
        className: 'bg-transparent border-none',
        iconSize: [32, 32],
        iconAnchor: [16, 32], 
    });
};

const createPendingIcon = () => {
    const style = `
      background-color: hsl(var(--muted-foreground));
      border-radius: 9999px;
      width: 1.5rem;
      height: 1.5rem;
      border: 2px solid white;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    `;
    return new L.DivIcon({
        html: `<div style="${style}"></div>`,
        className: 'bg-transparent border-none',
        iconSize: [24, 24],
        iconAnchor: [12, 24],
    });
};

export interface RouteInfo {
    deliveryPerson: User;
    orders: Order[];
    color: string;
}

interface MapComponentProps {
    pharmacyLocation: Location & { lat: number; lng: number };
    routes: RouteInfo[];
    pendingOrders: Order[];
}

const MapComponent = ({ pharmacyLocation, routes, pendingOrders }: MapComponentProps) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<LeafletMap | null>(null);
    const markersRef = useRef<LayerGroup>(new L.LayerGroup());
    const polylinesRef = useRef<LayerGroup>(new L.LayerGroup());
    const { toast } = useToast();

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            const map = L.map(mapContainerRef.current).setView(
                [pharmacyLocation.lat, pharmacyLocation.lng], 13
            );
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            markersRef.current.addTo(map);
            polylinesRef.current.addTo(map);
            mapRef.current = map;
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [pharmacyLocation]);

    useEffect(() => {
        if (!mapRef.current) return;

        const map = mapRef.current;
        markersRef.current.clearLayers();
        polylinesRef.current.clearLayers();

        const allMarkersBounds: L.LatLng[] = [];

        // Pharmacy Marker
        const pharmacyMarker = L.marker([pharmacyLocation.lat, pharmacyLocation.lng])
            .bindPopup(`<b>Droguería Avenida (Punto de Partida)</b><br />${pharmacyLocation.address}`);
        markersRef.current.addLayer(pharmacyMarker);
        allMarkersBounds.push(pharmacyMarker.getLatLng());

        // Draw assigned routes
        routes.forEach(route => {
            const routePoints: L.LatLngExpression[] = [[pharmacyLocation.lat, pharmacyLocation.lng]];
            
            route.orders.forEach((order, index) => {
                if (order.deliveryLocation.lat && order.deliveryLocation.lng) {
                    const position: L.LatLngExpression = [order.deliveryLocation.lat, order.deliveryLocation.lng];
                    routePoints.push(position);
                    allMarkersBounds.push(L.latLng(position as L.LatLngTuple));

                    const marker = L.marker(position, { icon: createRoutePointIcon(index + 1, route.color) })
                        .bindPopup(`<b>Ruta: ${route.deliveryPerson.name}</b><br/>#${index + 1} - Pedido de ${order.client.fullName}<br />${order.deliveryLocation.address}`);
                    markersRef.current.addLayer(marker);
                }
            });
            
            if (routePoints.length > 1) {
                const polyline = L.polyline(routePoints, { color: route.color, weight: 5, opacity: 0.6 });
                polylinesRef.current.addLayer(polyline);
            }
        });

        // Draw pending orders as individual gray markers
        pendingOrders.forEach(order => {
             if (order.deliveryLocation.lat && order.deliveryLocation.lng) {
                const position: L.LatLngExpression = [order.deliveryLocation.lat, order.deliveryLocation.lng];
                allMarkersBounds.push(L.latLng(position as L.LatLngTuple));
                const marker = L.marker(position, { icon: createPendingIcon() })
                    .bindPopup(`<b>Pedido Pendiente</b><br />Cliente: ${order.client.fullName}<br />Dirección: ${order.deliveryLocation.address}`);
                markersRef.current.addLayer(marker);
             }
        });
        
        // Adjust map view to fit all markers
        if (allMarkersBounds.length > 0) {
            map.fitBounds(L.latLngBounds(allMarkersBounds), { padding: [50, 50] });
        } else {
             map.setView([pharmacyLocation.lat, pharmacyLocation.lng], 13);
        }

        const ordersWithoutCoords = [...routes.flatMap(r => r.orders), ...pendingOrders]
            .filter(order => !order.deliveryLocation.lat || !order.deliveryLocation.lng);
            
        if (ordersWithoutCoords.length > 0) {
            toast({
                variant: 'destructive',
                title: 'Faltan Coordenadas',
                description: `${ordersWithoutCoords.length} pedido(s) no tienen coordenadas y no se mostrarán en el mapa.`,
            });
        }
    }, [routes, pendingOrders, pharmacyLocation, toast]);

    return <div ref={mapContainerRef} className="w-full h-full rounded-lg z-0" />;
};

export default MapComponent;
