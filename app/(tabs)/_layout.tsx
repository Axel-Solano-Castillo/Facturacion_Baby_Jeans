import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

function tabIcon(name: string) {
    return ({ color, size }: { color: string; size: number }) => (
        <MaterialCommunityIcons name={name as any} size={size} color={color} />
    );
}

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#FF6B35',
                tabBarInactiveTintColor: '#666',
                tabBarStyle: {
                    backgroundColor: '#2C2C2C',
                    borderTopColor: '#FF6B35',
                    borderTopWidth: 1,
                },
                headerStyle: {
                    backgroundColor: '#2C2C2C',
                },
                headerTintColor: '#FF6B35',
                headerTitleStyle: {
                    fontWeight: 'bold',
                    fontSize: 18,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    headerTitle: 'BABYJEANS',
                    tabBarIcon: tabIcon('home'),
                }}
            />
            <Tabs.Screen
                name="telas"
                options={{
                    title: 'Telas',
                    headerTitle: 'Gestión de Telas',
                    tabBarIcon: tabIcon('palette'),
                }}
            />
            <Tabs.Screen
                name="modelos"
                options={{
                    title: 'Modelos',
                    headerTitle: 'Catálogo de Pantalones',
                    tabBarIcon: tabIcon('hanger'),
                }}
            />
            <Tabs.Screen
                name="produccion"
                options={{
                    title: 'Producción',
                    headerTitle: 'Historial de Producción',
                    tabBarIcon: tabIcon('factory'),
                }}
            />
            <Tabs.Screen
                name="inventario"
                options={{
                    title: 'Inventario',
                    headerTitle: 'Inventario por Talla',
                    tabBarIcon: tabIcon('package-variant'),
                }}
            />
            <Tabs.Screen
                name="ventas"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}
