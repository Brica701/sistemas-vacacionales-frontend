import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api'; // Asegúrate de que esta ruta apunte a tu api.ts de servicios

@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-admin.html', 
  styleUrl: './panel-admin.css'
})
export class PanelAdminComponent implements OnInit {

  // --- ARRAYS DE DATOS REALES (Se llenarán desde Neon) ---
  usuarios: any[] = [];
  puestos: any[] = [];
  delegaciones: any[] = [];
  festivos: any[] = [];
  solicitudesPendientes: any[] = [];
  todasLasSolicitudes: any[] = []; 

  // --- MODELOS PARA FORMULARIOS ---
  nuevoUsuario: any = { id: null, nombre: '', email: '', puesto: '', delegacion: '' };
  nuevoPuesto: any = { id: null, nombre: '' };
  nuevaDelegacion: any = { id: null, nombre: '', ciudad: '' };
  nuevoFestivo: any = { id: null, fecha: '', descripcion: '', delegacionId: '' };

  motivosRechazo: { [key: number]: string } = {}; 
  mensajeError: string = '';

  // --- VARIABLES DEL CALENDARIO GLOBAL ---
  fechaActual: Date = new Date();
  diasDelMes: (number | null)[] = [];
  nombresMeses: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // --- CONTROL DE PESTAÑAS ---
  pestanaActiva: string = 'vacaciones'; // 'vacaciones' | 'usuarios' | 'puestos' | 'delegaciones' | 'festivos'

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  // --- CARGA DE DATOS DESDE EL BACKEND ---
  cargarDatos(): void {
    // 1. Cargar Usuarios
    this.apiService.getUsuarios().subscribe({
      next: (data: any[]) => this.usuarios = data,
      error: (err) => console.error('Error al cargar usuarios desde Neon:', err)
    });

    // 2. Cargar Puestos
    this.apiService.getPuestos().subscribe({
      next: (data: any[]) => this.puestos = data,
      error: (err) => console.error('Error al cargar puestos:', err)
    });

    // 3. Cargar Delegaciones
    this.apiService.getDelegaciones().subscribe({
      next: (data: any[]) => this.delegaciones = data,
      error: (err) => console.error('Error al cargar delegaciones:', err)
    });

    // 4. Cargar Festivos
    this.apiService.getFestivos().subscribe({
      next: (data: any[]) => this.festivos = data,
      error: (err) => console.error('Error al cargar festivos:', err)
    });

    // 5. Cargar Solicitudes Pendientes de Vacaciones
    this.apiService.getSolicitudesPendientes().subscribe({
      next: (data: any[]) => this.solicitudesPendientes = data,
      error: (err) => console.error('Error al cargar solicitudes pendientes:', err)
    });

    // 6. Cargar el Histórico Global de Vacaciones (para pintar en el calendario)
    // Nota: Si en tu ApiService el método se llama diferente, ajusta esta línea
    this.apiService.getSolicitudesPendientes().subscribe({ 
      next: (data: any[]) => {
        this.todasLasSolicitudes = data;
        this.generarCalendario();
      },
      error: (err) => {
        console.error('Error al cargar histórico global de vacaciones:', err);
        this.generarCalendario(); 
      }
    });
  }

  cambiarPestana(pestana: string): void {
    this.pestanaActiva = pestana;
  }

  // --- CRUD REAL DE USUARIOS ---
  guardarUsuario(): void {
    if (!this.nuevoUsuario.nombre || !this.nuevoUsuario.email) return;

    this.apiService.guardarUsuario(this.nuevoUsuario).subscribe({
      next: () => {
        this.cargarDatos(); // Recarga la lista real de la BD
        this.resetUsuarioForm();
      },
      error: (err) => alert('Error al guardar el usuario: ' + err.message)
    });
  }

  editarUsuario(u: any): void { 
    this.nuevoUsuario = { ...u }; 
  }

  eliminarUsuario(id: number): void { 
    if (confirm('¿Seguro que deseas eliminar este usuario de la base de datos?')) {
      this.apiService.eliminarUsuario(id).subscribe({
        next: () => this.cargarDatos(),
        error: (err) => alert('Error al eliminar usuario')
      });
    }
  }

