import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VacacionesService, SolicitudVacaciones } from '../../services/vacaciones';

@Component({
  selector: 'app-panel-empleado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-empleado.html',
  styleUrl: './panel-empleado.css',
})
export class PanelEmpleadoComponent implements OnInit {
  
  misSolicitudes: SolicitudVacaciones[] = [];
  fechaInicio: string = '';
  fechaFin: string = '';
  mensajeError: string = '';

  // Variables para el Calendario Interactivo
  fechaActual: Date = new Date();
  diasDelMes: (number | null)[] = [];
  nombresMeses: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  constructor(private vacacionesService: VacacionesService) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
    this.generarCalendario();
  }

  cargarSolicitudes(): void {
    this.vacacionesService.getMisSolicitudes().subscribe({
      next: (data: any) => {
        this.misSolicitudes = data;
        this.generarCalendario(); // Re-calcula los colores al recibir los datos
      },
      error: (err: any) => console.error('Error al cargar solicitudes', err)
    });
  }

  enviarSolicitud(): void {
    this.mensajeError = '';
    if (!this.fechaInicio || !this.fechaFin) {
      this.mensajeError = 'Por favor, selecciona ambas fechas.';
      return;
    }

    this.vacacionesService.solicitarVacaciones(this.fechaInicio, this.fechaFin).subscribe({
      next: () => {
        this.cargarSolicitudes();
        this.fechaInicio = '';
        this.fechaFin = '';
      },
      error: (err: any) => {
        this.mensajeError = err.error?.error || 'Ocurrió un error al procesar la solicitud.';
      }
    });
  }

  // --- LÓGICA DEL CALENDARIO ---
  generarCalendario(): void {
    const año = this.fechaActual.getFullYear();
    const mes = this.fechaActual.getMonth();

    // Primer día del mes y total de días
    const primerDiaSemana = new Date(año, mes, 1).getDay(); // 0: Dom, 1: Lun...
    const totalDias = new Date(año, mes + 1, 0).getDate();

    // Ajustar para que la semana empiece en Lunes (en JS 0 es Domingo)
    const inicioVacio = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

    this.diasDelMes = [];

    // Rellenar huecos vacíos del inicio de mes
    for (let i = 0; i < inicioVacio; i++) {
      this.diasDelMes.push(null);
    }

    // Rellenar los días del mes reales
    for (let dia = 1; dia <= totalDias; dia++) {
      this.diasDelMes.push(dia);
    }
  }

  cambiarMes(direccion: number): void {
    this.fechaActual.setMonth(this.fechaActual.getMonth() + direccion);
    this.fechaActual = new Date(this.fechaActual); // Forzar refresco en Angular
    this.generarCalendario();
  }

  // Comprueba el estado de un día concreto para pintarlo en el calendario
  obtenerEstadoDia(dia: number | null): string {
    if (!dia) return 'vacio'; // Si el hueco es gris/vacío, devuelve esto

    const año = this.fechaActual.getFullYear();
    const mes = this.fechaActual.getMonth();
    const fechaEvaluada = new Date(año, mes, dia);

    // Recorremos las solicitudes para ver si esta fecha cae dentro de alguna
    for (const solicitud of this.misSolicitudes) {
      const inicio = new Date(solicitud.fechaInicio);
      const fin = new Date(solicitud.fechaFin);

      // Normalizar horas para comparar solo año-mes-día
      inicio.setHours(0,0,0,0);
      fin.setHours(23,59,59,999);

      if (fechaEvaluada >= inicio && fechaEvaluada <= fin) {
        return solicitud.estado || 'Pendiente'; 
      }
    }

    
    return 'libre'; 
  }
} 