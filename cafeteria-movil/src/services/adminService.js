import actividadService from './actividadService';
import categoriaService from './categoriaService';
import compraService from './compraService';
import gastoService from './gastoService';
import inventarioService from './inventarioService';
import notificacionService from './notificacionService';
import preferenciaService from './preferenciaService';
import promocionService from './promocionService';
import reporteService from './reporteService';
import rolService from './rolService';
import usuarioService from './usuarioService';

export const adminService = {
  actividad: actividadService,
  categorias: categoriaService,
  compras: compraService,
  gastos: gastoService,
  inventario: inventarioService,
  notificaciones: notificacionService,
  preferencias: preferenciaService,
  promociones: promocionService,
  reportes: reporteService,
  roles: rolService,
  usuarios: usuarioService,
};

export default adminService;
