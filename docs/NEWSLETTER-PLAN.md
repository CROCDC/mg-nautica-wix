# Newsletter con alertas por modelo — Plan

> **Objetivo:** que un visitante elija los modelos de barco que busca (Colibrí, Bries,
> Plenamar, Limbo…), deje su **WhatsApp o su email**, y reciba un aviso **automático** cuando
> se publique una embarcación de ese modelo — sin que nadie tenga que mandarlo a mano.

> **Status:** WhatsApp is switched off in code for now (`WHATSAPP_ENABLED = false` in
> `lib/newsletter-form.ts`). The form offers email only, every submission is filed as email,
> and `/api/alerts/run` answers 503 without touching the catalog or the log. All the WhatsApp
> code below stays in place; flipping the flag brings it back.

---

## 1. Decisiones

| Tema | Decisión | Por qué |
|---|---|---|
| Dónde se guardan los suscriptores | **Wix CRM (Contactos)** | Es el backend del sitio (plan headless §2): el dueño ya trabaja en el panel de Wix. |
| Cómo se guardan los modelos | **Etiquetas de contacto**: `Newsletter`, `Canal: WhatsApp`/`Canal: Email`, una por modelo (`Modelo: Plenamar`) o `Modelo: Todos` si no eligió ninguno | El envío automático busca destinatarios por etiqueta; el dueño puede filtrar igual en el panel. |
| Canal | **WhatsApp (por defecto) o email**, uno por suscripción | WhatsApp es como el broker ya habla con compradores. |
| Teléfono | **E.164** (`+5491126949628`) con `libphonenumber-js`; en Argentina se restituye el 9 de celular | "11 2694-9628" sin el 9 es un fijo: WhatsApp no llega. |
| Envío por WhatsApp | **WhatsApp Cloud API (Meta)** con la plantilla aprobada `alerta_modelo` | Es la única forma de que una empresa inicie una conversación automáticamente. |
| Cuándo se envía | **Cada 15 minutos** un job de GitHub Actions llama a `/api/alerts/run`, que compara el catálogo con el registro de avisos | Funciona con cualquier plan de Vercel y sin webhooks de Wix (que el modo headless no ofrece). Solo los barcos *publicados* entran. |
| Qué modelo es un barco | **Por el nombre de la publicación** (`modelsInListing`, palabras completas + alias) | Wix no tiene un campo de modelo. El dueño nombra las publicaciones de forma consistente ("VELERO PLENAMAR 23 | …"); las 79 actuales están fijadas en los tests. |
| No repetir avisos | **Registro en el CMS de Wix**: colección `AlertasNewsletter`, un ítem por barco (`_id` = id del producto) | La inserción del ítem es el "reclamo" atómico: dos corridas solapadas no mandan dos veces. El dueño ve en el panel qué barco se avisó y a cuántos. |
| Primera corrida | **Registra todo el catálogo sin avisar** | Si no, cada suscriptor recibiría un aviso por cada barco ya publicado. |
| Baja de WhatsApp | **Responder BAJA** → webhook de Meta → se quita `Canal: WhatsApp` y se agrega `Baja: WhatsApp` | 100% automático y exigido por las políticas de WhatsApp. Volver a suscribirse lo reactiva. |
| Email automático | **Pendiente** (ver §7): los suscriptores por email que coinciden quedan listados en el registro | Wix Email Marketing no permite armar un email por barco vía API; hace falta un proveedor (p. ej. Resend). |
| Credenciales | `WIX_API_KEY`/`WIX_SITE_ID`, `CRON_SECRET`, `WHATSAPP_*` — todo server-only | Ver `.env.example`. |
| Anti-spam del form | **Honeypot** + validación estricta del lado servidor | Barato y sin fricción. |

## 2. Flujos

**Suscripción**

```
/newsletter (embarcaciones + WhatsApp o email)
   └─ Server Action → parseNewsletterForm() → subscribe()
        labels: Newsletter, Canal: …, Modelo: … (o Modelo: Todos)
        contacts.createContact({ phone | email })   409 → labelContact (+ quita Baja: WhatsApp)
        email → emailSubscriptions SUBSCRIBED
```

**Aviso automático** (`app/api/alerts/run`, cada 15 min)

