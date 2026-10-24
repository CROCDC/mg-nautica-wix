# Newsletter con alertas por modelo — Plan

> **Objetivo:** que un visitante elija los modelos de barco que busca (Colibrí, Bries,
> Plenamar, Limbo…), deje su **WhatsApp o su email**, y quede suscripto para que MG Náutica
> le avise cuando ingrese una embarcación de ese modelo.

---

## 1. Decisiones

| Tema | Decisión | Por qué |
|---|---|---|
| Dónde se guardan los suscriptores | **Wix CRM (Contactos)** | Es el backend del sitio (plan headless §2): el dueño ya trabaja en el panel de Wix. No sumamos una base de datos ni un proveedor nuevo. |
| Cómo se guardan los modelos | **Etiquetas de contacto** en Wix: `Newsletter` + una por modelo (`Modelo: Colibrí`) | En el panel se filtran contactos por etiqueta: "entró un Plenamar 23" → etiqueta `Modelo: Plenamar`. |
| Canal | **WhatsApp (por defecto) o email**, uno por suscripción, con etiqueta `Canal: WhatsApp` / `Canal: Email` | WhatsApp es como el broker ya habla con compradores. La etiqueta dice al dueño por dónde escribirle a cada uno. |
| Teléfono | **E.164** (`+5491126949628`) con `libphonenumber-js`, prefijo 🇦🇷 +54 / 🇺🇾 +598 o "+código" tipeado | Así el número abre un chat directo. En Argentina se restituye el 9 de celular: la gente escribe "11 2694-9628", que sin el 9 es un fijo al que WhatsApp no llega. |
| Consentimiento | Email: **suscripción `SUBSCRIBED`** (Email Subscriptions API). WhatsApp: la **etiqueta `Canal: WhatsApp`** es el registro del opt-in | Wix Email Marketing solo envía a suscriptos y maneja la baja. Wix no tiene un estado de suscripción para WhatsApp; la baja se pide por el chat. |
| Lista de modelos | **Curada a mano** en `lib/boat-models.ts`, veleros y motor juntos | Regla del dueño (plan headless §15): **nada se deduce del texto**. Incluye modelos que hoy *no* están en el catálogo (Colibrí, Bries). |
| Granularidad | **Familia de modelo** (Plenamar, no "Plenamar 23" y "Plenamar 36") | Quien busca un Plenamar quiere enterarse de cualquier eslora. |
| Envío del formulario | **Server Action** de Next.js, sin endpoint público aparte | La API key de Wix queda solo en el servidor. Funciona sin JS (mejora progresiva). |
| Credencial | **`WIX_API_KEY` + `WIX_SITE_ID`** (documentadas en `.env.example`) | Crear contactos y suscripciones exige identidad de app (API key); el token de visitante no alcanza. |
| Anti-spam | **Honeypot** (campo oculto) + validación estricta del lado servidor | Barato y sin fricción. Rate-limit real queda para después (§7). |

## 2. Flujo

```
Visitante ─► /newsletter (embarcaciones + WhatsApp o email)
                │  Server Action subscribeToNewsletter(formData)
                ▼
        parseNewsletterForm()  ── honeypot lleno → "ok" sin tocar Wix
                │  número o email inválido → error en el form (se conserva todo)
                ▼
        lib/newsletter.ts (server-only, API key)
          1. labels.findOrCreateLabel("Newsletter"), ("Canal: …"), ("Modelo: <X>") …  (en paralelo)
          2. contacts.createContact({ phone | email, labels })
               └─ 409 DUPLICATE_CONTACT_EXISTS → usa duplicateContactId
          3. contacts.labelContact(id, labels)          (agrega, no pisa intereses previos)
          4. solo email: emailSubscriptions.upsertEmailSubscription({ email, SUBSCRIBED })
                ▼
        "¡Listo! Te escribimos por WhatsApp apenas ingrese un Colibrí o Bries."
```

Volver a suscribirse con el mismo número o email **suma** modelos; no borra los anteriores
(eso se hace desde el panel de Wix).

## 3. Cambios en el código

