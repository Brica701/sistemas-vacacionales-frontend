import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// CORREGIDO: Apunta a '../../services/vacaciones' porque tu archivo se llama vacaciones.ts
import { VacacionesService, SolicitudVacaciones } from '../../services/vacaciones';

@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-admin.html', 
  styleUrl: './panel-admin.css'
})
export class PanelAdminComponent implements OnInit {

  solicitudesPendientes: SolicitudVacaciones[] = [];
  todasLasSolicitudes: SolicitudVacaciones[] = []; // Nueva lista para alimentar el calendario global
  motivosRechazo: { [key: number]: string } = {}; 
  mensajeError: string = '';

  // Variables para el Calendario de Administración Global
  fechaActual: Date = new Date();
  diasDelMes: (number | null)[] = [];
  nombresMeses: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  constructor(private vacacionesService: VacacionesService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  // Carga simultáneamente las pendientes y el resto para mantener actualizado el sistema
  cargarDatos(): void {
    this.cargarPendientes();
    this.cargarTodas();
  }

  cargarPendientes(): void {
    this.vacacionesService.getSolicitudesPendientes().subscribe({
      next: (data: any) => this.solicitudesPendientes = data, 
      error: (err: any) => console.error('Error al cargar pendientes', err) 
    });
  }

  // Trae todo el listado general del backend para filtrar las aprobadas en el calendario
  cargarTodas(): void {
    // Nota: Si tu Spring Boot aún no tiene un endpoint general de admin, puedes reusar provisionalmente
    // getMisSolicitudes o mapearlo al endpoint general que tengas configurado.
    this.vacacionesService.getMisSolicitudes().subscribe({
      next: (data: any) => {
        this.todasLasSolicitudes = data;
        this.generarCalendario();
      },
      error: (err: any) => {
        console.error('Error al cargar el histórico global', err);
        this.generarCalendario(); // Generar aunque venga vacío para evitar pantallas en blanco
      }
    });
  }

  resolver(id: number, accion: 'Aprobado' | 'Rechazado'): void {
    const motivo = this.motivosRechazo[id] || '';

    if (accion === 'Rechazado' && !motivo.trim()) {
      alert('Por favor, escribe un motivo para rechazar la solicitud.');
      return;
    }

    this.vacacionesService.resolverSolicitud(id, accion, motivo).subscribe({
      next: () => {
        this.cargarDatos(); // Recarga tabla y calendario automáticamente
        delete this.motivosRechazo[id]; 
      },
      error: (err: any) => { 
        alert(err.error?.error || 'Error al procesar la acción.');
      }
    });
  }

  // --- LÓGICA DEL CALENDARIO GLOBAL ---
  generarCalendario(): void {
    const año = this.fechaActual.getFullYear();
    const mes = this.fechaActual.getMonth();

    const primerDiaSemana = new Date(año, mes, 1).getDay(); 
    const totalDias = new Date(año, mes + 1, 0).getDate();
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

  // Devuelve un array con las strings de los usuarios (IDs o nombres) que están aprobados en este día
  obtenerEmpleadosDeVacaciones(dia: number | null): string[] {
    if (!dia) return [];

    const año = this.fechaActual.getFullYear();
    const mes = this.fechaActual.getMonth();
    const fechaEvaluada = new Date(año, mes, dia);
    const empleadosEncontrados: string[] = [];

    for (const solicitud of this.todasLasSolicitudes) {
      // Filtrar estrictamente solo las que el Administrador ya ha aceptado
      if (solicitud.estado === 'Aprobado') {
        const inicio = new Date(solicitud.fechaInicio);
        const fin = new Date(solicitud.fechaFin);
        
        inicio.setHours(0,0,0,0);
        fin.setHours(23,59,59,999);

        if (fechaEvaluada >= inicio && fechaEvaluada <= fin) {
          const identificador = solicitud.usuario?.nombre || `User #${solicitud.usuario?.id || '?'}`;
          if (!empleadosEncontrados.includes(identificador)) {
            empleadosEncontrados.push(identificador);
          }
        }
      }
    }
    return empleadosEncontrados;
  }
}