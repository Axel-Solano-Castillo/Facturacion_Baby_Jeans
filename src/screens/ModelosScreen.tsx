import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Chip, FAB, Searchbar } from 'react-native-paper';
import type { Tela } from '../types';

const STORAGE_KEY = '@babyjeans_modelos';
const TELAS_KEY = '@babyjeans_telas';
const TIPOS = ['Jeans', 'Bermuda', 'Jogger', 'Cargo', 'Otro'];
const TALLAS_NUMERICAS = ['5', '7', '9', '11', '13', '15', '17'];
const TALLAS_ESPECIALES = ['X', 'XL', 'XXL'];

interface TelaAsociada {
    telaId: string;
    telaNombre: string;
    precioMetro: string;
    metros: string;
}

interface ModeloPantalon {
    id: string;
    nombre: string;
    descripcion: string;
    tipo: string;
    tallasNumericas: string[];
    tallasEspeciales: string[];
    costoProces: string;
    telasAsociadas: TelaAsociada[];
    precioVenta: string;
    foto?: string;
    activo: boolean;
    fechaCreacion: string;
}

function calcCostos(
    telasAsociadas: TelaAsociada[],
    costoProces: string,
    precioVenta: string
) {
    const costoTela = telasAsociadas.reduce((sum, t) => {
        return sum + (parseFloat(t.precioMetro) || 0) * (parseFloat(t.metros) || 0);
    }, 0);
    const cProces = parseFloat(costoProces) || 0;
    const costoTotal = costoTela + cProces;
    const pventa = parseFloat(precioVenta) || 0;
    const ganancia = pventa - costoTotal;
    const conviene = pventa > 0 && costoTotal > 0 && ganancia > 0;
    const margen = costoTotal > 0 && pventa > 0 ? (ganancia / pventa) * 100 : null;
    return { costoTela, costoProces: cProces, costoTotal, pventa, ganancia, conviene, margen };
}

