import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

// ✅ Única fuente de verdad para TipoPermiso y los demás tipos
import { Usuario, SolicitudPermiso, TipoPermiso, RolUsuario } from '../../models/empresa.model';

@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-admin.html',
  styleUrl: './panel-admin.css',
})
export class PanelAdminComponent implements OnInit {
  // --- ARRAYS DE DATOS REALES ---
  usuarios: Usuario[] = [];
  puestos: any[] = [];
  delegaciones: any[] = [];
  festivos: any[] = [];
  solicitudesPendientes: SolicitudPermiso[] = [];
  todasLasSolicitudes: SolicitudPermiso[] = [];

  // --- OPCIONES PARA TIPOS DE PERMISO ---
  tiposPermiso: { clave: TipoPermiso; etiqueta: string }[] = [
    { clave: TipoPermiso.VACACIONES, etiqueta: 'Vacaciones' },
    { clave: TipoPermiso.BAJA_MEDICA, etiqueta: 'Baja Médica' },
    { clave: TipoPermiso.ASUNTOS_PROPIOS, etiqueta: 'Asuntos Propios' },
    { clave: TipoPermiso.TELETRABAJO, etiqueta: 'Teletrabajo' },
    { clave: TipoPermiso.MATERNIDAD_PATERNIDAD, etiqueta: 'Maternidad/Paternidad' },
  ];

  // --- MODELOS PARA FORMULARIOS ---
  nuevoUsuario: Partial<Usuario> = {
    id: undefined,
    nombre: '',
    email: '',
    password: '',
    puesto: null,
    delegacion: null,
    diasVacacionesTotales: 22,
    diasVacacionesConsumidos: 0,
    diasAsuntosPropiosTotales: 6,
    diasAsuntosPropiosConsumidos: 0,
    rol: RolUsuario.EMPLEADO,
  };

  nuevoPuesto: any = { id: null, nombre: '' };
  nuevaDelegacion: any = { id: null, nombre: '', ciudad: '' };
  nuevoFestivo: any = { id: null, fecha: '', descripcion: '', delegacionId: '' };

  motivosRechazo: { [key: number]: string } = {};
  mensajeError: string = '';

  // --- VARIABLES DEL CALENDARIO GLOBAL ---
  fechaActual: Date = new Date();
  diasDelMes: (number | null)[] = [];
  nombresMeses: string[] = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  // --- CONTROL DE PESTAÑAS ---
  pestanaActiva: string = 'vacaciones'; // 'vacaciones' | 'usuarios' | 'puestos' | 'delegaciones' | 'festivos'

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  // --- COMPARADOR PARA SELECTS EN ANGULAR ---
  compareFn(item1: any, item2: any): boolean {
    if (item1 === item2) return true;
    if (!item1 || !item2) return false;
    return item1.id === item2.id;
  }

  // --- CARGA DE DATOS DESDE EL BACKEND ---
  cargarDatos(): void {
    this.apiService.getUsuarios().subscribe({
      next: (data: Usuario[]) => (this.usuarios = data || []),
      error: (err) => console.error('Error al cargar usuarios:', err),
    });

    this.apiService.getPuestos().subscribe({
      next: (data: any[]) => (this.puestos = data || []),
      error: (err) => console.error('Error al cargar puestos:', err),
    });

    this.apiService.getDelegaciones().subscribe({
      next: (data: any[]) => (this.delegaciones = data || []),
      error: (err) => console.error('Error al cargar delegaciones:', err),
    });

    this.apiService.getFestivos().subscribe({
      next: (data: any[]) => (this.festivos = data || []),
      error: (err) => console.error('Error al cargar festivos:', err),
    });

    this.apiService.getSolicitudesPendientes().subscribe({
      next: (data: SolicitudPermiso[]) => (this.solicitudesPendientes = data || []),
      error: (err) => console.error('Error al cargar solicitudes pendientes:', err),
    });

    const reqTodas = this.apiService.getTodasSolicitudes
      ? this.apiService.getTodasSolicitudes()
      : this.apiService.getMisSolicitudes();

    reqTodas.subscribe({
      next: (data: SolicitudPermiso[]) => {
        this.todasLasSolicitudes = data || [];
        queueMicrotask(() => this.generarCalendario());
      },
      error: (err) => {
        console.error('Error al cargar todas las solicitudes:', err);
        queueMicrotask(() => this.generarCalendario());
      },
    });
  }

