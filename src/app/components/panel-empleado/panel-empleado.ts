import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

// ✅ Importación de interfaces y enums globales
import {
  Usuario,
  SolicitudPermiso,
  EstadoSolicitud,
  TipoPermiso,
} from '../../models/empresa.model';

interface ItemCalendario {
  nombreEmpleado: string;
  estado: string;
  esMio: boolean;
  tipo?: TipoPermiso;
}

@Component({
  selector: 'app-panel-empleado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-empleado.html',
  styleUrl: './panel-empleado.css',
})
export class PanelEmpleadoComponent implements OnInit {
  usuarioActual: Usuario | null = null;

  misSolicitudes: SolicitudPermiso[] = [];
  todasLasSolicitudes: SolicitudPermiso[] = [];

  // 🌟 FASE 1: VARIABLES PARA BALANCE DE BOLSA DE DÍAS
  diasTotales: number = 22; // Asignación anual estándar
  diasDisponibles: number = 22; // Saldo libre restante
  diasUsados: number = 0; // Días ya aprobados
  diasPendientes: number = 0; // Días en revisión por el admin

  fechaInicio: string = '';
  fechaFin: string = '';
  tipoPermisoSelected: TipoPermiso = TipoPermiso.VACACIONES;
  mensajeError: string = '';

  // Opciones para el selector de tipo de permiso en la vista
  tiposPermiso = [
    { clave: TipoPermiso.VACACIONES, etiqueta: 'Vacaciones' },
    { clave: TipoPermiso.BAJA_MEDICA, etiqueta: 'Baja Médica' },
    { clave: TipoPermiso.ASUNTOS_PROPIOS, etiqueta: 'Asuntos Propios' },
    { clave: TipoPermiso.TELETRABAJO, etiqueta: 'Teletrabajo' },
    { clave: TipoPermiso.MATERNIDAD_PATERNIDAD, etiqueta: 'Maternidad/Paternidad' },
  ];

