import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { FAB } from 'react-native-paper';
import type {
    InventarioItem,
    ModeloPantalon,
    RegistroProduccion,
    Tela,
} from '../types';

const KEY_PRODUCCION = '@babyjeans_produccion';
const KEY_TELAS = '@babyjeans_telas';
const KEY_MODELOS = '@babyjeans_modelos';
const KEY_INVENTARIO = '@babyjeans_inventario';

interface TallaRow {
    talla: string;
    cantidad: string;
}

interface TelaSeleccionada {
    telaId: string;
    telaNombre: string;
    metros: string;
}

function formatFecha(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export default function ProduccionScreen() {
    const [registros, setRegistros] = useState<RegistroProduccion[]>([]);
    const [modelos, setModelos] = useState<ModeloPantalon[]>([]);
    const [telas, setTelas] = useState<Tela[]>([]);
    const [modalVisible, setModalVisible] = useState(false);

    const [selectedModelo, setSelectedModelo] = useState<ModeloPantalon | null>(null);
    const [tallasRows, setTallasRows] = useState<TallaRow[]>([{ talla: '', cantidad: '' }]);
    const [telasSeleccionadas, setTelasSeleccionadas] = useState<TelaSeleccionada[]>([]);
    const [observaciones, setObservaciones] = useState('');

    useFocusEffect(
        useCallback(() => {
            loadAll();
        }, [])
    );

    const loadAll = async () => {
        try {
            const [rStr, mStr, tStr] = await Promise.all([
                AsyncStorage.getItem(KEY_PRODUCCION),
                AsyncStorage.getItem(KEY_MODELOS),
                AsyncStorage.getItem(KEY_TELAS),
            ]);
            if (rStr) setRegistros(JSON.parse(rStr));
            if (mStr) setModelos(JSON.parse(mStr));
            if (tStr) setTelas(JSON.parse(tStr));
        } catch { }
    };

    const toggleTela = (tela: Tela) => {
        const existe = telasSeleccionadas.find(t => t.telaId === tela.id);
        if (existe) {
            setTelasSeleccionadas(telasSeleccionadas.filter(t => t.telaId !== tela.id));
        } else {
            setTelasSeleccionadas([
                ...telasSeleccionadas,
                { telaId: tela.id, telaNombre: tela.nombre, metros: '' },
            ]);
        }
    };

    const updateMetrosTela = (telaId: string, metros: string) => {
        setTelasSeleccionadas(
            telasSeleccionadas.map(t => (t.telaId === telaId ? { ...t, metros } : t))
        );
    };

    const addTallaRow = () =>
        setTallasRows([...tallasRows, { talla: '', cantidad: '' }]);

    const removeTallaRow = (idx: number) =>
        setTallasRows(tallasRows.filter((_, i) => i !== idx));

    const updateTallaRow = (idx: number, field: keyof TallaRow, value: string) => {
        const updated = [...tallasRows];
        updated[idx] = { ...updated[idx], [field]: value };
        setTallasRows(updated);
    };

    const resetForm = () => {
        setSelectedModelo(null);
        setTallasRows([{ talla: '', cantidad: '' }]);
        setTelasSeleccionadas([]);
        setObservaciones('');
    };

    const registrarProduccion = async () => {
        if (!selectedModelo) {
            Alert.alert('Error', 'Selecciona un modelo de pantalón');
            return;
        }
        const tallasValidas = tallasRows.filter(r => r.talla.trim() && r.cantidad.trim());
        if (tallasValidas.length === 0) {
            Alert.alert('Error', 'Ingresa al menos una talla con su cantidad');
            return;
        }

        const telasActualizadas = [...telas];
        const telasUsadasData: RegistroProduccion['telasUsadas'] = [];

        for (const sel of telasSeleccionadas) {
            const metros = parseFloat(sel.metros) || 0;
            if (metros <= 0) continue;
            const idx = telasActualizadas.findIndex(t => t.id === sel.telaId);
            if (idx === -1) continue;
            const stockAntes = parseFloat(telasActualizadas[idx].stockMetros) || 0;
            const stockDespues = Math.max(0, stockAntes - metros);
            telasActualizadas[idx] = {
                ...telasActualizadas[idx],
                stockMetros: stockDespues.toFixed(1),
            };
            telasUsadasData.push({
                telaId: sel.telaId,
                telaNombre: sel.telaNombre,
                metros,
                stockAntes,
                stockDespues,
            });
        }

        const registro: RegistroProduccion = {
            id: Date.now().toString(),
            fecha: new Date().toISOString(),
            modeloId: selectedModelo.id,
            modeloNombre: selectedModelo.nombre,
            tallasProducidas: tallasValidas.map(r => ({
                talla: r.talla.trim(),
                cantidad: parseInt(r.cantidad) || 0,
            })),
            telasUsadas: telasUsadasData,
            observaciones: observaciones.trim(),
        };

        await AsyncStorage.setItem(KEY_TELAS, JSON.stringify(telasActualizadas));
        setTelas(telasActualizadas);

        const invStr = await AsyncStorage.getItem(KEY_INVENTARIO);
        const inventario: InventarioItem[] = invStr ? JSON.parse(invStr) : [];
        for (const tp of registro.tallasProducidas) {
            const key = `${selectedModelo.id}_${tp.talla}`;
            const idx = inventario.findIndex(i => i.id === key);
            if (idx >= 0) {
                inventario[idx].cantidad += tp.cantidad;
            } else {
                inventario.push({
                    id: key,
                    modeloId: selectedModelo.id,
                    modeloNombre: selectedModelo.nombre,
                    talla: tp.talla,
                    cantidad: tp.cantidad,
                });
            }
        }
        await AsyncStorage.setItem(KEY_INVENTARIO, JSON.stringify(inventario));

        const nuevos = [registro, ...registros];
        setRegistros(nuevos);
        await AsyncStorage.setItem(KEY_PRODUCCION, JSON.stringify(nuevos));

        resetForm();
        setModalVisible(false);
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.lista}>
                {registros.length === 0 && (
                    <View style={styles.empty}>
                        <MaterialCommunityIcons name="factory" size={64} color="#444" />
                        <Text style={styles.emptyText}>Sin registros de producción</Text>
                        <Text style={styles.emptySubtext}>Toca + para registrar una producción</Text>
                    </View>
                )}
                {registros.map(reg => (
                    <View key={reg.id} style={styles.card}>
                        <View style={styles.cardHead}>
                            <MaterialCommunityIcons name="factory" size={18} color="#FF6B35" />
                            <Text style={styles.cardModelo}>{reg.modeloNombre}</Text>
                            <Text style={styles.cardFecha}>{formatFecha(reg.fecha)}</Text>
                        </View>

                        <View style={styles.tallasRow}>
                            {reg.tallasProducidas.map((tp, i) => (
                                <View key={i} style={styles.tallaBadge}>
                                    <Text style={styles.tallaBadgeText}>
                                        T{tp.talla}: {tp.cantidad} pzas
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {reg.telasUsadas.map((tu, i) => (
                            <View key={i} style={styles.logRow}>
                                <MaterialCommunityIcons
                                    name="scissors-cutting"
                                    size={14}
                                    color="#FF6B35"
                                />
                                <Text style={styles.logText}>
                                    Se usaron{' '}
                                    <Text style={styles.logBold}>{tu.metros} m</Text> de{' '}
                                    <Text style={styles.logBold}>{tu.telaNombre}</Text>.
                                    Quedan{' '}
                                    <Text style={[styles.logBold, { color: '#06A77D' }]}>
                                        {tu.stockDespues.toFixed(1)} m
                                    </Text>
                                </Text>
                            </View>
                        ))}

                        {!!reg.observaciones && (
                            <Text style={styles.cardObs}>{reg.observaciones}</Text>
                        )}
                    </View>
                ))}
                <View style={{ height: 100 }} />
            </ScrollView>

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => {
                    loadAll();
                    setModalVisible(true);
                }}
            />

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Registrar Producción</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setModalVisible(false);
                                    resetForm();
                                }}
                            >
                                <MaterialCommunityIcons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
                            {/* Seleccionar modelo */}
                            <Text style={styles.sectionLabel}>Modelo de pantalón *</Text>
                            {modelos.length === 0 ? (
                                <Text style={styles.sinDatos}>
                                    No hay modelos. Agrega uno en la sección Modelos.
                                </Text>
                            ) : (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.chipRow}
                                >
                                    {modelos.map(m => (
                                        <TouchableOpacity
                                            key={m.id}
                                            style={[
                                                styles.modeloChip,
                                                selectedModelo?.id === m.id && styles.modeloChipActive,
                                            ]}
                                            onPress={() => setSelectedModelo(m)}
                                        >
                                            <Text
                                                style={[
                                                    styles.modeloChipText,
                                                    selectedModelo?.id === m.id &&
                                                    styles.modeloChipTextActive,
                                                ]}
                                            >
                                                {m.nombre}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}

                            {/* Tallas producidas */}
                            <Text style={styles.sectionLabel}>Cantidades por talla *</Text>
                            {tallasRows.map((row, idx) => (
                                <View key={idx} style={styles.tallaInputRow}>
                                    <TextInput
                                        style={[styles.input, styles.inputTalla]}
                                        placeholder="Talla (ej: 30)"
                                        placeholderTextColor="#999"
                                        value={row.talla}
                                        onChangeText={v => updateTallaRow(idx, 'talla', v)}
                                    />
                                    <TextInput
                                        style={[styles.input, styles.inputCantidad]}
                                        placeholder="Piezas"
                                        placeholderTextColor="#999"
                                        keyboardType="numeric"
                                        value={row.cantidad}
                                        onChangeText={v => updateTallaRow(idx, 'cantidad', v)}
                                    />
                                    {tallasRows.length > 1 && (
                                        <TouchableOpacity
                                            style={styles.removeBtn}
                                            onPress={() => removeTallaRow(idx)}
                                        >
                                            <MaterialCommunityIcons
                                                name="close-circle"
                                                size={22}
                                                color="#FF4444"
                                            />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                            <TouchableOpacity style={styles.addRowBtn} onPress={addTallaRow}>
                                <MaterialCommunityIcons name="plus" size={16} color="#004E89" />
                                <Text style={styles.addRowText}>Agregar talla</Text>
                            </TouchableOpacity>

                            {/* Telas utilizadas */}
                            <Text style={styles.sectionLabel}>Telas utilizadas</Text>
                            {telas.length === 0 ? (
                                <Text style={styles.sinDatos}>
                                    No hay telas. Agrega telas en la sección Telas.
                                </Text>
                            ) : (
                                <>
                                    <Text style={styles.hint}>
                                        Toca una tela para agregarla:
                                    </Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={styles.chipRow}
                                    >
                                        {telas.map(t => {
                                            const seleccionada = telasSeleccionadas.find(
                                                s => s.telaId === t.id
                                            );
                                            return (
                                                <TouchableOpacity
                                                    key={t.id}
                                                    style={[
                                                        styles.telaChip,
                                                        seleccionada && styles.telaChipActive,
                                                    ]}
                                                    onPress={() => toggleTela(t)}
                                                >
                                                    <View
                                                        style={[
                                                            styles.telaChipDot,
                                                            { backgroundColor: t.color || '#888' },
                                                        ]}
                                                    />
                                                    <View>
                                                        <Text
                                                            style={[
                                                                styles.telaChipNombre,
                                                                seleccionada && styles.telaChipNombreActive,
                                                            ]}
                                                        >
                                                            {t.nombre}
                                                        </Text>
                                                        <Text style={styles.telaChipStock}>
                                                            {t.stockMetros ? `${t.stockMetros} m disp.` : 'Sin stock'}
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>

                                    {telasSeleccionadas.map(sel => (
                                        <View key={sel.telaId} style={styles.telaMetrosRow}>
                                            <View style={styles.telaMetrosLabel}>
                                                <MaterialCommunityIcons
                                                    name="scissors-cutting"
                                                    size={16}
                                                    color="#FF6B35"
                                                />
                                                <Text style={styles.telaMetrosNombre}>
                                                    {sel.telaNombre}
                                                </Text>
                                            </View>
                                            <TextInput
                                                style={[styles.input, styles.inputMetros]}
                                                placeholder="Metros"
                                                placeholderTextColor="#999"
                                                keyboardType="decimal-pad"
                                                value={sel.metros}
                                                onChangeText={v => updateMetrosTela(sel.telaId, v)}
                                            />
                                            <TouchableOpacity
                                                onPress={() =>
                                                    setTelasSeleccionadas(
                                                        telasSeleccionadas.filter(
                                                            t => t.telaId !== sel.telaId
                                                        )
                                                    )
                                                }
                                            >
                                                <MaterialCommunityIcons
                                                    name="close-circle"
                                                    size={22}
                                                    color="#FF4444"
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </>
                            )}

                            {/* Observaciones */}
                            <Text style={styles.sectionLabel}>Observaciones</Text>
                            <TextInput
                                style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
                                placeholder="Notas adicionales..."
                                placeholderTextColor="#999"
                                value={observaciones}
                                onChangeText={setObservaciones}
                                multiline
                            />

                            <TouchableOpacity
                                style={styles.submitBtn}
                                onPress={registrarProduccion}
                            >
                                <MaterialCommunityIcons name="check-bold" size={20} color="#FFF" />
                                <Text style={styles.submitBtnText}>Registrar Producción</Text>
                            </TouchableOpacity>
                            <View style={{ height: 24 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1A1A1A' },
    lista: { flex: 1, padding: 12 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
    emptyText: { color: '#777', fontSize: 18, marginTop: 16 },
    emptySubtext: { color: '#555', fontSize: 14, marginTop: 8 },
    card: {
        backgroundColor: '#2C2C2C',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#FF6B35',
    },
    cardHead: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    cardModelo: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    cardFecha: { color: '#888', fontSize: 12 },
    tallasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
    tallaBadge: {
        backgroundColor: '#3A3A3A',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    tallaBadgeText: { color: '#DDD', fontSize: 12, fontWeight: '600' },
    logRow: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    logText: { color: '#AAA', fontSize: 13, flex: 1, lineHeight: 18 },
    logBold: { fontWeight: 'bold', color: '#DDD' },
    cardObs: { color: '#888', fontSize: 12, marginTop: 8, fontStyle: 'italic' },
    fab: { position: 'absolute', right: 16, bottom: 24, backgroundColor: '#FF6B35' },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '95%',
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
    form: { paddingHorizontal: 16, paddingVertical: 10 },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#444',
        marginTop: 12,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sinDatos: { color: '#AAA', fontSize: 13, fontStyle: 'italic', marginBottom: 8 },
    hint: { color: '#888', fontSize: 12, marginBottom: 6 },
    chipRow: { marginBottom: 8 },
    modeloChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#EEE',
        marginRight: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    modeloChipActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
    modeloChipText: { color: '#555', fontWeight: '600', fontSize: 13 },
    modeloChipTextActive: { color: '#FFF' },
    tallaInputRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#2C2C2C',
        backgroundColor: '#FAFAFA',
        marginBottom: 0,
    },
    inputTalla: { flex: 1 },
    inputCantidad: { flex: 1 },
    removeBtn: { paddingHorizontal: 2 },
    addRowBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        marginBottom: 4,
    },
    addRowText: { color: '#004E89', fontWeight: '600', fontSize: 13 },
    telaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#EEE',
        marginRight: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    telaChipActive: { backgroundColor: '#E3F2FD', borderColor: '#004E89' },
    telaChipDot: { width: 14, height: 14, borderRadius: 7 },
    telaChipNombre: { color: '#555', fontWeight: '600', fontSize: 13 },
    telaChipNombreActive: { color: '#004E89' },
    telaChipStock: { color: '#999', fontSize: 11, marginTop: 1 },
    telaMetrosRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
        backgroundColor: '#F0F8FF',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    telaMetrosLabel: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    telaMetrosNombre: { color: '#2C2C2C', fontWeight: '600', fontSize: 13, flex: 1 },
    inputMetros: { width: 80 },
    submitBtn: {
        backgroundColor: '#FF6B35',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