  cambiarPestana(pestana: string): void {
    this.pestanaActiva = pestana;
  }

  // --- CÁLCULO DE DÍAS LABORABLES Y BOLSA ---

  /**
   * Calcula los días hábiles/laborables entre dos fechas desestimando
   * fines de semana y festivos registrados.
   */
  calcularDiasLaborables(
    fechaInicioStr: string,
    fechaFinStr: string,
    delegacionId?: number,
  ): number {
    if (!fechaInicioStr || !fechaFinStr) return 0;

    let fechaCursor = new Date(fechaInicioStr + 'T00:00:00');
    const fechaFin = new Date(fechaFinStr + 'T00:00:00');
    let diasHabiles = 0;

    // Fechas de festivos a comparar
    const marcasFestivas = this.festivos
      .filter((f) => !f.delegacionId || f.delegacionId === delegacionId)
      .map((f) => new Date(f.fecha + 'T00:00:00').getTime());

    while (fechaCursor <= fechaFin) {
      const diaSemana = fechaCursor.getDay(); // 0 = Domingo, 6 = Sábado
      const tiempoActual = fechaCursor.getTime();

      const esFinDeSemana = diaSemana === 0 || diaSemana === 6;
      const esFestivo = marcasFestivas.includes(tiempoActual);

      if (!esFinDeSemana && !esFestivo) {
        diasHabiles++;
      }
      fechaCursor.setDate(fechaCursor.getDate() + 1);
    }

    return diasHabiles;
  }

  obtenerDiasDisponibles(
    usuario: Usuario | any,
    tipoPermiso: TipoPermiso | string = TipoPermiso.VACACIONES,
  ): number {
    if (!usuario) return 0;
    if (tipoPermiso === TipoPermiso.ASUNTOS_PROPIOS) {
      return (usuario.diasAsuntosPropiosTotales ?? 6) - (usuario.diasAsuntosPropiosConsumidos ?? 0);
    }
    // Por defecto calcula Vacaciones libres
    return (usuario.diasVacacionesTotales ?? 22) - (usuario.diasVacacionesConsumidos ?? 0);
  }

  // 🌟 MÉTODO CORREGIDO PARA AJUSTAR (SUMAR/RESTAR) DÍAS A UN EMPLEADO
  ajustarDiasEmpleado(
    usuario: Usuario,
    cantidadDias: number,
    tipo: 'VACACIONES' | 'ASUNTOS_PROPIOS',
  ): void {
    if (!usuario.id) return;

    // Crear clon para la manipulación
    const usuarioClon: Usuario = { ...usuario };

    if (tipo === 'VACACIONES') {
      const nuevoTotal = (usuarioClon.diasVacacionesTotales ?? 22) + cantidadDias;
      if (nuevoTotal < 0) {
        alert('El total de días no puede ser negativo.');
        return;
      }
      usuarioClon.diasVacacionesTotales = nuevoTotal;
    } else {
      const nuevoTotal = (usuarioClon.diasAsuntosPropiosTotales ?? 6) + cantidadDias;
      if (nuevoTotal < 0) {
        alert('El total de días no puede ser negativo.');
        return;
      }
      usuarioClon.diasAsuntosPropiosTotales = nuevoTotal;
    }

    // Respuesta optimista en la vista
    const valorOriginalVacaciones = usuario.diasVacacionesTotales;
    const valorOriginalAsuntos = usuario.diasAsuntosPropiosTotales;

    usuario.diasVacacionesTotales = usuarioClon.diasVacacionesTotales;
    usuario.diasAsuntosPropiosTotales = usuarioClon.diasAsuntosPropiosTotales;

    // Enviar la petición de actualización al servidor
    this.apiService.guardarUsuario(usuarioClon).subscribe({
      next: (usuarioRespuesta) => {
        // Sincronizar datos devueltos por la API si aplica
        if (usuarioRespuesta) {
          Object.assign(usuario, usuarioRespuesta);
        }
      },
      error: (err) => {
        console.error('Error al actualizar días en el servidor:', err);
        // Revertir cambios locales si el servidor falla
        usuario.diasVacacionesTotales = valorOriginalVacaciones;
        usuario.diasAsuntosPropiosTotales = valorOriginalAsuntos;
        alert(
          'Error al actualizar los días del usuario: ' +
            (err.error?.message || err.message || 'Error del servidor'),
        );
      },
    });
  }

