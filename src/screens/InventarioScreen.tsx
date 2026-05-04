import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import type { InventarioItem, ModeloPantalon } from '../types';

const KEY_INVENTARIO = '@babyjeans_inventario';
const KEY_MODELOS = '@babyjeans_modelos';

interface ModeloConStock {
    modelo: ModeloPantalon;
    tallas: InventarioItem[];
    totalPiezas: number;
}

export default function InventarioScreen() {
    const [grupos, setGrupos] = useState<ModeloConStock[]>([]);
    const [inventario, setInventario] = useState<InventarioItem[]>([]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        try {
            const [invStr, modStr] = await Promise.all([
                AsyncStorage.getItem(KEY_INVENTARIO),
                AsyncStorage.getItem(KEY_MODELOS),
            ]);
            const inv: InventarioItem[] = invStr ? JSON.parse(invStr) : [];
            const mods: ModeloPantalon[] = modStr ? JSON.parse(modStr) : [];
            setInventario(inv);
            buildGrupos(inv, mods);
        } catch { }
    };

    const buildGrupos = (inv: InventarioItem[], mods: ModeloPantalon[]) => {
        const modelosConItems: ModeloConStock[] = mods
            .map(m => {
                const tallas = inv
                    .filter(i => i.modeloId === m.id)
                    .sort((a, b) => a.talla.localeCompare(b.talla));
                const totalPiezas = tallas.reduce((s, t) => s + t.cantidad, 0);
                return { modelo: m, tallas, totalPiezas };
            })
            .filter(g => g.tallas.length > 0);

        const sinModelo = inv
            .filter(i => !mods.find(m => m.id === i.modeloId))
            .reduce<ModeloConStock | null>((acc, item) => {
                if (!acc) {
                    return {
                        modelo: {
                            id: '__sin_modelo__',
                            nombre: 'Sin modelo asignado',
                            descripcion: '',
                            tipo: '',
                            tallas: '',
                            precioBase: '',
                            activo: true,
                            fechaCreacion: '',
                        },
                        tallas: [item],
                        totalPiezas: item.cantidad,
                    };
                }
                return {
                    ...acc,
                    tallas: [...acc.tallas, item],
                    totalPiezas: acc.totalPiezas + item.cantidad,
                };
            }, null);

        setGrupos(sinModelo ? [...modelosConItems, sinModelo] : modelosConItems);
    };

    const ajustarCantidad = async (item: InventarioItem, delta: number) => {
        const nuevaCantidad = Math.max(0, item.cantidad + delta);
        const actualizado = inventario.map(i =>
            i.id === item.id ? { ...i, cantidad: nuevaCantidad } : i
        );
        setInventario(actualizado);
        await AsyncStorage.setItem(KEY_INVENTARIO, JSON.stringify(actualizado));

        const modsStr = await AsyncStorage.getItem(KEY_MODELOS);
        const mods: ModeloPantalon[] = modsStr ? JSON.parse(modsStr) : [];
        buildGrupos(actualizado, mods);
    };

    const confirmarEliminarItem = (item: InventarioItem) => {
        Alert.alert(
            'Eliminar registro',
            `¿Eliminar Talla ${item.talla} de ${item.modeloNombre}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        const actualizado = inventario.filter(i => i.id !== item.id);
                        setInventario(actualizado);
                        await AsyncStorage.setItem(
                            KEY_INVENTARIO,
                            JSON.stringify(actualizado)
                        );
                        const modsStr = await AsyncStorage.getItem(KEY_MODELOS);
                        const mods: ModeloPantalon[] = modsStr ? JSON.parse(modsStr) : [];
                        buildGrupos(actualizado, mods);
                    },
                },
            ]
        );
    };

    const totalGeneral = grupos.reduce((s, g) => s + g.totalPiezas, 0);

    return (
        <View style={styles.container}>
            {grupos.length === 0 ? (
                <View style={styles.empty}>
                    <MaterialCommunityIcons name="package-variant" size={64} color="#CCC" />
                    <Text style={styles.emptyText}>Inventario vacío</Text>
                    <Text style={styles.emptySubtext}>
                        Registra producciones para ver el inventario aquí
                    </Text>
                </View>
            ) : (
                <ScrollView style={styles.scroll}>
                    <View style={styles.resumenCard}>
                        <MaterialCommunityIcons name="package-variant" size={28} color="#FFF" />
                        <View>
                            <Text style={styles.resumenValor}>{totalGeneral}</Text>
                            <Text style={styles.resumenLabel}>piezas en total</Text>
                        </View>
                        <View>
                            <Text style={styles.resumenValor}>{grupos.length}</Text>
                            <Text style={styles.resumenLabel}>modelos</Text>
                        </View>
                    </View>

                    {grupos.map(g => (
                        <View key={g.modelo.id} style={styles.grupoCard}>
                            <View style={styles.grupoHeader}>
                                {g.modelo.foto ? (
                                    <Image
                                        source={{ uri: g.modelo.foto }}
                                        style={styles.grupoFoto}
                                    />
                                ) : (
                                    <View style={styles.grupoFotoPlaceholder}>
                                        <MaterialCommunityIcons
                                            name="hanger"
                                            size={24}
                                            color="#999"
                                        />
                                    </View>
                                )}
                                <View style={styles.grupoInfo}>
                                    <Text style={styles.grupoNombre}>{g.modelo.nombre}</Text>
                                    {!!g.modelo.tipo && (
                                        <View style={styles.tipoBadge}>
                                            <Text style={styles.tipoBadgeText}>{g.modelo.tipo}</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.grupoTotal}>
                                    <Text style={styles.grupoTotalValor}>{g.totalPiezas}</Text>
                                    <Text style={styles.grupoTotalLabel}>piezas</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            {g.tallas.map(item => (
                                <View key={item.id} style={styles.tallaRow}>
                                    <View style={styles.tallaBadge}>
                                        <Text style={styles.tallaBadgeText}>T {item.talla}</Text>
                                    </View>
                                    <Text style={styles.tallaCantidad}>
                                        {item.cantidad} piezas
                                    </Text>
                                    <View style={styles.ajusteControls}>
                                        <TouchableOpacity
                                            style={styles.ajusteBtn}
                                            onPress={() => ajustarCantidad(item, -1)}
                                        >
                                            <MaterialCommunityIcons
                                                name="minus"
                                                size={16}
                                                color="#666"
                                            />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.ajusteBtn, styles.ajusteBtnPlus]}
                                            onPress={() => ajustarCantidad(item, 1)}
                                        >
                                            <MaterialCommunityIcons
                                                name="plus"
                                                size={16}
                                                color="#FFF"
                                            />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.eliminarBtn}
                                            onPress={() => confirmarEliminarItem(item)}
                                        >
                                            <MaterialCommunityIcons
                                                name="trash-can-outline"
                                                size={16}
                                                color="#FF4444"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ))}
                    <View style={{ height: 24 }} />
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { fontSize: 18, color: '#999', marginTop: 16 },
    emptySubtext: { fontSize: 14, color: '#BBB', marginTop: 8, textAlign: 'center' },
    scroll: { flex: 1, padding: 12 },
    resumenCard: {
        backgroundColor: '#2C2C2C',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        marginBottom: 16,
    },
    resumenValor: { color: '#FF6B35', fontSize: 24, fontWeight: 'bold' },
    resumenLabel: { color: '#AAA', fontSize: 12 },
    grupoCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    grupoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
    },
    grupoFoto: { width: 56, height: 56, borderRadius: 8 },
    grupoFotoPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 8,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    grupoInfo: { flex: 1 },
    grupoNombre: { fontSize: 15, fontWeight: 'bold', color: '#2C2C2C', marginBottom: 4 },
    tipoBadge: {
        backgroundColor: '#FF6B35',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        alignSelf: 'flex-start',
    },
    tipoBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    grupoTotal: { alignItems: 'center' },
    grupoTotalValor: { fontSize: 22, fontWeight: 'bold', color: '#004E89' },
    grupoTotalLabel: { fontSize: 11, color: '#888' },
    divider: { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 14 },
    tallaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
        gap: 10,
    },
    tallaBadge: {
        backgroundColor: '#E8F0FE',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        minWidth: 60,
        alignItems: 'center',
    },
    tallaBadgeText: { color: '#004E89', fontWeight: 'bold', fontSize: 13 },
    tallaCantidad: { flex: 1, fontSize: 14, color: '#2C2C2C', fontWeight: '600' },
    ajusteControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    ajusteBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#EEE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ajusteBtnPlus: { backgroundColor: '#004E89' },
    eliminarBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
