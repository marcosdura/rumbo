// El texto de /legal. Describe lo que el sistema hace de verdad: si cambia
// lo que se guarda o con quién se comparte, se actualiza acá y la fecha.

export const LAST_UPDATED = "octubre de 2026"
export const CONTACT_EMAIL = "rumbo.uy.app@gmail.com"

const mail = <a href={`mailto:${CONTACT_EMAIL}`} className="legal-link">{CONTACT_EMAIL}</a>

export const SECTIONS = [
  {
    id: "rumbo",
    emoji: "🧭",
    title: "¿Qué es Rumbo?",
    content: (
      <>
        <p className="legal-intro">La plataforma para descubrir lo mejor del Uruguay al aire libre.</p>

        <h3 className="legal-subtitle">La plataforma</h3>
        <p className="legal-p">
          Rumbo reúne lugares para hacer actividades al aire libre en Uruguay: camping, glamping, motorhome, trekking,
          escalada, surf y kayak. Cada lugar tiene información práctica, fotos y las reseñas de quienes ya estuvieron.
        </p>

        <h3 className="legal-subtitle">Qué podés hacer</h3>
        <ul className="legal-list">
          <li>Buscar lugares por actividad, departamento y otros filtros</li>
          <li>Guardar tus lugares favoritos</li>
          <li>Dejar reseñas y calificaciones</li>
          <li>Sumar lugares que faltan, y aportar rutas, sectores, vías, fotos y recorridos</li>
          <li>Si sos responsable de un lugar o un servicio, administrar su información</li>
        </ul>

        <h3 className="legal-subtitle">Cómo se revisa</h3>
        <p className="legal-p">
          Todo lo que suma la comunidad (lugares nuevos, rutas, sectores, fotos, recorridos) lo revisamos antes de
          publicarlo. Si algo está mal o desactualizado, podés reportarlo desde la página del lugar.
        </p>
      </>
    ),
  },
  {
    id: "privacidad",
    emoji: "🔒",
    title: "Política de privacidad",
    content: (
      <>
        <p className="legal-intro">
          Cómo tratamos tu información, de acuerdo con la Ley 18.331 de Protección de Datos Personales de Uruguay.
        </p>

        <h3 className="legal-subtitle">Datos que guardamos</h3>
        <ul className="legal-list">
          <li><strong>Tu cuenta:</strong> nombre, email y foto de perfil de tu cuenta de Google, cuando iniciás sesión.</li>
          <li><strong>Lo que publicás:</strong> reseñas y calificaciones, lugares que sugerís, rutas, sectores, vías, fotos y recorridos (GPX), y los reportes que enviás.</li>
          <li><strong>Tu actividad privada:</strong> tus favoritos y tus notificaciones. Solo los ves vos.</li>
          <li><strong>Si administrás un lugar o servicio:</strong> los datos que cargás de él, incluidos los de contacto (email, WhatsApp, Instagram).</li>
        </ul>

        <h3 className="legal-subtitle">Qué es público</h3>
        <ul className="legal-list">
          <li>Tus reseñas se muestran con tu nombre y tu foto de perfil.</li>
          <li>Los datos de contacto de un lugar o servicio que carga su responsable se muestran en su página, para que los visitantes puedan escribirle.</li>
          <li>Tu email nunca se muestra públicamente.</li>
        </ul>

        <h3 className="legal-subtitle">Estadísticas y cookies</h3>
        <ul className="legal-list">
          <li><strong>Visitas a los lugares:</strong> contamos cuántas personas ven cada lugar sin guardar tu IP ni tu email, solo un código que no se puede revertir y cambia todos los días. Sirve para saber qué lugares son populares y para mostrarle al responsable cuántas visitas tuvo.</li>
          <li><strong>Google Analytics:</strong> lo usamos para entender cómo se usa el sitio (páginas vistas, tipo de dispositivo, país aproximado). Usa cookies de Google.</li>
          <li><strong>Sesión:</strong> una cookie te mantiene con la sesión iniciada hasta 7 días.</li>
          <li><strong>Tu navegador:</strong> guardamos ahí, y no en nuestros servidores, cosas como el borrador del formulario para sumar un lugar.</li>
        </ul>
        <p className="legal-p">No usamos la ubicación de tu dispositivo.</p>

        <h3 className="legal-subtitle">Para qué los usamos</h3>
        <ul className="legal-list">
          <li>Identificarte y mantener tu sesión</li>
          <li>Mostrar lo que publicás y revisarlo antes de publicarlo</li>
          <li>Avisarte, dentro de la plataforma, cuando se aprueba o rechaza algo tuyo</li>
          <li>Moderar el contenido y atender los reportes</li>
          <li>Mejorar el sitio a partir de estadísticas de uso</li>
        </ul>

        <h3 className="legal-subtitle">Con quién se comparten</h3>
        <p className="legal-p">
          Solo con los servicios que hacen funcionar Rumbo: Google (inicio de sesión y Analytics), Cloudinary
          (almacenamiento de fotos), y Vercel y Railway (donde funcionan el sitio y la base de datos). Algunos de
          estos servicios guardan los datos fuera de Uruguay.
        </p>
        <p className="legal-p">No vendemos tus datos ni los usamos para publicidad.</p>

        <h3 className="legal-subtitle">Cuánto tiempo los guardamos</h3>
        <p className="legal-p">
          Mientras tengas tu cuenta. Podés eliminarla cuando quieras desde tu perfil: se borran tu cuenta, tus
          reseñas, tus favoritos y lo que tengas pendiente de revisión, y los lugares que administrás dejan de
          mostrarse. Lo que aportaste y ya está publicado (por ejemplo, una ruta o una foto de un lugar) puede seguir
          publicado como parte del lugar, sin tus datos.
        </p>

        <h3 className="legal-subtitle">Seguridad</h3>
        <p className="legal-p">
          Las conexiones al sitio van cifradas y tu sesión está protegida con tokens de Google. Tomamos medidas
          razonables para proteger tu información contra accesos no autorizados.
        </p>

        <h3 className="legal-subtitle">Tus derechos</h3>
        <p className="legal-p">Según la Ley 18.331, tenés derecho a:</p>
        <ul className="legal-list">
          <li>Saber qué datos tuyos tenemos</li>
          <li>Pedir que se corrijan los que estén mal</li>
          <li>Pedir que se eliminen</li>
          <li>Oponerte a que se usen para algo en particular</li>
        </ul>
        <p className="legal-p">
          Escribinos a {mail}. Si no te respondemos, podés recurrir a la Unidad Reguladora y de Control de Datos
          Personales (URCDP).
        </p>
      </>
    ),
  },
  {
    id: "terminos",
    emoji: "📋",
    title: "Términos de uso",
    content: (
      <>
        <p className="legal-intro">Al usar Rumbo aceptás estas condiciones.</p>

        <h3 className="legal-subtitle">Uso del servicio</h3>
        <p className="legal-p">
          Rumbo es gratuito para explorar. Para guardar favoritos, dejar reseñas o aportar contenido necesitás iniciar
          sesión con una cuenta de Google. Sos responsable de lo que se haga con tu cuenta.
        </p>

        <h3 className="legal-subtitle">Lo que publicás</h3>
        <ul className="legal-list">
          <li>Tiene que ser verdadero y de buena fe: experiencias reales y datos que conozcas.</li>
          <li>Las fotos y los recorridos que subís tienen que ser tuyos o tener permiso para compartirlos.</li>
          <li>Al publicarlo, le das a Rumbo permiso para mostrarlo en la plataforma, sin costo y sin exclusividad. Sigue siendo tuyo.</li>
          <li>Lo revisamos antes de publicarlo y podemos rechazarlo o quitarlo si no cumple estas condiciones.</li>
        </ul>

        <h3 className="legal-subtitle">Conducta</h3>
        <p className="legal-p">Rumbo es una comunidad basada en el respeto. Te comprometés a:</p>
        <ul className="legal-list">
          <li>Usar un lenguaje cordial y respetuoso</li>
          <li>No publicar contenido ofensivo, discriminatorio, engañoso o publicitario</li>
          <li>No hacer reseñas falsas, ni de tu propio lugar ni de la competencia</li>
        </ul>
        <p className="legal-p">Podemos eliminar contenido o suspender cuentas que no cumplan estas normas.</p>

        <h3 className="legal-subtitle">Responsables de lugares y servicios</h3>
        <ul className="legal-list">
          <li>Si administrás un lugar, una escuela o un servicio, la información que cargás (precios, temporada, contacto, servicios) tiene que ser verdadera y mantenerse al día.</li>
          <li>Algunos cambios (nombre, descripción, fotos, ubicación) pasan por revisión antes de publicarse.</li>
          <li>Para administrar un lugar que ya está en Rumbo tenés que pedirlo, y verificamos que seas el responsable.</li>
          <li>Rumbo no participa en las reservas, pagos ni acuerdos entre visitantes y responsables.</li>
        </ul>

        <h3 className="legal-subtitle">Tu seguridad</h3>
        <p className="legal-p">
          La información de Rumbo es orientativa y puede estar desactualizada. Las rutas, las vías y los recorridos
          son una referencia, no una guía para navegar: el trekking, la escalada, el surf y el kayak tienen riesgos.
          Informate de las condiciones del lugar y del clima, y respetá las indicaciones de cada lugar.
        </p>
        <p className="legal-p">
          Cada persona es responsable de su seguridad y de sus decisiones. Rumbo no se hace responsable por
          accidentes, lesiones, daños, cambios de acceso o de condiciones, ni por las consecuencias del uso de la
          información publicada.
        </p>

        <h3 className="legal-subtitle">Propiedad intelectual</h3>
        <p className="legal-p">
          La marca, el nombre y el diseño de Rumbo pertenecen a sus creadores. El contenido que publican los usuarios
          sigue siendo de quien lo publicó.
        </p>

        <h3 className="legal-subtitle">Cambios</h3>
        <p className="legal-p">
          Podemos actualizar estos términos. Si el cambio es importante, lo avisamos en la plataforma. Seguir usando
          Rumbo implica aceptar los términos vigentes.
        </p>

        <h3 className="legal-subtitle">Ley aplicable</h3>
        <p className="legal-p">
          Estos términos se rigen por las leyes de la República Oriental del Uruguay, y cualquier disputa se resuelve
          ante sus tribunales.
        </p>
      </>
    ),
  },
  {
    id: "contacto",
    emoji: "✉️",
    title: "Contacto",
    content: (
      <>
        <p className="legal-p">
          Para consultas, pedidos sobre tus datos o problemas con un contenido, escribinos a {mail}.
        </p>
        <ul className="legal-list">
          <li><strong>Un dato de un lugar está mal:</strong> usá &quot;Reportar&quot; en la página del lugar, así llega directo a revisión.</li>
          <li><strong>Sos responsable de un lugar que sumó un visitante:</strong> en su página, tocá &quot;¿Sos el responsable o dueño? Reclamalo&quot;. Para cualquier otro caso, escribinos.</li>
          <li>
            <strong>Instagram:</strong>{" "}
            <a href="https://www.instagram.com/rumbo.app/" target="_blank" rel="noopener noreferrer" className="legal-link">@rumbo.app</a>
          </li>
        </ul>
      </>
    ),
  },
]
