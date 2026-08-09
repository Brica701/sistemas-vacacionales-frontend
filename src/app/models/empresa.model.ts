export enum RolUsuario {
  SUPER_ADMIN = 'SUPER_ADMIN',
  RRHH = 'RRHH',
  MANAGER = 'MANAGER',
  EMPLEADO = 'EMPLEADO',
}

export enum TipoPermiso {
  VACACIONES = 'VACACIONES',
  BAJA_MEDICA = 'BAJA_MEDICA',
  MATERNIDAD_PATERNIDAD = 'MATERNIDAD_PATERNIDAD',
  ASUNTOS_PROPIOS = 'ASUNTOS_PROPIOS',
  TELETRABAJO = 'TELETRABAJO',
}

export enum EstadoSolicitud {
  PENDIENTE = 'PENDIENTE',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
}

export interface Usuario {
  id?: number;
  nombre: string;
  email: string;
  password?: string;
  rol: RolUsuario;
  diasVacacionesTotales: number; // Por defecto: 22
  diasVacacionesConsumidos: number; // Calculado
  diasAsuntosPropiosTotales: number; // Por defecto: 6
  diasAsuntosPropiosConsumidos: number;
  requiereCambioPassword?: boolean;
  puesto?: any;
  delegacion?: any;
}

export interface SolicitudPermiso {
  id?: number;
  usuario: Partial<Usuario> & { id: number };
  tipo: TipoPermiso;
  fechaInicio: string;
  fechaFin: string;
  diasLaborablesCalculados?: number;
  diasSolicitados?: number;
  estado: EstadoSolicitud;
  motivoRechazo?: string;
  fechaCreacion?: string;
}
