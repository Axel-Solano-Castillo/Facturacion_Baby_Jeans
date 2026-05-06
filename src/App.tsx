// src/App.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { PaperProvider } from 'react-native-paper';

// Pantallas
import HomeScreen from '../src/screens/HomeScreen';
import ModelosScreen from '../src/screens/ModelosScreen';
import ProduccionScreen from '../src/screens/ProduccionScreen';
import TelasScreen from '../src/screens/TelasScreen';
import VentasScreen from '../src/screens/VentasScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DashboardStack = () => (
    <Stack.Navigator
        screenOptions={{
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
        <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Dashboard - BABYJEANS' }}
        />
    </Stack.Navigator>
);

const TelasStack = () => (
    <Stack.Navigator
        screenOptions={{
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
        <Stack.Screen
            name="TelasDetail"
            component={TelasScreen}
            options={{ title: 'Gestión de Telas' }}
        />
    </Stack.Navigator>
);

const ModelosStack = () => (
    <Stack.Navigator
        screenOptions={{
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
        <Stack.Screen
            name="ModelosDetail"
            component={ModelosScreen}
            options={{ title: 'Catálogo de Modelos' }}
        />
    </Stack.Navigator>
);

const ProduccionStack = () => (
    <Stack.Navigator
        screenOptions={{
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
        <Stack.Screen
            name="ProduccionDetail"
            component={ProduccionScreen}
            options={{ title: 'Producción' }}
        />
    </Stack.Navigator>
);

const VentasStack = () => (
    <Stack.Navigator
        screenOptions={{
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
        <Stack.Screen
            name="VentasDetail"
            component={VentasScreen}
            options={{ title: 'PDV - Ventas' }}
        />
    </Stack.Navigator>
);

export default function App() {
    return (
        <PaperProvider>
            <NavigationContainer>
                <Tab.Navigator
                    screenOptions={({ route }) => ({
                        tabBarIcon: ({ focused, color, size }) => {
                            let iconName: string = 'home';

                            if (route.name === 'Dashboard') {
                                iconName = focused ? 'home' : 'home-outline';
                            } else if (route.name === 'Telas') {
                                iconName = focused ? 'palette' : 'palette-outline';
                            } else if (route.name === 'Modelos') {
                                iconName = focused ? 'sketch' : 'sketch';
                            } else if (route.name === 'Produccion') {
                                iconName = focused ? 'factory' : 'factory';
                            } else if (route.name === 'Ventas') {
                                iconName = focused ? 'cash-register' : 'cash-register';
                            }

                            return (
                                <MaterialCommunityIcons
                                    name={iconName as any}
                                    size={size}
                                    color={color}
                                />
                            );
                        },
                        tabBarActiveTintColor: '#FF6B35',
                        tabBarInactiveTintColor: '#666',
                        tabBarStyle: {
                            backgroundColor: '#2C2C2C',
                            borderTopColor: '#FF6B35',
                            borderTopWidth: 1,
                        },
                        headerShown: false,
                    })}
                >
                    <Tab.Screen
                        name="Dashboard"
                        component={DashboardStack}
                        options={{ title: 'Dashboard' }}
                    />
                    <Tab.Screen
                        name="Telas"
                        component={TelasStack}
                        options={{ title: 'Telas' }}
                    />
                    <Tab.Screen
                        name="Modelos"
                        component={ModelosStack}
                        options={{ title: 'Modelos' }}
                    />
                    <Tab.Screen
                        name="Produccion"
                        component={ProduccionStack}
                        options={{ title: 'Producción' }}
                    />
                    <Tab.Screen
                        name="Ventas"
                        component={VentasStack}
                        options={{ title: 'Ventas' }}
                    />
                </Tab.Navigator>
            </NavigationContainer>
        </PaperProvider>
    );
}