| Archivo | Qué |
|---|---|
| `lib/boat-models.ts` | Lista curada `BOAT_MODELS`, `parseModels()`, `modelLabel()` y `suggestModels()` (sugerencias mientras se escribe). Sin `server-only`: el form cliente la usa. |
| `lib/newsletter-form.ts` | Lo que comparten el form y la Server Action: canales, prefijos de país, estado del form, honeypot. Va al navegador, así que nada pesado. |
| `lib/newsletter-input.ts` | `server-only`. Validación del formulario (canal, email, teléfono, modelos, honeypot). |
| `lib/phone.ts` | `server-only`. `parseWhatsAppNumber()`: número tipeado → E.164 (con la corrección del 9 argentino). Usa la metadata completa de `libphonenumber-js` (~145KB), que no llega al navegador. |
| `lib/newsletter.ts` | `server-only`. Cliente Wix con `ApiKeyStrategy` + `subscribe()` (pasos 1–4). |
| `app/newsletter/actions.ts` | Server Action: valida, llama a `subscribe()`, devuelve el estado del form. |
| `app/newsletter/page.tsx` | Página `/newsletter`: banner y formulario. Lee `?modelo=` (repetible) para llegar con modelos ya agregados. |
| `components/NewsletterForm.tsx` | Form compacto: campo predictivo de embarcaciones (varias, como etiquetas), selector WhatsApp/Email, número con prefijo o email, "Activar alertas". Confirmación con foco. |
| `app/page.tsx` | Tarjeta "¿No está el barco que buscás?" al cierre de *Últimos ingresos*, con botón "Crear mi alerta". |
| `components/Footer.tsx` | Link "Newsletter" en la columna Empresa. |
| `app/main.css` | Estilos del form (mismo sistema navy/gold). |
| `.env.example` / `README.md` | Permisos que necesita la API key. |

## 4. Tests

- **Unit**: `tests/unit/boat-models.spec.ts` (lista, orden de sugerencias),
  `tests/unit/newsletter-input.spec.ts` (canal, email, teléfono, honeypot, topes de largo),
  `tests/unit/phone.spec.ts` (todas las formas de escribir un celular argentino → el mismo
  E.164; Uruguay; "+código"; números inválidos).
- **E2E** (`tests/e2e-newsletter.spec.ts`): alta por WhatsApp (por defecto) y por email, prefijo
  Uruguay, número sin código de área, cambio de canal sin perder lo tipeado, contacto ya
  existente (409), Wix caído, campo predictivo (sugerencias, teclado, click, sin repetidos,
  quitar), preselección por URL, entrada desde la home y versión 375px.
- **Mock de Wix**: los endpoints de **escritura** del CRM se **simulan** en
  `tests/mock/wix-http-mock.mjs` (nunca se graban: grabarlos crearía contactos reales en el CRM
  del dueño). Emails especiales disparan los casos borde (`existente-…` → 409, `falla-…` → 500).
- `/newsletter` entra en `PUBLIC_PAGES` → cubierto por responsive, overflow y rutas.

## 5. Puesta en marcha (una vez, en Wix + Vercel)

1. Wix → **Configuración → API Keys** → crear key con permisos **Manage Contacts** (contactos
   y etiquetas) y **Manage Email Marketing / Email Subscriptions**.
2. Vercel → variables de entorno (Production + Preview): `WIX_API_KEY` y `WIX_SITE_ID`.
3. Probar un alta por WhatsApp y otra por email en el Preview y verlas en Wix → **Contactos**
   con sus etiquetas y el teléfono en formato internacional.

Sin la API key el sitio funciona igual; el form muestra "no disponible por ahora" y lo loguea.

## 6. Enviar los avisos

Hoy el sitio **junta** suscriptores; no envía nada. Cuando entra un barco:

- **Email** — Wix Email Marketing: campaña a los contactos con `Canal: Email` + `Modelo: X`.
- **WhatsApp, a mano (disponible ya)** — en Wix Contactos filtrar `Canal: WhatsApp` +
  `Modelo: X` y escribirles desde WhatsApp Business (o una lista de difusión). Sin costo ni
  aprobaciones; sirve mientras el volumen sea chico.
- **WhatsApp, automático (fase siguiente)** — WhatsApp Cloud API de Meta: requiere cuenta de
  WhatsApp Business verificada, un número dedicado, **plantillas de mensaje de marketing
  aprobadas por Meta** (un aviso a alguien que no escribió en las últimas 24 h solo puede
  salir como plantilla) y tiene costo por conversación. El disparo sería el mismo que para el
  email automático (§7).

## 7. Después (fuera de este cambio)

- **Aviso automático** cuando entra un barco: webhook de producto creado en Wix → buscar
  contactos con la etiqueta del modelo → enviar por su canal. Requiere decidir cómo mapear el
  nombre de la publicación a un modelo (hoy el dueño escribe "VELERO PLENAMAR 23 | …").
- Mensaje de bienvenida al suscribirse (email por Wix Automations; WhatsApp por plantilla).
- Linkear `/newsletter?modelo=…` (ya soportado) desde fichas de producto y desde un catálogo
  filtrado sin resultados ("¿No está tu modelo? Avisame").
- Rate-limit por IP (Vercel Firewall) si aparece spam pese al honeypot.
- Doble opt-in si Wix lo exige para la cuenta.