  // --- CRUD REAL DE USUARIOS ---
  guardarUsuario(): void {
    if (!this.nuevoUsuario.nombre || !this.nuevoUsuario.email) return;

    if (!this.nuevoUsuario.id && !this.nuevoUsuario.password) {
      alert('Por favor, ingresa una contraseña temporal para el nuevo usuario.');
      return;
    }

    const usuarioPayload: any = {
      id: this.nuevoUsuario.id,
      nombre: this.nuevoUsuario.nombre,
      email: this.nuevoUsuario.email,
      puesto: this.nuevoUsuario.puesto,
      delegacion: this.nuevoUsuario.delegacion,
      diasVacacionesTotales: Number(this.nuevoUsuario.diasVacacionesTotales ?? 22),
      diasVacacionesConsumidos: Number(this.nuevoUsuario.diasVacacionesConsumidos ?? 0),
      diasAsuntosPropiosTotales: Number(this.nuevoUsuario.diasAsuntosPropiosTotales ?? 6),
      diasAsuntosPropiosConsumidos: Number(this.nuevoUsuario.diasAsuntosPropiosConsumidos ?? 0),
      rol: this.nuevoUsuario.rol || RolUsuario.EMPLEADO,
    };

    // Incluir contraseña solo si se ha rellenado
    if (this.nuevoUsuario.password && this.nuevoUsuario.password.trim() !== '') {
      usuarioPayload.password = this.nuevoUsuario.password;
    }

    this.apiService.guardarUsuario(usuarioPayload).subscribe({
      next: () => {
        this.cargarDatos();
        this.resetUsuarioForm();
      },
      error: (err) => {
        console.error('Detalle del error al guardar usuario:', err);
        alert('Error al guardar el usuario: ' + (err.error?.message || err.message));
      },
    });
  }

  editarUsuario(u: Usuario): void {
    const puestoEncontrado = this.puestos.find((p) => p.id === (u.puesto?.id ?? u.puesto)) || null;
    const delegacionEncontrada =
      this.delegaciones.find((d) => d.id === (u.delegacion?.id ?? u.delegacion)) || null;

    this.nuevoUsuario = {
      ...u,
      password: '',
      puesto: puestoEncontrado,
      delegacion: delegacionEncontrada,
      diasVacacionesTotales: u.diasVacacionesTotales ?? 22,
      diasVacacionesConsumidos: u.diasVacacionesConsumidos ?? 0,
      diasAsuntosPropiosTotales: u.diasAsuntosPropiosTotales ?? 6,
      diasAsuntosPropiosConsumidos: u.diasAsuntosPropiosConsumidos ?? 0,
      rol: u.rol || RolUsuario.EMPLEADO,
    };
  }

  eliminarUsuario(id: number | undefined): void {
    if (!id) return;
    if (confirm('¿Seguro que deseas eliminar este usuario?')) {
      this.apiService.eliminarUsuario(id).subscribe({
        next: () => {
          this.cargarDatos();
          if (this.nuevoUsuario.id === id) {
            this.resetUsuarioForm();
          }
        },
        error: () => alert('Error al eliminar usuario'),
      });
    }
  }

