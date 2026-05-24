# 🎓 UniCert Web3 — Plataforma Blockchain para Emisión y Verificación de Certificados Académicos

¡Bienvenido a **UniCert Web3**! Un ecosistema descentralizado y moderno diseñado para revolucionar la emisión y validación de títulos, diplomas y certificados académicos universitarios. Utilizando la inmutabilidad y transparencia de la tecnología **Blockchain**, UniCert elimina de raíz el fraude académico, simplifica los procesos de auditoría y empodera a los estudiantes con credenciales verificables al instante en cualquier parte del mundo.

---

## 🌟 Características Destacadas

*   **⚡ Entorno Dual Inteligente (Simulado vs. Real):**
    *   **Modo Demostración (Simulado):** Permite explorar y probar el sistema localmente utilizando el almacenamiento del navegador (`localStorage`). Ideal para pruebas rápidas y demostraciones didácticas sin necesidad de configurar carteras de criptomonedas o pagar tarifas de red (gas).
    *   **Modo Blockchain Real (Polygon Amoy):** Conexión total con la red de pruebas de **Polygon Amoy (Chain ID 80002)**. Permite la interacción directa con contratos inteligentes en la blockchain de Polygon a través de **MetaMask** y la librería **Ethers.js (v6)**.
*   **🔒 Smart Contract Seguro (Solidity):**
    *   Desarrollado con las mejores prácticas en Solidity (v0.8.20).
    *   Arquitectura basada en roles (`onlyOwner`) para garantizar que **únicamente la Universidad o Entidad Emisora** autorizada tenga la capacidad de emitir (`issueCertificate`) o revocar (`revokeCertificate`) credenciales.
    *   Consultas y validaciones públicas completamente gratuitas y descentralizadas.
*   **👁️ Portal de Verificación Público:**
    *   Búsqueda instantánea y en tiempo real del estado de validez de cualquier certificado a través de su código único.
    *   Efectos visuales premium al verificar exitosamente una credencial (integración interactiva con confeti).
*   **📄 Generador Automático de PDF y QR:**
    *   Generación en el navegador de documentos PDF de alta calidad estética con detalles oficiales del certificado mediante **jsPDF**.
    *   Generación de códigos QR únicos vinculados directamente a la URL de validación de la plataforma para un escaneo y verificación móvil ultra rápidos.
*   **🖥️ Panel Administrativo Robusto:**
    *   Formulario simplificado para la emisión de nuevos certificados.
    *   Sección para vincular dinámicamente nuevas direcciones de Smart Contracts desplegados.
    *   Listado general de certificados emitidos con opciones integradas para inhabilitar/revocar credenciales de forma inmutable.

---

## 🎨 Diseño y Experiencia de Usuario

La interfaz de usuario ha sido cuidadosamente diseñada implementando una estética **Premium Glassmorphism**:
*   Vibrantes gradientes dinámicos y brillos de neón controlados.
*   Paneles translúcidos con desenfoque de fondo (`backdrop-filter`) y sutiles bordes de vidrio.
*   Tipografía moderna (Inter) y micro-animaciones en botones y elementos interactivos para ofrecer una experiencia viva y receptiva.
*   Diseño 100% responsivo adaptado para su uso óptimo tanto en computadoras de escritorio como en dispositivos móviles.

---

## 🛠️ Tecnologías y Herramientas

*   **Frontend:** React (v19), Vite (v8)
*   **Interacciones Web3:** Ethers.js (v6), MetaMask Integration
*   **Entorno de Smart Contracts:** Hardhat, Solidity (v0.8.20)
*   **Estilos:** Vanilla CSS (Diseño CSS personalizado a medida)
*   **Iconografía:** Lucide React
*   **Librerías Adicionales:** `qrcode` (códigos QR dinámicos), `jspdf` (renderizado PDF en cliente), `canvas-confetti` (celebración interactiva)

---

## 📁 Estructura del Proyecto