```
GitHub Actions ── POST + Bearer CRON_SECRET ──► /api/alerts/run
   1. catálogo (getAllBoats)  vs  registro AlertasNewsletter
   2. registro vacío → registrar todo sin avisar (primera vez)
      > 15 barcos nuevos → registrar sin avisar (registro reiniciado)
   3. por cada barco nuevo:
        modelsInListing(nombre)                     "VELERO PLENAMAR 23" → Plenamar
        reclamar: insert en el registro             (si ya existe, otra corrida lo tiene)
        contactos con Modelo: Plenamar o Modelo: Todos
        → WhatsApp (Canal: WhatsApp, sin Baja): plantilla alerta_modelo
        → email: listados en el registro (envío pendiente)
        actualizar el registro: enviados / fallidos / emails pendientes
```

**Baja** (`app/api/whatsapp/webhook`)

```
Meta ── POST firmado (X-Hub-Signature-256) ──► /api/whatsapp/webhook
   mensaje "BAJA" / "STOP" → contacto por teléfono → +Baja: WhatsApp, −Canal: WhatsApp
   → respuesta: "Listo, no te vamos a mandar más avisos por WhatsApp…"
```

## 3. Archivos

| Archivo | Qué |
|---|---|
| `lib/boat-models.ts` | Lista curada, `suggestModels()` (form) y `modelsInListing()` (qué modelo es una publicación). |
| `lib/newsletter-form.ts` | Lo que comparten el form y la Server Action (va al navegador: nada pesado). |
| `lib/newsletter-input.ts` | `server-only`. Validación del form. |
| `lib/phone.ts` | `server-only`. Número tipeado → E.164 (con el 9 argentino). |
| `lib/wix-admin.ts` | `server-only`. Cliente Wix con API key (contactos, etiquetas, suscripciones, CMS). |
| `lib/newsletter.ts` | `subscribe()` y los nombres de las etiquetas. |
| `lib/alerts.ts` | La corrida de avisos (decisiones puras, dependencias inyectadas). |
| `lib/alerts-wix.ts` | Las dependencias reales: catálogo, registro en el CMS, contactos, WhatsApp. |
| `lib/whatsapp.ts` | Cliente de la Cloud API: plantilla del aviso y texto libre. |
| `lib/whatsapp-webhook.ts` | Firma del webhook, detección de BAJA y baja del contacto. |
| `app/api/alerts/run/route.ts` | Endpoint de la corrida (Bearer `CRON_SECRET`; se niega si WhatsApp no está configurado). |
| `app/api/whatsapp/webhook/route.ts` | Webhook de Meta (handshake GET + mensajes POST). |
| `.github/workflows/alerts.yml` | El reloj: cada 15 min, apagado hasta `ALERTS_ENABLED=true`. |
| `components/NewsletterForm.tsx`, `app/newsletter/page.tsx`, `app/page.tsx`, `components/Footer.tsx` | UI (form, página, tarjeta en la home, link). |

## 4. Tests

- **Unit**: `boat-models` (lista, sugerencias, **las 79 publicaciones del catálogo → su modelo**),
  `newsletter-input`, `phone`, `alerts` (primera corrida, nada nuevo, ráfaga = reinicio, reclamo
  ya tomado, seguidores + "Todos", sin modelo → solo "Todos", baja / solo email, mismo número dos
  veces, envío fallido, nunca dos veces, precio a consultar, link a landing), `whatsapp`
  (payload de la plantilla, codificación del link, firma, BAJA vs. preguntas que dicen "baja").
- **E2E**: form completo (`e2e-newsletter.spec.ts`); `api-whatsapp.spec.ts`: la corrida exige el
  secreto y no arranca sin WhatsApp; el webhook responde el handshake, rechaza envíos sin firma y
  da de baja por BAJA (con y sin el 9).
- **Mock**: las llamadas al CRM se simulan y registran; cualquier llamada a `graph.facebook.com`
  durante los tests **falla** — la suite nunca puede mandar un WhatsApp real.
- **No probado contra servicios reales**: Wix CMS, la consulta de contactos por etiqueta y la API
  de Meta solo se probaron contra simulaciones. Primera corrida real y prueba de punta a punta: ver §6, pasos 7–8.

## 5. Puesta en marcha — Wix y Vercel