  resetUsuarioForm(): void {
    this.nuevoUsuario = {
      id: undefined,
      nombre: '',
      email: '',
      password: '',
      puesto: null,
      delegacion: null,
      diasVacacionesTotales: 22,
      diasVacacionesConsumidos: 0,
      diasAsuntosPropiosTotales: 6,
      diasAsuntosPropiosConsumidos: 0,
      rol: RolUsuario.EMPLEADO,
    };
  }

  // --- CRUD REAL DE PUESTOS ---
  guardarPuesto(): void {
    if (!this.nuevoPuesto.nombre) return;

    this.apiService.guardarPuesto(this.nuevoPuesto).subscribe({
      next: () => {
        this.cargarDatos();
        this.resetPuestoForm();
      },
      error: () => alert('Error al guardar puesto'),
    });
  }

  editarPuesto(p: any): void {
    this.nuevoPuesto = { ...p };
  }

  eliminarPuesto(id: number): void {
    if (confirm('¿Deseas eliminar este puesto?')) {
      this.apiService.eliminarPuesto(id).subscribe({
        next: () => {
          this.cargarDatos();
          if (this.nuevoPuesto.id === id) {
            this.resetPuestoForm();
          }
        },
        error: () => alert('Error al eliminar puesto'),
      });
    }
  }

  resetPuestoForm(): void {
    this.nuevoPuesto = { id: null, nombre: '' };
  }

  // --- CRUD REAL DE DELEGACIONES ---
  guardarDelegacion(): void {
    if (!this.nuevaDelegacion.nombre) return;

    this.apiService.guardarDelegacion(this.nuevaDelegacion).subscribe({
      next: () => {
        this.cargarDatos();
        this.resetDelegacionForm();
      },
      error: () => alert('Error al guardar delegación'),
    });
  }

  editarDelegacion(d: any): void {
    this.nuevaDelegacion = { ...d };
  }

  eliminarDelegacion(id: number): void {
    if (confirm('¿Deseas eliminar esta delegación?')) {
      this.apiService.eliminarDelegacion(id).subscribe({
        next: () => {
          this.cargarDatos();
          if (this.nuevaDelegacion.id === id) {
            this.resetDelegacionForm();
          }
        },
        error: () => alert('Error al eliminar delegación'),
      });
    }
  }

  resetDelegacionForm(): void {
    this.nuevaDelegacion = { id: null, nombre: '', ciudad: '' };
  }

  // --- CRUD REAL DE FESTIVOS ---
  guardarFestivo(): void {
    if (!this.nuevoFestivo.fecha || !this.nuevoFestivo.descripcion) return;

    const valorDelegacion =
      this.nuevoFestivo.delegacionId !== '' && this.nuevoFestivo.delegacionId !== null
        ? Number(this.nuevoFestivo.delegacionId)
        : null;

    this.apiService
      .guardarFestivo({ ...this.nuevoFestivo, delegacionId: valorDelegacion })
      .subscribe({
        next: () => {
          this.cargarDatos();
          this.resetFestivoForm();
        },
        error: () => alert('Error al guardar el día festivo'),
      });
  }

  editarFestivo(f: any): void {
    this.nuevoFestivo = {
      ...f,
      delegacionId: f.delegacionId ?? f.delegacion?.id ?? '',
    };
  }

  eliminarFestivo(id: number): void {
    if (confirm('¿Deseas eliminar este festivo?')) {
      this.apiService.eliminarFestivo(id).subscribe({
        next: () => {
          this.cargarDatos();
          if (this.nuevoFestivo.id === id) {
            this.resetFestivoForm();
          }
        },
        error: () => alert('Error al eliminar festivo'),
      });
    }
  }

  resetFestivoForm(): void {
    this.nuevoFestivo = { id: null, fecha: '', descripcion: '', delegacionId: '' };
  }

