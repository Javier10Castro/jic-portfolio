# E2E Testing — Brief Maestro

## Cargar el script

Abre `brief-maestro.html` en el navegador y pega en la consola DevTools:

```javascript
fetch('/scripts/load-e2e.js').then(r => r.text()).then(eval)
```

Tambien disponible via URL completa en produccion:

```
https://web-portfolio-kappa-wheat.vercel.app/scripts/load-e2e.js
```

Si el archivo no esta disponible (e.g., servidor local), copia el contenido directamente desde otro lado:

```javascript
// Copia el contenido de public/scripts/load-e2e.js y pegalo en la consola
```

Una vez cargado, veras:

```
[E2E] ==============================
[E2E]   E2E Loader v1 loaded
[E2E]
[E2E]   Helpers disponibles:
[E2E]   e2eSalmos()            Envia brief con datos de Salmos Cafe
[E2E]   e2eInkognita()         Envia brief con datos de Inkognita Agency
[E2E]   e2eCustom({...})       Envia brief con datos personalizados
[E2E]   showCurrentFormData()  Inspecciona formData actual
[E2E]   clearFormData()        Resetea formData
[E2E] ...
```

## Ejecutar pruebas

### Envio rapido con Salmos Cafe

```javascript
e2eSalmos()
```

Envía un brief completo al endpoint `/api/sendBrief` usando los datos de prueba de Salmos Cafe. El contacto por defecto es:

- Name: Javier Ibrahim
- Email: contacto@salmoscafe.com
- Company: Salmos Cafe

Para personalizar el contacto:

```javascript
e2eSalmos({ name: "Cliente Test", email: "test@test.com", company: "Mi Empresa" })
```

### Envio rapido con Inkognita Agency

```javascript
e2eInkognita()
```

Misma logica pero con datos de una agencia de branding digital. Contrasta con Salmos Cafe (industria, tono, audiencia diferente).

### Envio con datos personalizados

```javascript
e2eCustom({
  name: "Javier",
  email: "test@test.com",
  company: "Mi Empresa"
})
```

Para usar datos de formulario personalizados ademas del contacto:

```javascript
e2eCustom({
  name: "Javier",
  email: "test@test.com",
  formData: {
    biz_name: "Mi Negocio",
    obj_principal: "Vender mas",
    // ... otros campos
  }
})
```

Si no se provee `formData`, se usan los datos de Salmos Cafe por defecto.

## Flujo de respuesta

Cada helper retorna un objeto con:

```javascript
{
  response: Response,      // Objeto Response de fetch
  body: { ... },           // Cuerpo parseado de la respuesta
  elapsed: 1234            // Milisegundos totales
}
```

La consola muestra el flujo completo:

```
[E2E] Loading test data...
[E2E-Brief] ================================
[E2E-Brief] E2E Brief Maestro - Bypass del Wizard
[E2E-Brief] Mode: 2 (1=submitContact, 2=direct API)
...
[E2E-Brief] [SEND] Sending request...
[E2E-Brief] [RECV] Response received (2340ms)
[E2E-Brief]   status: 202
[E2E-Brief]   ok: true
[E2E-Brief]   requestId: a1b2c3d4-e5f6-7890-abcd-ef1234567890
[E2E-Brief]   queuePosition: 0
[E2E-Brief]   queueDepth: 0
[E2E-Brief]   full body: { ... }
[E2E-Brief] [INFO] To inspect lifecycle: GET /api/sendBrief?id=a1b2c3d4-...
[E2E] Request completed.
```

## Inspeccionar requestId

El `requestId` se muestra en la respuesta. Para inspeccionar el lifecycle completo de un request:

```javascript
// Copia el requestId de la respuesta y ejecuta:
fetch('/api/sendBrief?id=a1b2c3d4-e5f6-7890-abcd-ef1234567890')
  .then(r => r.json())
  .then(console.log)
```

Esto devuelve:

```json
{
  "requestId": "a1b2c3d4-...",
  "status": "completed",
  "receivedAt": "2026-06-10T22:00:00.000Z",
  "queuedAt": "2026-06-10T22:00:00.001Z",
  "executionStartedAt": "2026-06-10T22:00:00.002Z",
  "executionFinishedAt": "2026-06-10T22:00:05.000Z",
  "queueWaitTimeMs": 1,
  "executionDurationMs": 4998,
  "totalLifecycleTimeMs": 5000
}
```

## Inspeccionar formData actual

```javascript
showCurrentFormData()
```

Muestra en consola el contenido actual de `formData` usando `console.table()`. Util para depurar que datos se enviaran.

## Resetear formData

```javascript
clearFormData()
```

Resetea todos los valores de `formData` a su estado vacio (strings vacios, arrays vacios, objetos vacios, numeros a 0). No afecta la UI del wizard ni los datos en localStorage.

## Seguridad

- `load-e2e.js` NO se referencia desde ningun HTML
- Solo se activa cuando el desarrollador lo carga manualmente desde la consola
- En produccion, el archivo existe como static asset pero nunca se ejecuta automaticamente
- Los datos de prueba solo afectan la sesion actual del navegador
- `clearFormData()` solo resetea `formData` en memoria, no borra datos de usuarios reales

## Archivos del sistema

| Archivo | Proposito |
|---|---|
| `public/scripts/load-e2e.js` | Loader + helpers globales + datos Inkognita |
| `public/scripts/e2e-brief-bypass-wizard.js` | Script base E2E (IIFE, expone `runBriefE2E`) |
| `test-data.json` | Test fixture original (Salmos Cafe, fuente para el wizard auto-load) |
| `docs/E2E-TESTING.md` | Esta documentacion |

## Datos de prueba disponibles

| Dataset | Helper | Industria | Perfil |
|---|---|---|---|
| Salmos Cafe | `e2eSalmos()` | Food & Beverage | B2C, local, evento |
| Inkognita Agency | `e2eInkognita()` | Branding digital | B2B, nacional, servicio |