  filtroVista: string = 'mis_vacaciones';

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

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef, // 👈 Inyección requerida para resolver NG0100
  ) {}

  ngOnInit(): void {
    this.obtenerUsuarioSesion();
    this.cargarSolicitudes();
  }

  obtenerUsuarioSesion(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userStr = localStorage.getItem('usuario');
      if (userStr) {
        try {
          this.usuarioActual = JSON.parse(userStr);
          // 🌟 FASE 1: Si el usuario trae su total de días asignados desde la BBDD, se actualiza
          if (this.usuarioActual && (this.usuarioActual as any).diasVacacionesTotales) {
            this.diasTotales = (this.usuarioActual as any).diasVacacionesTotales;
          }
        } catch (e) {
          console.error('Error al parsear el usuario de localStorage', e);
        }
      }
    }
  }

  cargarSolicitudes(): void {
    // 1. Cargar mis solicitudes
    this.apiService.getMisSolicitudes().subscribe({
      next: (data: SolicitudPermiso[]) => {
        this.misSolicitudes = data || [];
        // 🌟 FASE 1: Calculamos el balance en cuanto obtenemos las solicitudes
        this.calcularBolsaDeDias();

        // 🔄 Ejecución asíncrona para evitar NG0100 al renderizar el calendario
        setTimeout(() => {
          this.generarCalendario();
        }, 0);
      },
      error: (err: any) => console.error('Error al cargar mis solicitudes', err),
    });

    // 2. Cargar solicitudes globales para el calendario
    const request = this.apiService.getTodasSolicitudes
      ? this.apiService.getTodasSolicitudes()
      : this.apiService.getMisSolicitudes();

    request.subscribe({
      next: (data: SolicitudPermiso[]) => {
        this.todasLasSolicitudes = data || [];
        setTimeout(() => {
          this.generarCalendario();
        }, 0);
      },
      error: (err: any) => console.error('Error al cargar solicitudes generales', err),
    });
  }

  // 🌟 FASE 1: LÓGICA DE DESCUENTO AUTOMÁTICO DE SALDO Y CÁLCULO DE BOLSA
  calcularBolsaDeDias(): void {
    if (!this.misSolicitudes || this.misSolicitudes.length === 0) {
      this.diasUsados = 0;
      this.diasPendientes = 0;
      this.diasDisponibles = this.diasTotales;
      return;
    }

    // Sumar días aprobados (solo permisos tipo Vacaciones o que consuman saldo)
    this.diasUsados = this.misSolicitudes
      .filter((s) => {
        const estado = (s.estado as string)?.toUpperCase();
        return estado === 'APROBADO' && (s.tipo === TipoPermiso.VACACIONES || !s.tipo);
      })
      .reduce(
        (acc, s) =>
          acc +
          (s.diasSolicitados ||
            (s as any).diasLaborablesCalculados ||
            this.calcularDiasLaborables(s.fechaInicio, s.fechaFin)),
        0,
      );

    // Sumar días pendientes de aprobación
    this.diasPendientes = this.misSolicitudes
      .filter((s) => {
        const estado = (s.estado as string)?.toUpperCase();
        return estado === 'PENDIENTE' && (s.tipo === TipoPermiso.VACACIONES || !s.tipo);
      })
      .reduce(
        (acc, s) =>
          acc +
          (s.diasSolicitados ||
            (s as any).diasLaborablesCalculados ||
            this.calcularDiasLaborables(s.fechaInicio, s.fechaFin)),
        0,
      );

    // Descuento automático de saldo libre
    this.diasDisponibles = Math.max(0, this.diasTotales - this.diasUsados);
  }

  // 🌟 FASE 1: ALGORITMO AUXILIAR DE CÁLCULO DE DÍAS LABORABLES (Sin sábados ni domingos)
  private calcularDiasLaborables(inicioStr: string, finStr: string): number {
    if (!inicioStr || !finStr) return 0;

    const fechaInicio = new Date(inicioStr + 'T00:00:00');
    const fechaFin = new Date(finStr + 'T00:00:00');
    let contadorDias = 0;

    const cursor = new Date(fechaInicio);
    while (cursor <= fechaFin) {
      const diaSemana = cursor.getDay();
      // 0 = Domingo, 6 = Sábado
      if (diaSemana !== 0 && diaSemana !== 6) {
        contadorDias++;
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return contadorDias;
  }

  enviarSolicitud(): void {
    this.mensajeError = '';

    if (!this.usuarioActual) {
      this.obtenerUsuarioSesion();
    }

    // VALIDACIÓN 1: Fechas obligatorias
    if (!this.fechaInicio || !this.fechaFin) {
      this.mensajeError = 'Por favor, selecciona ambas fechas.';
      return;
    }

    // VALIDACIÓN 2: Fecha inicio no mayor que fin
    if (new Date(this.fechaInicio) > new Date(this.fechaFin)) {
      this.mensajeError = 'La fecha de inicio no puede ser posterior a la fecha de fin.';
      return;
    }

    // 🌟 FASE 1: VALIDACIÓN 3 - Saldo disponible suficiente
    const diasSolicitados = this.calcularDiasLaborables(this.fechaInicio, this.fechaFin);
    if (
      this.tipoPermisoSelected === TipoPermiso.VACACIONES &&
      diasSolicitados > this.diasDisponibles
    ) {
      this.mensajeError = `No dispones de suficientes días. Solicitas ${diasSolicitados} días y te quedan ${this.diasDisponibles}.`;
      return;
    }

    // VALIDACIÓN 4: Obtener ID con compatibilidad
    const userId = this.usuarioActual?.id;

    if (!userId) {
      this.mensajeError = 'Sesión no válida o usuario sin ID. Por favor, vuelve a iniciar sesión.';
      console.warn('Usuario actual sin ID:', this.usuarioActual);
      return;
    }

    // ✅ PAYLOAD CORREGIDO: Evita enviar objetos anidados incompletos que disparen el error 400 Bad Request
    const payload: any = {
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      tipo: this.tipoPermisoSelected || 'VACACIONES',
      estado: EstadoSolicitud.PENDIENTE,
      usuarioId: userId, // Referencia directa por ID habitual en Spring Boot DTOs
      usuario: { id: userId },
      diasSolicitados: diasSolicitados,
    };

    this.apiService.solicitarVacaciones(payload).subscribe({
      next: () => {
        alert('¡Solicitud enviada correctamente!');
        this.fechaInicio = '';
        this.fechaFin = '';
        this.mensajeError = '';
        this.cargarSolicitudes();
      },
      error: (err: any) => {
        console.error('Error enviando solicitud:', err);
        const backendMessage = err.error?.message || err.error?.error || err.message;
        this.mensajeError = backendMessage || 'Ocurrió un error al procesar la solicitud.';
      },
    });
  }

  // --- CALENDARIO ---
  generarCalendario(): void {
    const año = this.fechaActual.getFullYear();
    const mes = this.fechaActual.getMonth();

    const primerDiaSemana = new Date(año, mes, 1).getDay();
    const totalDias = new Date(año, mes + 1, 0).getDate();

    // Ajuste para que la semana empiece en Lunes (0=Lu, 6=Do)
    const inicioVacio = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

    const nuevosDias: (number | null)[] = [];

    for (let i = 0; i < inicioVacio; i++) {
      nuevosDias.push(null);
    }

    for (let dia = 1; dia <= totalDias; dia++) {
      nuevosDias.push(dia);
    }

    this.diasDelMes = nuevosDias;

    // ✅ Notificar explícitamente a Angular del cambio en el modelo
    this.cdr.detectChanges();
  }

  cambiarMes(direccion: number): void {
    this.fechaActual.setMonth(this.fechaActual.getMonth() + direccion);
    this.fechaActual = new Date(this.fechaActual);
    this.generarCalendario();
  }

  aplicarFiltroCalendario(): void {
    this.generarCalendario();
  }

  obtenerVacacionesDelDia(dia: number | null): ItemCalendario[] {
    if (!dia) return [];

    const año = this.fechaActual.getFullYear();
    const mes = this.fechaActual.getMonth();
    const fechaEvaluada = new Date(año, mes, dia);
    fechaEvaluada.setHours(0, 0, 0, 0);

    const resultado: ItemCalendario[] = [];

    // Mis solicitudes
    for (const sol of this.misSolicitudes) {
      if (this.estaEnRango(fechaEvaluada, sol.fechaInicio, sol.fechaFin)) {
        resultado.push({
          nombreEmpleado: 'Yo',
          estado: sol.estado || EstadoSolicitud.PENDIENTE,
          esMio: true,
          tipo: sol.tipo,
        });
      }
    }

    if (this.filtroVista === 'mis_vacaciones') {
      return resultado;
    }

    // Compañeros
    const miId = this.usuarioActual?.id;

    for (const sol of this.todasLasSolicitudes) {
      const idPropietario = sol.usuario?.id;
      if (idPropietario === miId) continue;

      const esAprobado =
        sol.estado === EstadoSolicitud.APROBADO || (sol.estado as string) === 'Aprobado';

      if (!esAprobado) continue;

      if (this.estaEnRango(fechaEvaluada, sol.fechaInicio, sol.fechaFin)) {
        let incluir = false;

        if (this.filtroVista === 'todas') {
          incluir = true;
        } else if (this.filtroVista === 'puesto') {
          const puestoCompanero = sol.usuario?.puesto?.id || sol.usuario?.puesto;
          const miPuesto = this.usuarioActual?.puesto?.id || this.usuarioActual?.puesto;
          if (puestoCompanero && miPuesto && puestoCompanero === miPuesto) {
            incluir = true;
          }
        } else if (this.filtroVista === 'delegacion') {
          const delCompanero = sol.usuario?.delegacion?.id || sol.usuario?.delegacion;
          const miDel = this.usuarioActual?.delegacion?.id || this.usuarioActual?.delegacion;
          if (delCompanero && miDel && delCompanero === miDel) {
            incluir = true;
          }
        }

        if (incluir) {
          resultado.push({
            nombreEmpleado: sol.usuario?.nombre || `Usuario #${idPropietario}`,
            estado: 'Aprobado',
            esMio: false,
            tipo: sol.tipo,
          });
        }
      }
    }

    return resultado;
  }

  private estaEnRango(fecha: Date, inicioStr: string, finStr: string): boolean {
    if (!inicioStr || !finStr) return false;

    const fechaTimestamp = fecha.getTime();
    const inicio = new Date(inicioStr + 'T00:00:00').getTime();
    const fin = new Date(finStr + 'T23:59:59').getTime();

    return fechaTimestamp >= inicio && fechaTimestamp <= fin;
  }
}
