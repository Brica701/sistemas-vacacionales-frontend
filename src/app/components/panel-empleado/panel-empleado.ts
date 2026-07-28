import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

interface ItemCalendario {
  nombreEmpleado: string;
  estado: string;
  esMio: boolean;
}

@Component({
  selector: 'app-panel-empleado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-empleado.html',
  styleUrl: './panel-empleado.css',
})
export class PanelEmpleadoComponent implements OnInit {
  usuarioActual: any = null;

  misSolicitudes: any[] = [];
  todasLasSolicitudes: any[] = [];

  fechaInicio: string = '';
  fechaFin: string = '';
  mensajeError: string = '';

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

  constructor(private apiService: ApiService) {}

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
        } catch (e) {
          console.error('Error al parsear el usuario de localStorage', e);
        }
      }
    }
  }

  cargarSolicitudes(): void {
    // 1. Cargar mis solicitudes
    this.apiService.getMisSolicitudes().subscribe({
      next: (data: any) => {
        this.misSolicitudes = data || [];
        this.generarCalendario();
      },
      error: (err: any) => console.error('Error al cargar mis solicitudes', err),
    });

    // 2. Cargar solicitudes globales para el calendario
    const request = this.apiService.getTodasSolicitudes
      ? this.apiService.getTodasSolicitudes()
      : this.apiService.getMisSolicitudes();

    request.subscribe({
      next: (data: any) => {
        this.todasLasSolicitudes = data || [];
        this.generarCalendario();
      },
      error: (err: any) => console.error('Error al cargar solicitudes generales', err),
    });
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

    // VALIDACIÓN 2: Obtener ID con compatibilidad/fallback
    const userId = this.usuarioActual?.id || this.usuarioActual?.usuarioId;

    if (!userId) {
      this.mensajeError = 'Sesión no válida o usuario sin ID. Por favor, vuelve a iniciar sesión.';
      console.warn('Usuario actual sin ID:', this.usuarioActual);
      return;
    }

    const payload = {
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      estado: 'Pendiente',
      usuario: { id: userId },
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
        this.mensajeError = err.error?.error || 'Ocurrió un error al procesar la solicitud.';
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

    this.diasDelMes = [];

    for (let i = 0; i < inicioVacio; i++) {
      this.diasDelMes.push(null);
    }

    for (let dia = 1; dia <= totalDias; dia++) {
      this.diasDelMes.push(dia);
    }
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
          estado: sol.estado || 'Pendiente',
          esMio: true,
        });
      }
    }

    if (this.filtroVista === 'mis_vacaciones') {
      return resultado;
    }

    // Compañeros
    const miId = this.usuarioActual?.id || this.usuarioActual?.usuarioId;

    for (const sol of this.todasLasSolicitudes) {
      const idPropietario = sol.usuario?.id || sol.usuario?.usuarioId;
      if (idPropietario === miId) continue;
      if (sol.estado !== 'Aprobado') continue;

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
          });
        }
      }
    }

    return resultado;
  }

  private estaEnRango(fecha: Date, inicioStr: string, finStr: string): boolean {
    if (!inicioStr || !finStr) return false;

    // Normalizar a formato YYYY-MM-DD ignorando discrepancias de zona horaria
    const fechaTimestamp = fecha.getTime();
    const inicio = new Date(inicioStr + 'T00:00:00').getTime();
    const fin = new Date(finStr + 'T23:59:59').getTime();

    return fechaTimestamp >= inicio && fechaTimestamp <= fin;
  }
}
