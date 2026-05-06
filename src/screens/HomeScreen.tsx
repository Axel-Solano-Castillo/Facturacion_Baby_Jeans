import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

interface Stats {
    telas: number;
    modelos: number;
    piezasInventario: number;
    registrosProduccion: number;
}

function StatsCard({
    title,
    value,
    icon,
    color,
}: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
}) {
    return (
        <Card style={[styles.statsCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
            <Card.Content style={styles.statsCardContent}>
                <View style={styles.statsHeader}>
                    <MaterialCommunityIcons name={icon as any} size={32} color={color} />
                    <Text style={styles.statsTitle}>{title}</Text>
                </View>
                <Text style={[styles.statsValue, { color }]}>{value}</Text>
            </Card.Content>
        </Card>
    );
}

export default function HomeScreen() {
    const [stats, setStats] = useState<Stats>({
        telas: 0,
        modelos: 0,
        piezasInventario: 0,
        registrosProduccion: 0,
    });

    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                try {
                    const [mStr, tStr, invStr, prodStr] = await Promise.all([
                        AsyncStorage.getItem('@babyjeans_modelos'),
                        AsyncStorage.getItem('@babyjeans_telas'),
                        AsyncStorage.getItem('@babyjeans_inventario'),
                        AsyncStorage.getItem('@babyjeans_produccion'),
                    ]);
                    const modelos = mStr ? JSON.parse(mStr) : [];
                    const telas = tStr ? JSON.parse(tStr) : [];
                    const inventario = invStr ? JSON.parse(invStr) : [];
                    const produccion = prodStr ? JSON.parse(prodStr) : [];
                    const piezas = inventario.reduce(
                        (sum: number, i: { cantidad: number }) => sum + i.cantidad,
                        0
                    );
                    setStats({
                        telas: telas.length,
                        modelos: modelos.length,
                        piezasInventario: piezas,
                        registrosProduccion: produccion.length,
                    });
                } catch { }
            };
            load();
        }, [])
    );

    return (
        <ScrollView style={styles.container}>
            <View style={styles.statsContainer}>
                <StatsCard
                    title="Telas en catálogo"
                    value={stats.telas}
                    icon="palette"
                    color="#FF6B35"
                />
                <StatsCard
                    title="Modelos de pantalón"
                    value={stats.modelos}
                    icon="hanger"
                    color="#004E89"
                />
                <StatsCard
                    title="Piezas en inventario"
                    value={stats.piezasInventario}
                    icon="package-variant"
                    color="#F77F00"
                />
                <StatsCard
                    title="Registros de producción"
                    value={stats.registrosProduccion}
                    icon="factory"
                    color="#06A77D"
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Módulos</Text>
                <View style={styles.quickGrid}>
                    <View style={[styles.quickCard, { backgroundColor: '#FF6B35' }]}>
                        <MaterialCommunityIcons name="palette" size={28} color="#FFF" />
                        <Text style={styles.quickLabel}>Telas</Text>
                        <Text style={styles.quickSub}>Stock en metros</Text>
                    </View>
                    <View style={[styles.quickCard, { backgroundColor: '#004E89' }]}>
                        <MaterialCommunityIcons name="hanger" size={28} color="#FFF" />
                        <Text style={styles.quickLabel}>Modelos</Text>
                        <Text style={styles.quickSub}>Catálogo con fotos</Text>
                    </View>
                    <View style={[styles.quickCard, { backgroundColor: '#F77F00' }]}>
                        <MaterialCommunityIcons name="factory" size={28} color="#FFF" />
                        <Text style={styles.quickLabel}>Producción</Text>
                        <Text style={styles.quickSub}>Historial y telas</Text>
                    </View>
                    <View style={[styles.quickCard, { backgroundColor: '#06A77D' }]}>
                        <MaterialCommunityIcons name="package-variant" size={28} color="#FFF" />
                        <Text style={styles.quickLabel}>Inventario</Text>
                        <Text style={styles.quickSub}>Por modelo y talla</Text>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Card style={styles.infoCard}>
                    <Card.Content style={styles.infoRow}>
                        <MaterialCommunityIcons
                            name="information-outline"
                            size={20}
                            color="#004E89"
                        />
                        <Text style={styles.infoText}>
                            Al registrar una producción se descuentan automáticamente los metros
                            de tela usados y se actualiza el inventario por talla.
                        </Text>
                    </Card.Content>
                </Card>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    statsContainer: { paddingHorizontal: 12, paddingVertical: 16, gap: 12 },
    statsCard: { backgroundColor: '#FFF', borderRadius: 8 },
    statsCardContent: { paddingVertical: 12 },
    statsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    statsTitle: { fontSize: 12, color: '#666', flex: 1 },
    statsValue: { fontSize: 28, fontWeight: 'bold' },
    section: { paddingHorizontal: 12, marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C2C2C', marginBottom: 12 },
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    quickCard: {
        width: '47%',
        borderRadius: 10,
        paddingVertical: 16,
        paddingHorizontal: 14,
        gap: 4,
    },
    quickLabel: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    quickSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
    infoCard: { backgroundColor: '#E8F0FE', borderRadius: 8 },
    infoRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
    infoText: { fontSize: 13, color: '#444', flex: 1, lineHeight: 20 },
});