export default function ModelosScreen() {
    const [modelos, setModelos] = useState<ModeloPantalon[]>([]);
    const [telas, setTelas] = useState<Tela[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('activos');
    const [modalVisible, setModalVisible] = useState(false);

    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [tipo, setTipo] = useState('Jeans');
    const [tallasNumericas, setTallasNumericas] = useState<string[]>([]);
    const [tallasEspeciales, setTallasEspeciales] = useState<string[]>([]);
    const [costoProces, setCostoProces] = useState('');
    const [telasAsociadas, setTelasAsociadas] = useState<TelaAsociada[]>([]);
    const [precioVenta, setPrecioVenta] = useState('');
    const [foto, setFoto] = useState<string | undefined>();

    useFocusEffect(
        useCallback(() => {
            loadAll();
        }, [])
    );

    const loadAll = async () => {
        try {
            const [mStr, tStr] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEY),
                AsyncStorage.getItem(TELAS_KEY),
            ]);
            if (mStr) setModelos(JSON.parse(mStr));
            if (tStr) setTelas(JSON.parse(tStr));
        } catch { }
    };

    const persistModelos = async (list: ModeloPantalon[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch { }
    };

    const showImageOptions = () => {
        Alert.alert('Foto del pantalón', 'Selecciona la fuente', [
            { text: 'Tomar foto', onPress: () => pickImage(true) },
            { text: 'Elegir de galería', onPress: () => pickImage(false) },
            { text: 'Cancelar', style: 'cancel' },
        ]);
    };

    const pickImage = async (fromCamera: boolean) => {
        if (fromCamera) {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara');
                return;
            }
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });
            if (!result.canceled) setFoto(result.assets[0].uri);
        } else {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Se necesita acceso a la galería');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });
            if (!result.canceled) setFoto(result.assets[0].uri);
        }
    };

    const toggleTallaNumerica = (t: string) => {
        setTallasNumericas(prev =>
            prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
        );
    };

    const toggleTallaEspecial = (t: string) => {
        setTallasEspeciales(prev =>
            prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
        );
    };

    const toggleTela = (tela: Tela) => {
        const existe = telasAsociadas.find(t => t.telaId === tela.id);
        if (existe) {
            setTelasAsociadas(prev => prev.filter(t => t.telaId !== tela.id));
        } else {
            setTelasAsociadas(prev => [
                ...prev,
                { telaId: tela.id, telaNombre: tela.nombre, precioMetro: tela.precioMetro, metros: '' },
            ]);
        }
    };

    const updateMetrosTela = (telaId: string, metros: string) => {
        setTelasAsociadas(prev =>
            prev.map(t => t.telaId === telaId ? { ...t, metros } : t)
        );
    };

    const guardarModelo = async () => {
        if (!nombre.trim()) {
            Alert.alert('Error', 'El nombre del modelo es requerido');
            return;
        }
        const nuevo: ModeloPantalon = {
            id: Date.now().toString(),
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            tipo,
            tallasNumericas,
            tallasEspeciales,
            costoProces: costoProces.trim(),
            telasAsociadas,
            precioVenta: precioVenta.trim(),
            foto,
            activo: true,
            fechaCreacion: new Date().toISOString(),
        };
        const actualizado = [nuevo, ...modelos];
        setModelos(actualizado);
        await persistModelos(actualizado);
        resetForm();
        setModalVisible(false);
    };

    const eliminarModelo = (id: string) => {
        Alert.alert('Eliminar modelo', '¿Estás seguro de eliminar este pantalón?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    const actualizado = modelos.filter(m => m.id !== id);
                    setModelos(actualizado);
                    await persistModelos(actualizado);
                },
            },
        ]);
    };

    const resetForm = () => {
        setNombre('');
        setDescripcion('');
        setTipo('Jeans');
        setTallasNumericas([]);
        setTallasEspeciales([]);
        setCostoProces('');
        setTelasAsociadas([]);
        setPrecioVenta('');
        setFoto(undefined);
    };

    const modelosFiltrados = modelos.filter(m => {
        const matchSearch = m.nombre.toLowerCase().includes(searchQuery.toLowerCase());
        const matchFilter = filter === 'activos' ? m.activo : !m.activo;
        return matchSearch && matchFilter;
    });

    const costosPrevio = calcCostos(telasAsociadas, costoProces, precioVenta);
    const hayDatosCosto = costosPrevio.costoTotal > 0 || costosPrevio.pventa > 0;

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Buscar pantalón..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                />
            </View>

            <View style={styles.filtersContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Chip
                        selected={filter === 'activos'}
                        onPress={() => setFilter('activos')}
                        style={styles.chip}
                    >
                        Activos
                    </Chip>
                    <Chip
                        selected={filter === 'inactivos'}
                        onPress={() => setFilter('inactivos')}
                        style={styles.chip}
                    >
                        Inactivos
                    </Chip>
                </ScrollView>
            </View>

            <ScrollView style={styles.content}>
                {modelosFiltrados.length === 0 && (
                    <View style={styles.empty}>
                        <MaterialCommunityIcons name="hanger" size={64} color="#CCC" />
                        <Text style={styles.emptyText}>Sin modelos registrados</Text>
                        <Text style={styles.emptySubtext}>Toca + para agregar un pantalón</Text>
                    </View>
                )}
                {modelosFiltrados.map(m => {
                    const costos = calcCostos(m.telasAsociadas ?? [], m.costoProces ?? '', m.precioVenta ?? '');
                    const todasTallas = [...(m.tallasNumericas ?? []), ...(m.tallasEspeciales ?? [])];
                    const tieneCostos = costos.costoTotal > 0 || costos.pventa > 0;
                    return (
                        <View key={m.id} style={styles.card}>
                            <View style={styles.cardRow}>
                                <TouchableOpacity onPress={showImageOptions} style={styles.cardImageContainer}>
                                    {m.foto ? (
                                        <Image source={{ uri: m.foto }} style={styles.cardImage} />
                                    ) : (
                                        <View style={styles.cardImagePlaceholder}>
                                            <MaterialCommunityIcons name="hanger" size={36} color="#999" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <View style={styles.cardBody}>
                                    <View style={styles.cardTop}>
                                        <Text style={styles.cardNombre}>{m.nombre}</Text>
                                        <View style={styles.tipoBadge}>
                                            <Text style={styles.tipoText}>{m.tipo}</Text>
                                        </View>
                                    </View>
                                    {!!m.descripcion && (
                                        <Text style={styles.cardDescripcion} numberOfLines={2}>
                                            {m.descripcion}
                                        </Text>
                                    )}

                                    {todasTallas.length > 0 && (
                                        <View style={styles.tallasRow}>
                                            {todasTallas.map(t => (
                                                <View key={t} style={styles.tallaBadge}>
                                                    <Text style={styles.tallaBadgeText}>{t}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            </View>

                            {tieneCostos && (
                                <View style={styles.costosContainer}>
                                    <View style={styles.costosRow}>
                                        <View style={styles.costoItem}>
                                            <Text style={styles.costoLabel}>Tela</Text>
                                            <Text style={styles.costoValor}>${costos.costoTela.toFixed(2)}</Text>
                                        </View>
                                        <View style={styles.costoSep} />
                                        <View style={styles.costoItem}>
                                            <Text style={styles.costoLabel}>Proceso</Text>
                                            <Text style={styles.costoValor}>${costos.costoProces.toFixed(2)}</Text>
                                        </View>
                                        <View style={styles.costoSep} />
                                        <View style={styles.costoItem}>
                                            <Text style={styles.costoLabel}>Total costo</Text>
                                            <Text style={[styles.costoValor, { color: '#FF6B35' }]}>
                                                ${costos.costoTotal.toFixed(2)}
                                            </Text>
                                        </View>
                                        <View style={styles.costoSep} />
                                        <View style={styles.costoItem}>
                                            <Text style={styles.costoLabel}>Venta</Text>
                                            <Text style={[styles.costoValor, { color: '#004E89' }]}>
                                                ${costos.pventa.toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>

                                    {costos.costoTotal > 0 && costos.pventa > 0 && (
                                        <View style={[
                                            styles.veredicto,
                                            costos.conviene ? styles.veredictoSi : styles.veredictoNo,
                                        ]}>
                                            <MaterialCommunityIcons
                                                name={costos.conviene ? 'check-circle' : 'close-circle'}
                                                size={16}
                                                color={costos.conviene ? '#06A77D' : '#FF4444'}
                                            />
                                            <Text style={[
                                                styles.veredictoText,
                                                { color: costos.conviene ? '#06A77D' : '#FF4444' },
                                            ]}>
                                                {costos.conviene
                                                    ? `Conviene — ganancia $${costos.ganancia.toFixed(2)} (${costos.margen?.toFixed(1)}%)`
                                                    : `No conviene — pérdida $${Math.abs(costos.ganancia).toFixed(2)}`
                                                }
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            <View style={styles.cardFooter}>
                                {(m.telasAsociadas ?? []).length > 0 && (
                                    <View style={styles.telasTags}>
                                        {m.telasAsociadas.map(t => (
                                            <View key={t.telaId} style={styles.telaTag}>
                                                <MaterialCommunityIcons name="scissors-cutting" size={11} color="#888" />
                                                <Text style={styles.telaTagText}>{t.telaNombre}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                                <TouchableOpacity
                                    style={styles.deleteBtn}
                                    onPress={() => eliminarModelo(m.id)}
                                >
                                    <MaterialCommunityIcons name="trash-can-outline" size={16} color="#FF4444" />
                                    <Text style={styles.deleteBtnText}>Eliminar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}
                <View style={{ height: 100 }} />
            </ScrollView>

            <FAB icon="plus" style={styles.fab} onPress={() => { loadAll(); setModalVisible(true); }} />

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nuevo Pantalón</Text>
                            <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                                <MaterialCommunityIcons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
                            {/* Foto */}
                            <TouchableOpacity style={styles.photoPicker} onPress={showImageOptions}>
                                {foto ? (
                                    <Image source={{ uri: foto }} style={styles.photoPreview} />
                                ) : (
                                    <View style={styles.photoPlaceholder}>
                                        <MaterialCommunityIcons name="camera-plus" size={40} color="#999" />
                                        <Text style={styles.photoPlaceholderText}>Tomar foto o elegir de galería</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {/* Nombre y descripción */}
                            <TextInput
                                style={styles.input}
                                placeholder="Nombre del modelo *"
                                placeholderTextColor="#999"
                                value={nombre}
                                onChangeText={setNombre}
                            />
                            <TextInput
                                style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
                                placeholder="Descripción (ej: corte recto, tiro medio...)"
                                placeholderTextColor="#999"
                                value={descripcion}
                                onChangeText={setDescripcion}
                                multiline
                            />

                            {/* Tipo */}
                            <Text style={styles.sectionLabel}>Tipo de prenda</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tipoRow}>
                                {TIPOS.map(t => (
                                    <TouchableOpacity
                                        key={t}
                                        style={[styles.tipoBtn, tipo === t && styles.tipoBtnActive]}
                                        onPress={() => setTipo(t)}
                                    >
                                        <Text style={[styles.tipoBtnText, tipo === t && styles.tipoBtnTextActive]}>
                                            {t}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Tallas numéricas */}
                            <Text style={styles.sectionLabel}>Tallas numéricas</Text>
                            <View style={styles.checkGrid}>
                                {TALLAS_NUMERICAS.map(t => {
                                    const sel = tallasNumericas.includes(t);
                                    return (
                                        <TouchableOpacity
                                            key={t}
                                            style={[styles.checkItem, sel && styles.checkItemActive]}
                                            onPress={() => toggleTallaNumerica(t)}
                                        >
                                            <View style={[styles.checkbox, sel && styles.checkboxActive]}>
                                                {sel && (
                                                    <MaterialCommunityIcons name="check" size={14} color="#FFF" />
                                                )}
                                            </View>
                                            <Text style={[styles.checkLabel, sel && styles.checkLabelActive]}>
                                                {t}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Tallas especiales */}
                            <Text style={styles.sectionLabel}>Tallas especiales</Text>
                            <View style={styles.checkRow}>
                                {TALLAS_ESPECIALES.map(t => {
                                    const sel = tallasEspeciales.includes(t);
                                    return (
                                        <TouchableOpacity
                                            key={t}
                                            style={[styles.checkItemEsp, sel && styles.checkItemActive]}
                                            onPress={() => toggleTallaEspecial(t)}
                                        >
                                            <View style={[styles.checkbox, sel && styles.checkboxActive]}>
                                                {sel && (
                                                    <MaterialCommunityIcons name="check" size={14} color="#FFF" />
                                                )}
                                            </View>
                                            <Text style={[styles.checkLabel, sel && styles.checkLabelActive]}>
                                                {t}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Telas del modelo */}
                            <Text style={styles.sectionLabel}>Telas del modelo</Text>
                            {telas.length === 0 ? (
                                <Text style={styles.sinDatos}>
                                    No hay telas. Agrega telas en la sección Telas.
                                </Text>
                            ) : (
                                <>
                                    <Text style={styles.hint}>Selecciona las telas que usa este modelo:</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                                        {telas.map(tela => {
                                            const sel = telasAsociadas.find(t => t.telaId === tela.id);
                                            return (
                                                <TouchableOpacity
                                                    key={tela.id}
                                                    style={[styles.telaChip, sel && styles.telaChipActive]}
                                                    onPress={() => toggleTela(tela)}
                                                >
                                                    <View style={[styles.telaChipDot, { backgroundColor: tela.color || '#888' }]} />
                                                    <View>
                                                        <Text style={[styles.telaChipNombre, sel && styles.telaChipNombreActive]}>
                                                            {tela.nombre}
                                                        </Text>
                                                        <Text style={styles.telaChipPrecio}>
                                                            ${tela.precioMetro || '0'}/m
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>

                                    {telasAsociadas.map(sel => (
                                        <View key={sel.telaId} style={styles.telaMetrosRow}>
                                            <View style={styles.telaMetrosLabel}>
                                                <MaterialCommunityIcons name="scissors-cutting" size={16} color="#FF6B35" />
                                                <Text style={styles.telaMetrosNombre}>{sel.telaNombre}</Text>
                                                <Text style={styles.telaMetrosPrecio}>${sel.precioMetro}/m</Text>
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
                                                onPress={() => setTelasAsociadas(prev => prev.filter(t => t.telaId !== sel.telaId))}
                                            >
                                                <MaterialCommunityIcons name="close-circle" size={22} color="#FF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </>
                            )}

                            {/* Costos */}
                            <Text style={styles.sectionLabel}>Costos y precio</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Costo de proceso / confección ($)"
                                placeholderTextColor="#999"
                                value={costoProces}
                                onChangeText={setCostoProces}
                                keyboardType="decimal-pad"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Precio de venta ($)"
                                placeholderTextColor="#999"
                                value={precioVenta}
                                onChangeText={setPrecioVenta}
                                keyboardType="decimal-pad"
                            />

                            {/* Resumen de costos en tiempo real */}
                            {hayDatosCosto && (
                                <View style={styles.resumenCostos}>
                                    <Text style={styles.resumenTitulo}>Resumen de costos</Text>
                                    <View style={styles.resumenFila}>
                                        <Text style={styles.resumenLbl}>Costo de tela</Text>
                                        <Text style={styles.resumenVal}>${costosPrevio.costoTela.toFixed(2)}</Text>
                                    </View>
                                    <View style={styles.resumenFila}>
                                        <Text style={styles.resumenLbl}>Costo de proceso</Text>
                                        <Text style={styles.resumenVal}>${costosPrevio.costoProces.toFixed(2)}</Text>
                                    </View>
                                    <View style={[styles.resumenFila, styles.resumenFilaTotal]}>
                                        <Text style={styles.resumenLblTotal}>Costo total</Text>
                                        <Text style={styles.resumenValTotal}>${costosPrevio.costoTotal.toFixed(2)}</Text>
                                    </View>
                                    {costosPrevio.pventa > 0 && (
                                        <View style={styles.resumenFila}>
                                            <Text style={styles.resumenLbl}>Precio de venta</Text>
                                            <Text style={[styles.resumenVal, { color: '#004E89', fontWeight: '700' }]}>
                                                ${costosPrevio.pventa.toFixed(2)}
                                            </Text>
                                        </View>
                                    )}
                                    {costosPrevio.costoTotal > 0 && costosPrevio.pventa > 0 && (
                                        <View style={[
                                            styles.veredictoResumen,
                                            costosPrevio.conviene ? styles.veredictoResumenSi : styles.veredictoResumenNo,
                                        ]}>
                                            <MaterialCommunityIcons
                                                name={costosPrevio.conviene ? 'check-circle-outline' : 'close-circle-outline'}
                                                size={22}
                                                color={costosPrevio.conviene ? '#06A77D' : '#FF4444'}
                                            />
                                            <View style={{ flex: 1 }}>
                                                <Text style={[
                                                    styles.veredictoResumenTexto,
                                                    { color: costosPrevio.conviene ? '#06A77D' : '#E53935' },
                                                ]}>
                                                    {costosPrevio.conviene ? '¡Conviene hacerlo!' : 'No conviene hacerlo'}
                                                </Text>
                                                <Text style={styles.veredictoResumenSub}>
                                                    {costosPrevio.conviene
                                                        ? `Ganancia: $${costosPrevio.ganancia.toFixed(2)} (${costosPrevio.margen?.toFixed(1)}% margen)`
                                                        : `Pérdida: $${Math.abs(costosPrevio.ganancia).toFixed(2)} — el costo supera el precio de venta`
                                                    }
                                                </Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            )}

                            <TouchableOpacity style={styles.submitBtn} onPress={guardarModelo}>
                                <MaterialCommunityIcons name="content-save" size={20} color="#FFF" />
                                <Text style={styles.submitBtnText}>Guardar Modelo</Text>
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
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    searchContainer: { paddingHorizontal: 12, paddingVertical: 8 },
    searchBar: { backgroundColor: '#FFF', borderRadius: 8 },
    filtersContainer: { paddingHorizontal: 12, paddingBottom: 8 },
    chip: { marginRight: 8, backgroundColor: '#E8E8E8' },
    content: { flex: 1, paddingHorizontal: 12, paddingTop: 4 },
    empty: { justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
    emptyText: { fontSize: 18, color: '#999', marginTop: 16 },
    emptySubtext: { fontSize: 14, color: '#BBB', marginTop: 8 },

    // Card
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 14,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardRow: { flexDirection: 'row' },
    cardImageContainer: { width: 110 },
    cardImage: { width: 110, height: '100%', minHeight: 120 },
    cardImagePlaceholder: {
        width: 110,
        minHeight: 120,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardBody: { flex: 1, padding: 12 },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    cardNombre: { fontSize: 15, fontWeight: 'bold', color: '#2C2C2C', flex: 1, marginRight: 8 },
    tipoBadge: {
        backgroundColor: '#FF6B35',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    tipoText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
    cardDescripcion: { fontSize: 12, color: '#666', marginBottom: 8 },
    tallasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
    tallaBadge: {
        backgroundColor: '#E3F2FD',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: '#90CAF9',
    },
    tallaBadgeText: { fontSize: 11, fontWeight: '700', color: '#1565C0' },

    // Costos en card
    costosContainer: {
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    costosRow: { flexDirection: 'row', justifyContent: 'space-between' },
    costoItem: { flex: 1, alignItems: 'center' },
    costoLabel: { fontSize: 10, color: '#999', marginBottom: 2 },
    costoValor: { fontSize: 13, fontWeight: '700', color: '#2C2C2C' },
    costoSep: { width: 1, backgroundColor: '#EEE' },
    veredicto: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    veredictoSi: { backgroundColor: '#E8F5E9' },
    veredictoNo: { backgroundColor: '#FFEBEE' },
    veredictoText: { fontSize: 12, fontWeight: '600', flex: 1 },

    // Footer de la card
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    telasTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, flex: 1 },
    telaTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#F5F5F5',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    telaTagText: { fontSize: 10, color: '#888' },
    deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    deleteBtnText: { fontSize: 12, color: '#FF4444' },

    fab: { position: 'absolute', right: 16, bottom: 24, backgroundColor: '#FF6B35' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
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
    form: { paddingHorizontal: 16, paddingVertical: 12 },

    photoPicker: {
        marginBottom: 12,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#DDD',
        borderStyle: 'dashed',
    },
    photoPreview: { width: '100%', height: 200 },
    photoPlaceholder: {
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
        gap: 8,
    },
    photoPlaceholderText: { color: '#999', fontSize: 14 },

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
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#444',
        marginTop: 8,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    tipoRow: { marginBottom: 14 },
    tipoBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#EEE',
        marginRight: 8,
    },
    tipoBtnActive: { backgroundColor: '#FF6B35' },
    tipoBtnText: { color: '#666', fontWeight: '600', fontSize: 13 },
    tipoBtnTextActive: { color: '#FFF' },

    // Checkboxes de tallas
    checkGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 14,
    },
    checkRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 14,
    },
    checkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#F0F0F0',
        borderWidth: 2,
        borderColor: 'transparent',
        minWidth: 64,
        justifyContent: 'center',
    },
    checkItemEsp: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#F0F0F0',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    checkItemActive: {
        backgroundColor: '#E3F2FD',
        borderColor: '#1565C0',
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#BBB',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
    },
    checkboxActive: {
        backgroundColor: '#1565C0',
        borderColor: '#1565C0',
    },
    checkLabel: { fontSize: 14, fontWeight: '600', color: '#555' },
    checkLabelActive: { color: '#1565C0' },

    // Telas en el form
    sinDatos: { color: '#AAA', fontSize: 13, fontStyle: 'italic', marginBottom: 10 },
    hint: { color: '#888', fontSize: 12, marginBottom: 8 },
    chipRow: { marginBottom: 8 },
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
    telaChipPrecio: { color: '#888', fontSize: 11, marginTop: 1 },
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
    telaMetrosPrecio: { color: '#888', fontSize: 11 },
    inputMetros: { width: 80, marginBottom: 0 },

    // Resumen de costos en el form
    resumenCostos: {
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    resumenTitulo: {
        fontSize: 12,
        fontWeight: '700',
        color: '#555',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
    },
    resumenFila: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    resumenFilaTotal: {
        borderTopWidth: 1,
        borderTopColor: '#DDD',
        marginTop: 4,
        paddingTop: 8,
    },
    resumenLbl: { fontSize: 13, color: '#666' },
    resumenVal: { fontSize: 13, color: '#2C2C2C', fontWeight: '600' },
    resumenLblTotal: { fontSize: 14, color: '#2C2C2C', fontWeight: '700' },
    resumenValTotal: { fontSize: 14, color: '#FF6B35', fontWeight: '700' },
    veredictoResumen: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginTop: 12,
        padding: 12,
        borderRadius: 10,
    },
    veredictoResumenSi: { backgroundColor: '#E8F5E9' },
    veredictoResumenNo: { backgroundColor: '#FFEBEE' },
    veredictoResumenTexto: { fontSize: 15, fontWeight: '700' },
    veredictoResumenSub: { fontSize: 12, color: '#666', marginTop: 2 },

    submitBtn: {
        backgroundColor: '#FF6B35',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 4,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
