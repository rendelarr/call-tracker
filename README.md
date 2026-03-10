# 📞 Call Tracker

Aplicación web para registrar, analizar y optimizar tu productividad como agente de llamadas telefónicas. Incluye gamificación, pomodoro, ciclos de pago y análisis de rendimiento.

---

## ¿Qué hace?

- **Registra llamadas** manualmente, pegando texto copiado, o cronometrando en vivo
- **Calcula tus ingresos** según la tarifa activa (Normal / Bronce / Plata / Gold)
- **Visualiza tu progreso** diario, semanal y por ciclo de pago
- **Te motiva** con misiones diarias, logros, niveles de XP y un score del día
- **Te mantiene enfocado** con un timer Pomodoro y alarma de inactividad

---

## Pantallas

| Tab | Qué muestra |
|-----|-------------|
| **Hoy** | Ingresos del día, barra de meta, lista de llamadas, acciones rápidas |
| **Stats** | Score, ritmo, heatmap por hora, racha, nivel XP, misiones y logros |
| **Semana** | Barras comparativas de minutos e ingresos de los últimos 7 días |
| **Ciclo** | Progreso del ciclo de pago actual y proyección de ingresos |
| **Focus** | Pomodoro configurable + alarma de inactividad |
| **Historial** | Todas las llamadas agrupadas por fecha |

---

## Cómo agregar llamadas

### Opción 1 — En vivo
Pulsa **▶ En vivo** al iniciar la llamada. Al terminar pulsa **⏹ Detener** y se abre un formulario con el tiempo ya calculado.

### Opción 2 — Manual
Pulsa **✏️ Manual** e ingresa hora de inicio, hora de fin (o minutos directamente) e ID del cliente. El pago se calcula automáticamente.

### Opción 3 — Pegar texto
Pulsa **📋 Pegar**, selecciona tu tarifa activa y pega la fila copiada directamente de tu plataforma. La app interpreta el texto automáticamente.

### Opción 4 — Importar CSV/Excel
Pulsa **⚙** en el header y sube tu archivo. Detecta automáticamente las columnas y evita duplicados.

---

## Botones del header

| Botón | Función |
|-------|---------|
| **◎ Meta** | Configura tu meta de ingresos diaria |
| **⚙** | Importa llamadas desde CSV o Excel |

---

## Tarifas

| Nivel | $/min |
|-------|-------|
| Normal | $0.12 |
| Bronce | $0.13 |
| Plata | $0.14 |
| Gold | $0.15 |

Las llamadas marcadas como **Surge** en los comentarios del CSV se identifican automáticamente.

---

## Ciclos de pago

Los ciclos van de 2026-03-07 hasta 2026-12-30, con frecuencia quincenal. La app detecta el ciclo actual automáticamente y muestra días restantes, total acumulado y proyección.

---

## Gamificación

- **Score del día** (0–100): combina cumplimiento de meta (40pts), ritmo entre llamadas (30pts), racha de días (20pts) y actividad (10pts)
- **8 misiones diarias** aleatorias que rotan cada día
- **12 logros** permanentes desbloqueables
- **6 niveles** de XP: Novato → Aprendiz → Trabajador → Profesional → Experto → Élite

---

## Tecnologías

- React 18 (Create React App)
- Vanilla CSS con variables (sin librerías de UI)
- localStorage para persistencia de datos
- SheetJS (xlsx) para importación de archivos Excel
- Desplegado en Vercel

---

## Instalación local

```bash
# Clonar el repo
git clone https://github.com/rendelarr/call-tracker.git
cd call-tracker

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

Requiere Node.js 16+.

---

## Deploy en Vercel

1. Conecta el repositorio en [vercel.com](https://vercel.com)
2. En **Settings → General → Root Directory** establece `call-tracker`
3. Framework: **Create React App** (se detecta automáticamente)
4. Deploy

Cada `git push` a `main` dispara un redeploy automático.

---

## Datos y privacidad

Todos los datos se almacenan **únicamente en el navegador** (`localStorage`). No se envía ningún dato a servidores externos. Limpiar el caché del navegador borra los datos.

---

## Repositorio

[github.com/rendelarr/call-tracker](https://github.com/rendelarr/call-tracker)