  resetUsuarioForm(): void { 
    this.nuevoUsuario = { id: null, nombre: '', email: '', puesto: '', delegacion: '' }; 
  }

  // --- CRUD REAL DE PUESTOS ---
  guardarPuesto(): void {
    if (!this.nuevoPuesto.nombre) return;

    this.apiService.guardarPuesto(this.nuevoPuesto).subscribe({
      next: () => {
        this.cargarDatos();
        this.nuevoPuesto = { id: null, nombre: '' };
      },
      error: (err) => alert('Error al guardar puesto')
    });
  }

  editarPuesto(p: any): void { 
    this.nuevoPuesto = { ...p }; 
  }

  eliminarPuesto(id: number): void { 
    if (confirm('¿Deseas eliminar este puesto?')) {
      this.apiService.eliminarPuesto(id).subscribe({
        next: () => this.cargarDatos(),
        error: (err) => alert('Error al eliminar puesto')
      });
    }
  }

  // --- CRUD REAL DE DELEGACIONES ---
  guardarDelegacion(): void {
    if (!this.nuevaDelegacion.nombre) return;

    this.apiService.guardarDelegacion(this.nuevaDelegacion).subscribe({
      next: () => {
        this.cargarDatos();
        this.nuevaDelegacion = { id: null, nombre: '', ciudad: '' };
      },
      error: (err) => alert('Error al guardar delegación')
    });
  }

  editarDelegacion(d: any): void { 
    this.nuevaDelegacion = { ...d }; 
  }

  eliminarDelegacion(id: number): void { 
    if (confirm('¿Deseas eliminar esta delegación?')) {
      this.apiService.eliminarDelegacion(id).subscribe({
        next: () => this.cargarDatos(),
        error: (err) => alert('Error al eliminar delegación')
      });
    }
  }

  // --- CRUD REAL DE FESTIVOS ---
  guardarFestivo(): void {
    if (!this.nuevoFestivo.fecha || !this.nuevoFestivo.descripcion) return;
    
    const valorDelegacion = this.nuevoFestivo.delegacionId !== '' ? Number(this.nuevoFestivo.delegacionId) : '';

    this.apiService.guardarFestivo({ ...this.nuevoFestivo, delegacionId: valorDelegacion }).subscribe({
      next: () => {
        this.cargarDatos();
        this.resetFestivoForm();
      },
      error: (err) => alert('Error al guardar el día festivo')
    });
  }

  editarFestivo(f: any): void { 
    this.nuevoFestivo = { ...f, delegacionId: f.delegacionId ?? '' }; 
  }

  eliminarFestivo(id: number): void { 
    if (confirm('¿Deseas eliminar este festivo?')) {
      this.apiService.eliminarFestivo(id).subscribe({
        next: () => this.cargarDatos(),
        error: (err) => alert('Error al eliminar festivo')
      });
    }
  }

  resetFestivoForm(): void {
    this.nuevoFestivo = { id: null, fecha: '', descripcion: '', delegacionId: '' };
  }

  // --- GESTIÓN DE VACACIONES REALES ---
  resolver(id: number, accion: 'Aprobado' | 'Rechazado'): void {
    const motivo = this.motivosRechazo[id] || '';
    if (accion === 'Rechazado' && !motivo.trim()) {
      alert('Por favor, escribe un motivo para rechazar la solicitud.');
      return;
    }

    this.apiService.resolverSolicitud(id, accion, motivo).subscribe({
      next: () => {
        this.cargarDatos(); 
        delete this.motivosRechazo[id]; 
      },
      error: (err) => alert(err.error?.error || 'Error al procesar la acción en el servidor.')
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
    
    for (let i = 0; i < inicioVacio; i++) this.diasDelMes.push(null);
    for (let dia = 1; dia <= totalDias; dia++) this.diasDelMes.push(dia);
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
    const fechaEvaluada = new Date(año, mes, dia);
    const empleadosEncontrados: string[] = [];

    for (const solicitud of this.todasLasSolicitudes) {
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