  // --- GESTIÓN DE VACACIONES REALES Y PERMISOS ---
  resolver(id: number, accion: 'Aprobado' | 'Rechazado'): void {
    const motivo = this.motivosRechazo[id] || '';
    if (accion === 'Rechazado' && !motivo.trim()) {
      alert('Por favor, escribe un motivo para rechazar la solicitud.');
      return;
    }

    const solicitud =
      this.todasLasSolicitudes.find((s) => s.id === id) ||
      this.solicitudesPendientes.find((s) => s.id === id);

    // Validación de saldo de días al aprobar
    if (accion === 'Aprobado' && solicitud) {
      const tipo = (solicitud.tipo || TipoPermiso.VACACIONES) as TipoPermiso;
      const diasLaborables = this.calcularDiasLaborables(
        solicitud.fechaInicio,
        solicitud.fechaFin,
        solicitud.usuario?.delegacion?.id,
      );

      const usuario =
        this.usuarios.find((u) => u.id === solicitud.usuario?.id) || solicitud.usuario;

      if (tipo === TipoPermiso.VACACIONES || tipo === TipoPermiso.ASUNTOS_PROPIOS) {
        const disponibles = this.obtenerDiasDisponibles(usuario, tipo);
        if (diasLaborables > disponibles) {
          alert(
            `El usuario no dispone de días suficientes. Requiere: ${diasLaborables} día(s), Disponibles: ${disponibles}.`,
          );
          return;
        }
      }
    }

    this.apiService.resolverSolicitud(id, accion, motivo).subscribe({
      next: () => {
        this.cargarDatos();
        delete this.motivosRechazo[id];
      },
      error: (err) => alert(err.error?.error || 'Error al procesar la acción en el servidor.'),
    });
  }

  // --- LÓGICA DEL CALENDARIO GLOBAL ---
  generarCalendario(): void {
    const año = this.fechaActual.getFullYear();
    const mes = this.fechaActual.getMonth();
    const primerDiaSemana = new Date(año, mes, 1).getDay();
    const totalDias = new Date(año, mes + 1, 0).getDate();
    const inicioVacio = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

    const nuevosDias: (number | null)[] = [];
    for (let i = 0; i < inicioVacio; i++) nuevosDias.push(null);
    for (let dia = 1; dia <= totalDias; dia++) nuevosDias.push(dia);

    this.diasDelMes = nuevosDias;
    this.cdr.detectChanges();
  }

  cambiarMes(direccion: number): void {
    this.fechaActual.setMonth(this.fechaActual.getMonth() + direccion);
    this.fechaActual = new Date(this.fechaActual);
    this.generarCalendario();
  }

  obtenerEmpleadosDeVacaciones(dia: number | null): string[] {
    if (!dia) return [];

    const año = this.fechaActual.getFullYear();
    const mes = this.fechaActual.getMonth();
    const fechaEvaluada = new Date(año, mes, dia).getTime();
    const empleadosEncontrados: string[] = [];

    for (const solicitud of this.todasLasSolicitudes) {
      if (solicitud.estado === 'APROBADO' || (solicitud.estado as string) === 'Aprobado') {
        if (solicitud.fechaInicio && solicitud.fechaFin) {
          const inicio = new Date(solicitud.fechaInicio + 'T00:00:00').getTime();
          const fin = new Date(solicitud.fechaFin + 'T23:59:59').getTime();

          if (fechaEvaluada >= inicio && fechaEvaluada <= fin) {
            const tipoTexto = solicitud.tipo ? ` (${solicitud.tipo})` : '';
            const nombreEmpleado = `${solicitud.usuario?.nombre || 'Usuario'}${tipoTexto}`;

            if (!empleadosEncontrados.includes(nombreEmpleado)) {
              empleadosEncontrados.push(nombreEmpleado);
            }
          }
        }
      }
    }
    return empleadosEncontrados;
  }
}
