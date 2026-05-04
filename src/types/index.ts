// src/types/index.ts

export interface Tela {
    id: string;
    nombre: string;
    color: string;
    composicion: string;
    precioMetro: string;
    stockMetros: string;
    proveedor: string;
}

export interface ModeloPantalon {
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

export interface TallaProducida {
    talla: string;
    cantidad: number;
}

export interface TelaUsada {
    telaId: string;
    telaNombre: string;
    metros: number;
    stockAntes: number;
    stockDespues: number;
}

export interface RegistroProduccion {
    id: string;
    fecha: string;
    modeloId: string;
    modeloNombre: string;
    tallasProducidas: TallaProducida[];
    telasUsadas: TelaUsada[];
    observaciones: string;
}

export interface InventarioItem {
    id: string;
    modeloId: string;
    modeloNombre: string;
    talla: string;
    cantidad: number;
}

export interface Dashboard {
    totalTelas: number;
    totalModelos: number;
    totalPiezasInventario: number;
    totalRegistrosProduccion: number;
}