1. Wix → **Configuración → API Keys** → key con permisos **Manage Contacts**, **Email
   Subscriptions** y **Wix Data / CMS** (la colección `AlertasNewsletter` se crea sola).
2. Vercel (Production + Preview): `WIX_API_KEY`, `WIX_SITE_ID`, `CRON_SECRET` (un valor largo
   al azar, p. ej. `openssl rand -hex 32`).

## 6. Puesta en marcha — WhatsApp (Meta)

1. **Meta Business** verificado y una **app** en developers.facebook.com con el producto
   *WhatsApp*. Un **número dedicado** (no puede ser el que hoy usa la app de WhatsApp del
   celular, salvo que se migre).
2. **Token permanente**: Business Settings → System Users → token con `whatsapp_business_messaging`
   y `whatsapp_business_management` → `WHATSAPP_TOKEN`. El **Phone number ID** (WhatsApp → API
   Setup) → `WHATSAPP_PHONE_NUMBER_ID`.
3. **Plantilla** en WhatsApp Manager → Message templates → *Create*:
   - Nombre `alerta_modelo` · Categoría **Marketing** · Idioma **Spanish (ARG)** (`es_AR`)
   - Cuerpo:
     ```
     ¡Hola! Entró al catálogo de MG Náutica un {{1}} 🚤

     *{{2}}*
     {{3}}
     ```
     Ejemplos: `Plenamar` · `VELERO PLENAMAR 23 | LISTO PARA NAVEGAR` · `US$ 31,000`
   - Pie: `Respondé BAJA para no recibir más avisos.`
   - Botón **Visitar sitio web**, URL **dinámica**: `https://www.mgnauticabroker.com/{{1}}`
     (ejemplo: `product-page/velero-plenamar-23`), texto `Ver embarcación`.
   Si se cambia el texto, los tres parámetros y el botón tienen que seguir en ese orden
   (`alertMessage` en `lib/whatsapp.ts`).
4. **Webhook**: WhatsApp → Configuration → Callback URL
   `https://www.mgnauticabroker.com/api/whatsapp/webhook`, Verify token = `WHATSAPP_VERIFY_TOKEN`;
   suscribir el campo **messages**. El **App secret** (App settings → Basic) →
   `WHATSAPP_APP_SECRET`.
5. Cargar en Vercel `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`,
   `WHATSAPP_VERIFY_TOKEN` y redeployar.
6. GitHub → Settings → Secrets and variables → Actions: secret `CRON_SECRET` (mismo valor que en
   Vercel) y variable `ALERTS_ENABLED=true`.
7. **Primera corrida**: Actions → *Alerts* → *Run workflow*. Debe responder `seeded: N` (registra
   el catálogo sin avisar). Verificar en Wix → CMS la colección *Alertas del newsletter*.
8. **Prueba de punta a punta**: suscribirse con un número propio a un modelo (p. ej. Limbo) y, en
   la colección, **borrar el ítem** de un barco de ese modelo: la corrida siguiente lo toma como
   nuevo y manda el aviso. (Despublicar y volver a publicar no sirve: el barco ya está registrado.)
   Hacerlo antes de tener suscriptores reales de ese modelo — ellos también lo recibirían.

**Costos**: Meta cobra cada mensaje de plantilla de marketing (tarifa por país; Argentina y
Uruguay tienen la suya). Las respuestas dentro de las 24 h (como la confirmación de BAJA) no se
cobran como marketing.

**GitHub**: en repos públicos, los workflows programados se pausan tras 60 días sin actividad en
el repo; un push los reactiva. Con plan Pro de Vercel se puede usar Vercel Cron en su lugar
(mismo endpoint, mismo `CRON_SECRET`).

## 7. Después

- **Email automático**: un proveedor de envío (Resend o similar) con el dominio verificado, más el
  link de baja de Wix (`generateUnsubscribeLink`). Mientras tanto, el registro de cada aviso lista
  los emails que coincidían.
- Avisar también cuando **baja el precio** de un barco seguido (hoy solo publicación nueva).
- Linkear `/newsletter?modelo=…` (ya soportado) desde fichas y desde un catálogo sin resultados.
- Rate-limit por IP del form (Vercel Firewall) si aparece spam pese al honeypot.
