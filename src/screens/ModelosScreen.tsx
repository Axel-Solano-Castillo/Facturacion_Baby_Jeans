import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
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

const STORAGE_KEY = '@babyjeans_modelos';
const TIPOS = ['Jeans', 'Bermuda', 'Jogger', 'Cargo', 'Otro'];

interface ModeloPantalon {
    id: string;
    nombre: string;
    descripcion: string;
    tipo: string;
    tallas: string;
    precioBase: string;
    foto?: string;
    activo: boolean;
    fechaCreacion: string;
}

export default function ModelosScreen() {
    const [modelos, setModelos] = useState<ModeloPantalon[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('activos');
    const [modalVisible, setModalVisible] = useState(false);

    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [tipo, setTipo] = useState('Jeans');
    const [tallas, setTallas] = useState('');
    const [precioBase, setPrecioBase] = useState('');
    const [foto, setFoto] = useState<string | undefined>();

    useEffect(() => {
        loadModelos();
    }, []);

    const loadModelos = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) setModelos(JSON.parse(stored));
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
                Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara para tomar fotos');
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
            tallas: tallas.trim(),
            precioBase: precioBase.trim(),
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
        setTallas('');
        setPrecioBase('');
        setFoto(undefined);
    };

    const modelosFiltrados = modelos.filter(m => {
        const matchSearch = m.nombre.toLowerCase().includes(searchQuery.toLowerCase());
        const matchFilter = filter === 'activos' ? m.activo : !m.activo;
        return matchSearch && matchFilter;
    });

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
                {modelosFiltrados.map(m => (
                    <View key={m.id} style={styles.card}>
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
                            <View style={styles.cardMeta}>
                                {!!m.tallas && <Text style={styles.metaText}>Tallas: {m.tallas}</Text>}
                                {!!m.precioBase && <Text style={styles.precio}>${m.precioBase}</Text>}
                            </View>
                            <TouchableOpacity
                                style={styles.deleteBtn}
                                onPress={() => eliminarModelo(m.id)}
                            >
                                <MaterialCommunityIcons name="trash-can-outline" size={16} color="#FF4444" />
                                <Text style={styles.deleteBtnText}>Eliminar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
                <View style={{ height: 100 }} />
            </ScrollView>

            <FAB icon="plus" style={styles.fab} onPress={() => setModalVisible(true)} />

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
                            <TouchableOpacity style={styles.photoPicker} onPress={showImageOptions}>
                                {foto ? (
                                    <Image source={{ uri: foto }} style={styles.photoPreview} />
                                ) : (
                                    <View style={styles.photoPlaceholder}>
                                        <MaterialCommunityIcons name="camera-plus" size={40} color="#999" />
                                        <Text style={styles.photoPlaceholderText}>
                                            Tomar foto o elegir de galería
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>

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

                            <Text style={styles.inputLabel}>Tipo de prenda</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.tipoRow}
                            >
                                {TIPOS.map(t => (
                                    <TouchableOpacity
                                        key={t}
                                        style={[styles.tipoBtn, tipo === t && styles.tipoBtnActive]}
                                        onPress={() => setTipo(t)}
                                    >
                                        <Text
                                            style={[
                                                styles.tipoBtnText,
                                                tipo === t && styles.tipoBtnTextActive,
                                            ]}
                                        >
                                            {t}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <TextInput
                                style={styles.input}
                                placeholder="Tallas (ej: 28, 30, 32, 34)"
                                placeholderTextColor="#999"
                                value={tallas}
                                onChangeText={setTallas}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Precio base ($)"
                                placeholderTextColor="#999"
                                value={precioBase}
                                onChangeText={setPrecioBase}
                                keyboardType="decimal-pad"
                            />

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
    empty: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyText: { fontSize: 18, color: '#999', marginTop: 16 },
    emptySubtext: { fontSize: 14, color: '#BBB', marginTop: 8 },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
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
    cardNombre: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#2C2C2C',
        flex: 1,
        marginRight: 8,
    },
    tipoBadge: {
        backgroundColor: '#FF6B35',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    tipoText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
    cardDescripcion: { fontSize: 12, color: '#666', marginBottom: 8 },
    cardMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    metaText: { fontSize: 12, color: '#888' },
    precio: { fontSize: 14, fontWeight: 'bold', color: '#004E89' },
    deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    deleteBtnText: { fontSize: 12, color: '#FF4444' },
    fab: { position: 'absolute', right: 16, bottom: 24, backgroundColor: '#FF6B35' },
    modalOverlay: {
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
        height: 150,
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
    inputLabel: { fontSize: 13, color: '#666', marginBottom: 8, fontWeight: '600' },
    tipoRow: { marginBottom: 12 },
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
    submitBtn: {
        backgroundColor: '#FF6B35',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
