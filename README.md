# 💰 Pari — Finanzas Personales & Gastos Compartidos (PWA)

[![Next.js](https://img.shields.io/badge/Next.js-15_(App_Router)-000000?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Neon Database](https://img.shields.io/badge/Database-Neon_Serverless_PostgreSQL-00E599?style=flat&logo=postgresql)](https://neon.tech/)
[![Drizzle ORM](https://img.shields.io/badge/ORM-Drizzle_ORM-C5F74F?style=flat)](https://orm.drizzle.team/)
[![Auth.js](https://img.shields.io/badge/Auth-NextAuth_v5_(Google_OAuth)-purple?style=flat)](https://authjs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Mobile_First-10B981?style=flat)](https://developer.mozilla.org/es/docs/Web/Progressive_web_apps)

**Pari** es una Aplicación Web Progresiva (PWA) de alto rendimiento inspirada en *"Kesef"* y *"Splitwise"*, diseñada para gestionar finanzas personales, múltiples billeteras y gastos compartidos en grupos con simplificación automática de deudas y soporte para entrada por voz mediante procesamiento de lenguaje natural.

Optimizada para desplegarse con **cero cold-starts en Vercel** gracias al driver HTTP serverless de **Neon PostgreSQL**.

---

## 🚀 Características Principales

### 1. 💼 Finanzas Personales y Patrimonio Consolidado
- **Cuentas y Billeteras Ilimitadas:** Efectivo, cuentas bancarias, tarjetas de crédito, ahorros e inversiones con saldos iniciales y colores personalizados.
- **Patrimonio en Tiempo Real:** Cálculo automático del valor neto disponible en tu moneda preferida (CLP, USD, EUR, etc.).
- **Movimientos:** Registro instantáneo de gastos, ingresos y transferencias entre cuentas propias con actualización atómica de saldos.
- **Congelamiento de Tipo de Cambio (`exchange_rate_at_created`):** Los movimientos en monedas extranjeras congelan el tipo de cambio al crearse, preservando intacta la contabilidad histórica.

### 2. 👥 Gastos Compartidos estilo Splitwise (Grupos)
- **Creación de Grupos:** Espacios aislados para viajes, departamentos compartidos, salidas o eventos con moneda base configurable.
- **Invitaciones Instantáneas:** Código alfanumérico único de 8 caracteres (ej: `A8F9K2L1`) para invitar a miembros en un solo clic.
- **División de Gastos Flexible:** Reparto en partes iguales, montos exactos o porcentajes.
- **Aislamiento Estricto:** Los miembros de un grupo solo tienen acceso a los movimientos de ese grupo, garantizando la privacidad de las finanzas personales.
- **Algoritmo Min-Cash-Flow (Simplificación de Deudas):** Reduce un grafo complejo de $N \times (N - 1)$ deudas cruzadas al mínimo número de transacciones óptimas necesarias para saldar cuentas ($O(N \log N)$).

### 3. 🎙️ Registro Rápido & Entrada por Voz (NLP)
- **Botón Flotante (FAB):** Acceso permanente en 1 toque en dispositivos móviles y de escritorio.
- **Entrada por Voz con Web Speech API:** Dicta frases compuestas en lenguaje natural como:
  > *"Almuerzo 12000 en efectivo y café 3500 con tarjeta"*
- **Parser Semántico Integrado:** Extrae de forma automática montos numéricos, infiere el método de pago (`efectivo`, `tarjeta`, `banco`) y clasifica conceptos por categorías mediante coincidencia léxica.
- **Inserción en Lote (`Batch`):** Guarda múltiples gastos detectados en una sola operación atómica.

### 4. 📱 Progressive Web App (PWA) Mobile-First
- Instalable como app nativa en Android, iOS, Windows y macOS.
- Manifiesto dinámico tipado (`manifest.ts`) con tema oscuro inmersivo (`#09090B`) y acentos en verde esmeralda (`#10B981`).
- Soporte para áreas seguras (`safe-area-inset-bottom`) en pantallas de smartphones modernos.

### 5. 🔐 Autenticación & Onboarding Automático
- Inicio de sesión en un clic con **Google OAuth** mediante **NextAuth v5 (Auth.js beta)**.
- **Seed Automático:** En el primer inicio de sesión del usuario, el sistema crea automáticamente su billetera inicial y un conjunto de **11 categorías predeterminadas** (Alimentación, Transporte, Servicios, Ocio, Sueldo, etc.).

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) | Server Components, Server Actions y Streaming |
| **Lenguaje** | [TypeScript 5](https://www.typescriptlang.org/) | Tipado estricto de extremo a extremo |
| **Base de Datos** | [Neon](https://neon.tech/) | Serverless PostgreSQL distribuido |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team/) | Consultas tipadas con driver `@neondatabase/serverless` |
| **Autenticación** | [Auth.js v5](https://authjs.dev/) | Google Provider con `@auth/drizzle-adapter` |
| **Estilos** | [Tailwind CSS](https://tailwindcss.com/) | Diseño responsivo y dark mode nativo |
| **Iconos & UI** | [Lucide React](https://lucide.dev/) + Framer Motion | Iconografía moderna e interactiva |
| **Validación** | [Zod 3](https://zod.dev/) | Validación rigurosa en Server Actions |
| **Hosting** | [Vercel](https://vercel.com/) | Edge Network y Serverless Functions optimizadas |

---

## 📁 Estructura del Proyecto

```text
pari/
├── public/                     # Recursos estáticos e iconos PWA
├── src/
│   ├── actions/                # Server Actions con validación Zod
│   │   ├── expenses.ts         # Registro y división atómica de gastos grupales
│   │   ├── groups.ts           # Creación e invitación a grupos
│   │   ├── transactions.ts     # Transacciones personales (gasto/ingreso/transfer)
│   │   └── wallets.ts          # Gestión de cuentas y billeteras
│   ├── app/                    # Rutas de Next.js App Router
│   │   ├── api/auth/[...nextauth]/route.ts # Endpoint NextAuth v5
│   │   ├── login/page.tsx      # Pantalla de inicio de sesión con Google
│   │   ├── globals.css         # Directivas y tokens de Tailwind CSS
│   │   ├── layout.tsx          # Root Layout con viewport y metadatos PWA
│   │   ├── manifest.ts         # PWA Web App Manifest tipado
│   │   └── page.tsx            # Dashboard interactivo principal
│   ├── components/             # Componentes de interfaz de usuario
│   │   ├── auth-buttons.tsx    # Botones de Login con Google y Sign Out
│   │   ├── new-group-modal.tsx # Modal para crear y unirse a grupos
│   │   ├── new-wallet-modal.tsx# Modal para agregar billeteras y patrimonio
│   │   └── voice-entry-button.tsx # FAB y modal unificado (Manual + Voz)
│   ├── db/
│   │   ├── index.ts            # Cliente Drizzle HTTP Serverless de Neon
│   │   └── schema.ts           # Esquema relacional completo en PostgreSQL
│   ├── lib/
│   │   ├── debt-simplifier.ts  # Algoritmo Min-Cash-Flow estilo Splitwise
│   │   ├── utils.ts            # Helpers de formateo de moneda y Tailwind (cn)
│   │   └── voice-parser.ts     # Parser de lenguaje natural para voz
│   ├── types/
│   │   └── next-auth.d.ts      # Tipos aumentados para la sesión de usuario
│   └── auth.ts                 # Configuración central de NextAuth v5
├── drizzle.config.ts           # Configuración de Drizzle Kit
├── next.config.mjs             # Configuración de Next.js
├── package.json
└── tsconfig.json
```

---

## 🗄️ Esquema de Base de Datos (Neon PostgreSQL)

```mermaid
erDiagram
    users ||--o{ accounts : "tiene"
    users ||--o{ sessions : "tiene"
    users ||--o{ wallets : "posee"
    users ||--o{ transactions : "realiza"
    users ||--o{ group_members : "participa"
    users ||--o{ shared_expenses : "paga"
    
    wallets ||--o{ transactions : "registra"
    categories ||--o{ transactions : "clasifica"
    
    groups ||--o{ group_members : "contiene"
    groups ||--o{ shared_expenses : "aloja"
    groups ||--o{ settlements : "liquida"
    
    shared_expenses ||--o{ expense_splits : "divide"
    users ||--o{ expense_splits : "adeuda"
```

### Entidades Principales
- **`users` / `accounts` / `sessions`**: Gestión segura de identidades mediante Google OAuth.
- **`wallets`**: Cuentas con saldo inicial, saldo actual, moneda y tipo de cuenta.
- **`categories`**: Jerarquía de categorías de ingresos y gastos con iconos y colores.
- **`transactions`**: Movimientos personales con moneda y tipo de cambio congelado (`exchange_rate_at_created`).
- **`groups` & `group_members`**: Grupos tipo Splitwise con código de invitación único y balance neto (`netBalance`).
- **`shared_expenses` & `expense_splits`**: Gastos grupales divididos entre miembros.
- **`settlements`**: Pagos directos entre usuarios para liquidar deudas simplificadas.

---

## ⚙️ Variables de Entorno (`.env`)

Copia el archivo de plantilla `.env.example` a `.env`:

```bash
cp .env.example .env
```

Configura los siguientes valores:

```env
# Conexión a Neon PostgreSQL (con sslmode=require)
DATABASE_URL="postgresql://usuario:contraseña@ep-sample-123.sa-east-1.aws.neon.tech/neondb?sslmode=require"

# Secreto de Auth.js (genera uno con: npx auth secret)
AUTH_SECRET="tu_secreto_generado_con_openssl_o_auth_cli"

# Google Cloud OAuth (desde Google Cloud Console -> APIs & Services -> Credentials)
# URI autorizada local: http://localhost:3000/api/auth/callback/google
AUTH_GOOGLE_ID="tu-google-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-tu-google-client-secret"

# URL de la aplicación y moneda por defecto
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_DEFAULT_CURRENCY="CLP"
```

---

## 💻 Instalación y Desarrollo Local

### 1. Clonar el repositorio e instalar dependencias
```bash
git clone <url-del-repositorio>
cd pari
npm install
```

### 2. Sincronizar el esquema con Neon PostgreSQL
Aplica todas las tablas e índices directamente a tu base de datos:
```bash
npx drizzle-kit push
```

### 3. Iniciar el servidor de desarrollo
```bash
npm run dev
```

Abre **[http://localhost:3000](http://localhost:3000)** en tu navegador.

---

## 📋 Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo en `http://localhost:3000` |
| `npm run build` | Compila y optimiza la aplicación para producción |
| `npm run start` | Inicia el servidor con el build de producción |
| `npm run db:push` | Aplica cambios del esquema Drizzle directamente a Neon |
| `npm run db:studio` | Abre la interfaz visual de Drizzle Studio en el navegador |
| `npm run db:generate` | Genera migraciones SQL en la carpeta `/drizzle` |
| `npx tsc --noEmit` | Ejecuta la verificación estricta de tipos de TypeScript |

---

## ☁️ Despliegue en Vercel

1. **Subir a GitHub / GitLab / Bitbucket**:
   ```bash
   git init
   git add .
   git commit -m "feat: Pari MVP listo para produccion"
   git push origin main
   ```
2. **Importar en Vercel**:
   - Conecta tu repositorio en [vercel.com](https://vercel.com).
   - En **Project Settings > Environment Variables**, agrega:
     - `DATABASE_URL`
     - `AUTH_SECRET`
     - `AUTH_GOOGLE_ID`
     - `AUTH_GOOGLE_SECRET`
     - `NEXT_PUBLIC_APP_URL` (tu URL final de Vercel, ej: `https://pari.vercel.app`)
3. **Actualizar Google Cloud Console**:
   - Añade a las *URIs de redireccionamiento autorizados*:
     `https://tu-dominio.vercel.app/api/auth/callback/google`
4. ¡Listo! Vercel desplegará automáticamente la PWA con soporte para Edge CDN y funciones Serverless.

---

## 📄 Licencia

Este proyecto es de código abierto bajo la licencia [MIT](LICENSE).