```bash
certificados-blockchain/
├── contracts/               # Contratos Inteligentes (Solidity)
│   └── CertificateRegistry.sol  # Contrato oficial de registro de certificados
├── scripts/                 # Scripts de despliegue y tareas de Hardhat
│   └── deploy.js            # Script para desplegar el contrato en Polygon Amoy
├── src/                     # Código Fuente de la Aplicación React
│   ├── assets/              # Archivos multimedia y recursos estáticos
│   ├── components/          # Componentes modulares de la interfaz
│   │   ├── AdminDashboard.jsx     # Panel del administrador/universidad
│   │   └── VerificationPortal.jsx # Buscador público de certificados
│   ├── utils/               # Utilidades de lógica del sistema
│   │   ├── blockchain.js          # Adaptador de interacción con el Smart Contract
│   │   └── pdfGenerator.js        # Motor de maquetación y descarga de PDFs
│   ├── App.css              # Reglas CSS específicas de la aplicación
│   ├── App.jsx              # Controlador principal y enrutador de vistas
│   ├── index.css            # Sistema de diseño, variables HSL, fuentes y temas
│   └── main.jsx             # Punto de entrada de React
├── hardhat.config.js        # Configuración de Hardhat y Redes (Amoy / Local)
├── package.json             # Dependencias del proyecto y scripts npm
└── README.md                # Documentación oficial del proyecto
```

---

## 🚀 Guía de Instalación y Uso

### 1. Prerrequisitos
Asegúrate de tener instalados en tu sistema:
*   [Node.js](https://nodejs.org/) (versión 18 o superior recomendada).
*   [MetaMask](https://metamask.io/) instalado como extensión en tu navegador (necesario únicamente para el Modo Blockchain Real).

### 2. Instalación de Dependencias
Clona el repositorio, navega a la carpeta raíz y ejecuta:
```bash
npm install
```

### 3. Ejecución en Entorno Local (Desarrollo)
Para iniciar el servidor local con recarga rápida (HMR):
```bash
npm run dev
```
Abre la dirección [http://localhost:5173](http://localhost:5173) en tu navegador para ver la aplicación.

### 4. Compilación y Despliegue del Smart Contract
Si deseas desplegar tu propio contrato en la red de pruebas Polygon Amoy:

1.  Crea un archivo `.env` en la raíz del proyecto con tu clave privada de MetaMask:
    ```env
    PRIVATE_KEY="tu_clave_privada_aqui"
    ```
    *Nota: Asegúrate de tener algunos tokens MATIC de prueba en la red Amoy. Puedes obtenerlos en un grifo (faucet) de Polygon.*

2.  Compila los contratos inteligentes:
    ```bash
    npx hardhat compile
    ```

3.  Despliega el contrato en la red Polygon Amoy:
    ```bash
    npx hardhat run scripts/deploy.js --network amoy
    ```

4.  Copia la dirección del contrato desplegado mostrada en la terminal y pégala en el campo correspondiente en el **Panel Administrativo** de la aplicación para sincronizar tu frontend con tu nuevo contrato real en la blockchain.

---

## 📜 Detalles del Smart Contract (`CertificateRegistry.sol`)

El contrato inteligente cuenta con los siguientes métodos principales:

### Funciones de Escritura (Solo Propietario / Universidad)
*   `issueCertificate(string _id, string _recipientName, string _eventName, uint256 _issueDate)`: Registra de forma inmutable un certificado asociando su ID a los datos del estudiante y el evento.
*   `revokeCertificate(string _id)`: Inhabilita administrativamente un certificado en caso de error o fraude detectado.

### Funciones de Lectura (Públicas y Gratuitas)
*   `getCertificate(string _id)`: Recupera la estructura de datos del certificado con su ID.
*   `isCertificateValid(string _id)`: Retorna un booleano indicando si el certificado existe y continúa siendo válido.
*   `totalCertificates()`: Retorna el volumen acumulado de certificados emitidos.
*   `owner()`: Retorna la dirección del emisor central autorizado.

---

## 🛡️ Seguridad e Inmutabilidad

Una vez emitido un certificado en el modo Blockchain, los datos se escriben en el ledger distribuido de Polygon de manera permanente. Ningún actor (incluido el emisor original) puede modificar los datos del alumno o el curso del certificado. La única acción posible para rectificar errores administrativos es la **revocación**, la cual se registra públicamente, asegurando una trazabilidad del 100% y total transparencia ante empleadores y entidades verificadoras.
