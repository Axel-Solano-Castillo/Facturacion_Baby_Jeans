import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button, Chip, FAB, Searchbar, Text } from 'react-native-paper';
import type { Tela } from '../types';

const STORAGE_KEY = '@babyjeans_telas';
const ALERTA_METROS = 50;

export default function TelasScreen() {
    const [telas, setTelas] = useState<Tela[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('todos');
    const [modalVisible, setModalVisible] = useState(false);

    const [nombre, setNombre] = useState('');
    const [composicion, setComposicion] = useState('');
    const [colorHex, setColorHex] = useState('#1A5490');
    const [precioMetro, setPrecioMetro] = useState('');
    const [stockMetros, setStockMetros] = useState('');
    const [proveedor, setProveedor] = useState('');

    useEffect(() => {
        loadTelas();
    }, []);

    const loadTelas = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) setTelas(JSON.parse(stored));
        } catch { }
    };

    const persistTelas = async (list: Tela[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch { }
    };

    const guardarTela = async () => {
        if (!nombre.trim()) {
            Alert.alert('Error', 'El nombre de la tela es requerido');
            return;
        }
        const nueva: Tela = {
            id: Date.now().toString(),
            nombre: nombre.trim(),
            color: colorHex.trim() || '#888888',
            composicion: composicion.trim(),
            precioMetro: precioMetro.trim(),
            stockMetros: stockMetros.trim(),
            proveedor: proveedor.trim(),
        };
        const actualizado = [nueva, ...telas];
        setTelas(actualizado);
        await persistTelas(actualizado);
        resetForm();
        setModalVisible(false);
    };

    const eliminarTela = (id: string) => {
        Alert.alert('Eliminar tela', '¿Eliminar esta tela del catálogo?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    const actualizado = telas.filter(t => t.id !== id);
                    setTelas(actualizado);
                    await persistTelas(actualizado);
                },
            },
        ]);
    };

    const resetForm = () => {
        setNombre('');
        setComposicion('');
        setColorHex('#1A5490');
        setPrecioMetro('');
        setStockMetros('');
        setProveedor('');
    };

    const bajosDeStock = (t: Tela) => {
        const s = parseFloat(t.stockMetros);
        return !isNaN(s) && s < ALERTA_METROS;
    };

    const filteredTelas = telas.filter(t => {
        const matchSearch = t.nombre.toLowerCase().includes(searchQuery.toLowerCase());
        const matchFilter =
            filter === 'todos' ||
            (filter === 'bajo-stock' && bajosDeStock(t)) ||
            (filter === 'disponible' && !bajosDeStock(t));
        return matchSearch && matchFilter;
    });

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Buscar tela..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                />
            </View>

            <View style={styles.filtersContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Chip
                        selected={filter === 'todos'}
                        onPress={() => setFilter('todos')}
                        style={styles.chip}
                        textStyle={styles.chipText}
                    >
                        Todos
                    </Chip>
                    <Chip
                        selected={filter === 'disponible'}
                        onPress={() => setFilter('disponible')}
                        style={styles.chip}
                        textStyle={styles.chipText}
                    >
                        Disponible
                    </Chip>
                    <Chip
                        selected={filter === 'bajo-stock'}
                        onPress={() => setFilter('bajo-stock')}
                        style={[
                            styles.chip,
                            filter === 'bajo-stock' && { backgroundColor: '#FFEBEE' },
                        ]}
                        textStyle={styles.chipText}
                    >
                        Bajo Stock
                    </Chip>
                </ScrollView>
            </View>

            <ScrollView style={styles.content}>
                {filteredTelas.length === 0 && (
                    <View style={styles.empty}>
                        <MaterialCommunityIcons name="palette-outline" size={64} color="#CCC" />
                        <Text style={styles.emptyText}>Sin telas registradas</Text>
                        <Text style={styles.emptySubtext}>Toca + para agregar una tela</Text>
                    </View>
                )}
                {filteredTelas.map(tela => {
                    const alerta = bajosDeStock(tela);
                    return (
                        <View
                            key={tela.id}
                            style={[
                                styles.telaCard,
                                alerta && styles.telaCardAlerta,
                            ]}
                        >
                            <View style={styles.telaHeader}>
                                <View
                                    style={[styles.colorBox, { backgroundColor: tela.color || '#888' }]}
                                />
                                <View style={styles.telaInfo}>
                                    <Text style={styles.telaNombre}>{tela.nombre}</Text>
                                    {!!tela.composicion && (
                                        <Text style={styles.telaComposicion}>{tela.composicion}</Text>
                                    )}
                                    {!!tela.proveedor && (
                                        <View style={styles.proveedorRow}>
                                            <MaterialCommunityIcons
                                                name="truck-outline"
                                                size={12}
                                                color="#888"
                                            />
                                            <Text style={styles.proveedorText}>{tela.proveedor}</Text>
                                        </View>
                                    )}
                                </View>
                                {alerta && (
                                    <MaterialCommunityIcons
                                        name="alert-circle"
                                        size={24}
                                        color="#FF6B35"
                                    />
                                )}
                            </View>

                            <View style={styles.telaDetails}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.label}>Precio/metro</Text>
                                    <Text style={styles.value}>
                                        {tela.precioMetro ? `$${tela.precioMetro}` : '—'}
                                    </Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.label}>Stock</Text>
                                    <Text
                                        style={[
                                            styles.value,
                                            { color: alerta ? '#FF6B35' : '#06A77D' },
                                        ]}
                                    >
                                        {tela.stockMetros ? `${tela.stockMetros} m` : '—'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.telaActions}>
                                <Button
                                    mode="text"
                                    compact
                                    textColor="#FF4444"
                                    onPress={() => eliminarTela(tela.id)}
                                >
                                    Eliminar
                                </Button>
                            </View>
                        </View>
                    );
                })}
                <View style={{ height: 100 }} />
            </ScrollView>

            <FAB icon="plus" style={styles.fab} onPress={() => setModalVisible(true)} />

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nueva Tela</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setModalVisible(false);
                                    resetForm();
                                }}
                            >
                                <MaterialCommunityIcons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm} keyboardShouldPersistTaps="handled">
                            <TextInput
                                placeholder="Nombre de la tela *"
                                style={styles.input}
                                placeholderTextColor="#999"
                                value={nombre}
                                onChangeText={setNombre}
                            />
                            <TextInput
                                placeholder="Proveedor"
                                style={styles.input}
                                placeholderTextColor="#999"
                                value={proveedor}
                                onChangeText={setProveedor}
                            />
                            <TextInput
                                placeholder="Composición (ej: Denim 100%, Algodón-Poliéster)"
                                style={styles.input}
                                placeholderTextColor="#999"
                                value={composicion}
                                onChangeText={setComposicion}
                            />
                            <TextInput
                                placeholder="Color en hex (ej: #1A5490)"
                                style={styles.input}
                                placeholderTextColor="#999"
                                value={colorHex}
                                onChangeText={setColorHex}
                                autoCapitalize="none"
                            />
                            <TextInput
                                placeholder="Precio por metro ($)"
                                style={styles.input}
                                keyboardType="decimal-pad"
                                placeholderTextColor="#999"
                                value={precioMetro}
                                onChangeText={setPrecioMetro}
                            />
                            <TextInput
                                placeholder="Stock inicial (metros)"
                                style={styles.input}
                                keyboardType="decimal-pad"
                                placeholderTextColor="#999"
                                value={stockMetros}
                                onChangeText={setStockMetros}
                            />

                            <Button
                                mode="contained"
                                style={styles.submitButton}
                                onPress={guardarTela}
                            >
                                Agregar Tela
                            </Button>
                            <View style={{ height: 20 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    searchContainer: { paddingHorizontal: 12, paddingVertical: 8 },
    searchBar: { backgroundColor: '#FFF', borderRadius: 8 },
    filtersContainer: { paddingHorizontal: 12, paddingBottom: 8 },
    chip: { marginRight: 8, backgroundColor: '#E8E8E8' },
    chipText: { fontSize: 12 },
    content: { flex: 1, paddingHorizontal: 12, paddingTop: 4 },
    empty: { justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
    emptyText: { fontSize: 18, color: '#999', marginTop: 16 },
    emptySubtext: { fontSize: 14, color: '#BBB', marginTop: 8 },
    telaCard: {
        backgroundColor: '#FFF',
        borderRadius: 10,
        marginBottom: 12,
        padding: 14,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
    },
    telaCardAlerta: {
        borderLeftColor: '#FF6B35',
        borderLeftWidth: 4,
    },
    telaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    colorBox: {
        width: 52,
        height: 52,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#DDD',
    },
    telaInfo: { flex: 1 },
    telaNombre: { fontSize: 15, fontWeight: 'bold', color: '#2C2C2C' },
    telaComposicion: { fontSize: 12, color: '#666', marginTop: 2 },
    proveedorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    proveedorText: { fontSize: 12, color: '#888' },
    telaDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#EEE',
    },
    detailItem: { flex: 1 },
    label: { fontSize: 11, color: '#999', marginBottom: 2 },
    value: { fontSize: 16, fontWeight: 'bold', color: '#2C2C2C' },
    telaActions: { flexDirection: 'row', justifyContent: 'flex-end' },
    fab: { position: 'absolute', right: 16, bottom: 24, backgroundColor: '#FF6B35' },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '92%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C2C2C' },
    modalForm: { paddingHorizontal: 16, paddingVertical: 12 },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
        fontSize: 14,
        color: '#2C2C2C',
        backgroundColor: '#FAFAFA',
    },
    submitButton: {
        marginTop: 4,
        backgroundColor: '#FF6B35',
        borderRadius: 8,
    },
});
