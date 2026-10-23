# Newsletter con alertas por modelo — Plan

> **Objetivo:** que un visitante deje su email, elija los modelos de barco que le interesan
> (Colibrí, Bries, Plenamar, Limbo…) y quede suscripto para recibir novedades y avisos cuando
> ingrese una embarcación de ese modelo.

---

## 1. Decisiones

| Tema | Decisión | Por qué |
|---|---|---|
| Dónde se guardan los suscriptores | **Wix CRM (Contactos)** | Es el backend del sitio (plan headless §2): el dueño ya trabaja en el panel de Wix. No sumamos una base de datos ni un proveedor nuevo. |
| Cómo se guardan los modelos | **Etiquetas de contacto** en Wix: `Newsletter` + una por modelo (`Modelo: Colibrí`) | En el panel se filtran contactos por etiqueta y Wix Email Marketing manda campañas a esos segmentos ("entró un Plenamar 23" → etiqueta `Modelo: Plenamar`). |
| Consentimiento de email | **Suscripción de email = `SUBSCRIBED`** (Email Subscriptions API) | Wix Email Marketing solo envía a quien se suscribió. El visitante lo pide explícitamente al enviar el formulario. La baja la maneja Wix (link en cada email). |
| Lista de modelos | **Curada a mano** en `lib/boat-models.ts`, agrupada en Veleros / A motor | Regla del dueño (plan headless §15): **nada se deduce del texto**. La lista tiene que incluir modelos que hoy *no* están en el catálogo (Colibrí, Bries), así que no puede salir del catálogo en vivo. Se edita en un solo archivo. |
| Granularidad | **Familia de modelo** (Plenamar, no "Plenamar 23" y "Plenamar 36") | Quien busca un Plenamar quiere enterarse de cualquier eslora. Menos chips, menos etiquetas. |
| Envío del formulario | **Server Action** de Next.js, sin endpoint público aparte | La API key de Wix queda solo en el servidor. Funciona sin JS (mejora progresiva). |
| Credencial | **`WIX_API_KEY` + `WIX_SITE_ID`** (ya documentadas en `.env.example`) | Crear contactos y suscripciones exige identidad de app (API key); el token de visitante no alcanza. |
| Anti-spam | **Honeypot** (campo oculto) + validación estricta del lado servidor | Barato y sin fricción para la persona. Rate-limit real queda para después (§6). |

## 2. Flujo

```
Visitante ─► /newsletter (form: email + chips de modelos)
                │  Server Action subscribeToNewsletter(formData)
                ▼
        parseNewsletterForm()  ── honeypot lleno → "ok" sin tocar Wix
                │  email inválido → error en el form (se conservan los modelos elegidos)
                ▼
        lib/newsletter.ts (server-only, API key)
          1. labels.findOrCreateLabel("Newsletter"), ("Modelo: <X>") …  (en paralelo)
          2. contacts.createContact({ email, labels })
               └─ 409 DUPLICATE_CONTACT_EXISTS → usa duplicateContactId
          3. contacts.labelContact(id, labels)          (agrega, no pisa intereses previos)
          4. emailSubscriptions.upsertEmailSubscription({ email, SUBSCRIBED })
                ▼
        "¡Listo! Te avisamos cuando ingrese: Colibrí, Bries."
```

Volver a suscribirse con el mismo email **suma** modelos; no borra los anteriores (eso se hace
desde el panel de Wix).

## 3. Cambios en el código

| Archivo | Qué |
|---|---|
| `lib/boat-models.ts` | Lista curada `BOAT_MODELS` (slug, nombre, grupo), `parseModels()`, `modelLabel()`. Sin `server-only`: el form cliente la usa. |
| `lib/newsletter-form.ts` | Validación pura del formulario (email, modelos, honeypot). Testeable sin servidor. |
| `lib/newsletter.ts` | `server-only`. Cliente Wix con `ApiKeyStrategy` + `subscribe()` (pasos 1–4). |
| `app/newsletter/actions.ts` | Server Action: valida, llama a `subscribe()`, devuelve el estado del form. |
| `app/newsletter/page.tsx` | Página `/newsletter` (banner + formulario). |
| `components/NewsletterForm.tsx` | Form cliente con `useActionState`: email, buscador de modelos, chips agrupados, mensajes. |
| `app/page.tsx` | Bloque "Alertas por modelo" en la home con botón a `/newsletter`. |
| `components/Footer.tsx` | Link "Newsletter" en la columna Empresa. |
| `app/main.css` | Estilos de chips/form del newsletter (mismo sistema navy/gold). |
| `.env.example` / `README.md` | Permisos que necesita la API key. |

## 4. Tests

- **Unit** (`tests/unit/boat-models.spec.ts`, `tests/unit/newsletter-form.spec.ts`): lista sin
  slugs repetidos, incluye Colibrí y Bries, `parseModels` ignora basura y duplicados; validación
  de email, honeypot, tope de largo.
- **E2E** (`tests/e2e-newsletter.spec.ts`): alta feliz, email que el navegador acepta pero el
  servidor no (`a@b`), contacto ya existente (409 → igual queda suscripto), Wix caído (mensaje de
  error y los modelos siguen elegidos), buscador de modelos, y versión 375px.
- **Mock de Wix**: los endpoints de **escritura** del CRM se **simulan** en
  `tests/mock/wix-http-mock.mjs` (nunca se graban: grabarlos crearía contactos reales en el CRM
  del dueño). Emails especiales disparan los casos borde (`existente@…` → 409, `falla@…` → 500).
- `/newsletter` entra en `PUBLIC_PAGES` → cubierto por responsive, overflow y rutas.

## 5. Puesta en marcha (una vez, en Wix + Vercel)

1. Wix → **Configuración → API Keys** → crear key con permisos **Manage Contacts** (contactos
   y etiquetas) y **Manage Email Marketing / Email Subscriptions**.
2. Vercel → variables de entorno (Production + Preview): `WIX_API_KEY` y `WIX_SITE_ID`.
3. Probar un alta en el Preview del PR y verla en Wix → **Contactos** con sus etiquetas.

Sin la API key el sitio funciona igual; el form muestra "no disponible por ahora" y lo loguea.

## 6. Después (fuera de este cambio)

- **Aviso automático** cuando entra un barco: webhook de producto creado en Wix → buscar
  contactos con la etiqueta del modelo → disparar campaña/automatización. Requiere decidir cómo
  mapear el nombre de la publicación a un modelo (hoy el dueño escribe "VELERO PLENAMAR 23 | …").
- Preselección por URL (`/newsletter?modelo=plenamar`) para linkear desde fichas de producto y
  desde un catálogo filtrado sin resultados ("¿No está tu modelo? Avisame").
- Campo "Otro modelo" en texto libre (como nota del contacto) para modelos que no están en la lista.
- Rate-limit por IP (Vercel Firewall) si aparece spam pese al honeypot.
- Doble opt-in si Wix lo exige para la cuenta.
