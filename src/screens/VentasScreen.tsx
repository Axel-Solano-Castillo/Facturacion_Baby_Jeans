import React, { useState } from 'react';
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { FAB } from 'react-native-paper';
import type { Venta } from '../types';

export default function VentasScreen() {
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [cliente, setCliente] = useState('');
    const [cedula, setCedula] = useState('');
    const [total, setTotal] = useState('');

    const registrarVenta = () => {
        if (!cliente) return;
        const subtotal = parseFloat(total) || 0;
        const nueva: Venta = {
            id: Date.now().toString(),
            numeroFactura: `F-${Date.now()}`,
            cliente: { nombre: cliente, cedula },
            items: [],
            subtotal,
            impuesto: subtotal * 0.16,
            total: subtotal * 1.16,
            metodoPago: 'efectivo',
            fecha: new Date(),
        };
        setVentas([...ventas, nueva]);
        setModalVisible(false);
        setCliente('');
        setCedula('');
        setTotal('');
    };

    return (
        <View style={styles.container}>
            {ventas.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>No hay ventas registradas</Text>
                    <Text style={styles.emptySubtext}>Toca + para registrar una venta</Text>
                </View>
            ) : (
                <FlatList
                    data={ventas}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 12 }}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>{item.numeroFactura}</Text>
                                <Text style={styles.cardTotal}>${item.total.toFixed(2)}</Text>
                            </View>
                            <Text style={styles.cardDetail}>
                                Cliente: {item.cliente.nombre}
                            </Text>
                            <Text style={styles.cardDetail}>
                                Método: {item.metodoPago}
                            </Text>
                        </View>
                    )}
                />
            )}

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => setModalVisible(true)}
            />

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nueva Venta</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nombre del cliente"
                            placeholderTextColor="#666"
                            value={cliente}
                            onChangeText={setCliente}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Cédula / RFC"
                            placeholderTextColor="#666"
                            value={cedula}
                            onChangeText={setCedula}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Subtotal ($)"
                            placeholderTextColor="#666"
                            keyboardType="numeric"
                            value={total}
                            onChangeText={setTotal}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={registrarVenta}>
                                <Text style={styles.saveButtonText}>Registrar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1A1A1A' },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#999', fontSize: 18 },
    emptySubtext: { color: '#666', fontSize: 14, marginTop: 8 },
    card: {
        backgroundColor: '#2C2C2C',
        marginBottom: 10,
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#FF6B35',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    cardTotal: { color: '#4CAF50', fontSize: 18, fontWeight: 'bold' },
    cardDetail: { color: '#ccc', fontSize: 14, marginTop: 4 },
    fab: { position: 'absolute', right: 16, bottom: 24, backgroundColor: '#FF6B35' },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: { backgroundColor: '#2C2C2C', borderRadius: 16, padding: 20 },
    modalTitle: {
        color: '#FF6B35',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#1A1A1A',
        color: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    cancelButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#666',
        alignItems: 'center',
    },
    cancelButtonText: { color: '#999', fontWeight: 'bold' },
    saveButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        marginLeft: 8,
        backgroundColor: '#FF6B35',
        alignItems: 'center',
    },
    saveButtonText: { color: '#fff', fontWeight: 'bold' },
});
