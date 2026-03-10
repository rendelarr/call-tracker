# 📞 Call Tracker

Aplicación web para registrar y analizar llamadas telefónicas como agente de call center. Pensada para uso personal: seguimiento de ingresos diarios, ritmo de trabajo, historial por ciclos de pago y proyecciones.

**Live:** [call-tracker.vercel.app](https://call-tracker.vercel.app](https://call-tracker-git-main-rendelarr.vercel.app/)) · **Repo:** [rendelarr/call-tracker](https://github.com/rendelarr/call-tracker)

---

## Stack

- **React 18** (Create React App)
- **localStorage** — persistencia local, sin backend
- **SheetJS (xlsx)** — importación y exportación de archivos Excel/CSV
- Desplegado en **Vercel** (auto-deploy desde `main`)

---

## Características

### Registro de llamadas
- **En vivo** — temporizador que corre mientras dura la llamada; al detener abre el formulario pre-llenado con inicio, fin y duración calculados
- **Manual** — formulario con campos de hora inicio, hora fin y minutos interconectados (cualquier cambio en uno recalcula los otros)
- **Pegar texto** — parsea una línea copiada directamente del sistema de la empresa e interpreta los campos automáticamente

### Tarifas
| Tier | $/min |
|------|-------|
| Normal | $0.12 |
| Bronce | $0.13 |
| Plata  | $0.14 |
| Gold   | $0.15 |

La tarifa activa se selecciona antes de cada registro y afecta el cálculo de pago automático.

### Vistas (tabs)

| Tab | Descripción |
|-----|-------------|
| **Hoy** | Ingresos del día, progreso hacia la meta, lista de llamadas, contador de costo idle |
| **Stats** | Score del día (0–100), comparativa vs ayer y semana pasada, ritmo entre llamadas, heatmap de actividad por hora, racha de días activos |
| **Semana** | Minutos e ingresos de los últimos 7 días con barras comparativas |
| **Ciclo** | Estado del ciclo de pago actual y listado histórico de todos los ciclos |
| **Historial** | Todas las llamadas agrupadas por fecha, colapsables, con edición y borrado individual |

### Meta diaria
Meta de ingresos configurable (default $30). Muestra porcentaje de avance, minutos restantes para alcanzarla y proyección del ciclo actual.

### Contador idle
Muestra cuánto dinero teórico se ha "dejado de ganar" desde la última llamada registrada. Se resetea automáticamente al agregar una nueva llamada.

### Importar / Exportar
- Importa **CSV o Excel** con detección automática de columnas (fecha, hora, duración, billable, etc.)
- Deduplica por `customerId + fecha + hora inicio`
- Exporta a **CSV** o **Excel** con el formato estándar de la empresa

### Ciclos de pago
27 ciclos pre-cargados del 13/12/2025 al 25/12/2026 (quincenal). Muestra días restantes del ciclo, fecha de cobro y proyección de ingresos al ritmo actual.

---

## Estructura del proyecto

```
call-tracker/
├── public/
├── src/
│   └── App.jsx        # Toda la app en un solo archivo
├── package.json
└── README.md
```

Todo el código vive en `src/App.jsx`. La estructura interna está organizada en secciones:

```
Constants → Global styles → Style utilities → Date/time utils →
Time helpers → Data helpers → Import helpers →
TimePicker → Modal → UI components → App()
  ├── State
  ├── Effects
  ├── Derived data
  ├── Event handlers
  └── Render (tabs)
```

---

## Instalación local

```bash
git clone https://github.com/rendelarr/call-tracker.git
cd call-tracker
npm install
npm start
```

La app corre en `http://localhost:3000`.

---

## Deploy

Vercel detecta automáticamente CRA. Cualquier push a `main` dispara un deploy.

```bash
git add src/App.jsx
git commit -m "descripción"
git push origin main
```

---

## Datos y privacidad

Todos los datos se guardan exclusivamente en `localStorage` del navegador bajo las claves `call_tracker_data` y `call_tracker_config`. No hay servidor, no hay base de datos, no se envía nada a ningún lado.

> ⚠️ Limpiar el caché o usar modo incógnito borra los datos. Para no perderlos, exporta a Excel periódicamente.

---

## Roadmap

- [ ] Migración a Firebase (Auth + Firestore) para persistencia entre dispositivos
- [ ] Soporte multi-usuario
- [ ] Contador de minutos faltantes para meta diaria con ETA en tiempo real
