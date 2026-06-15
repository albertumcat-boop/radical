/**
 * instructions.js
 * Instrucciones paso a paso de confección para cada prenda.
 * Se muestra en un panel lateral o modal dentro de la app.
 */

'use strict';
window.PAT = window.PAT || {};

PAT.Instructions = (function () {

  const STEPS = {
    franela: {
      nombre: 'Franela Básica',
      tiempo: '2–3 horas',
      dificultad: 'Principiante',
      materiales: ['Tela jersey/punto 1.5m', 'Hilo a tono', 'Tijeras de tela', 'Agujas para tejido de punto'],
      pasos: [
        { titulo: 'Cortar las piezas', desc: 'Dobla la tela por la mitad con el derecho hacia adentro. Coloca los patrones de Espalda y Frente sobre el doblez. Recorta con 1cm de margen (ya incluido en el patrón). Corta también la tira de sesgo para el cuello.' },
        { titulo: 'Unir hombros', desc: 'Con derechos juntos, une las costuras de hombro con puntada recta. Abre la costura con la plancha o usa overlock. Refuerza con pespunte si el tejido es elástico.' },
        { titulo: 'Preparar el cuello', desc: 'Dobla la tira de sesgo por la mitad a lo largo. Estira ligeramente mientras coses para que se adapte a la curva del cuello. Une los extremos cortos formando un aro.' },
        { titulo: 'Coser el cuello', desc: 'Divide el aro del cuello en 4 partes iguales. Haz lo mismo con la abertura del cuello. Enfrenta derechos, alinea las marcas y une con puntada elástica (punto zigzag o overlock), estirando el sesgo al coser.' },
        { titulo: 'Coser las sisas', desc: 'Opción A: Cierra las costuras laterales primero, luego cose el sesgo de sisa en aro. Opción B (más fácil): Cose el sesgo plano a cada sisa antes de cerrar los laterales.' },
        { titulo: 'Cerrar los laterales', desc: 'Con derechos juntos, une las costuras laterales desde la sisa hasta el dobladillo en una sola costura continua. Refuerza en la sisa con una segunda pasada.' },
        { titulo: 'Dobladillo', desc: 'Dobla el bajo 2cm hacia adentro, plancha y cose con puntada invisible o puntada de dobladillo elástica. Alternativamente, usa overlock y deja el bajo al aire para un look más moderno.' },
        { titulo: 'Planchar y revisar', desc: 'Plancha todas las costuras. Verifica que el cuello quede simétrico. Prueba la prenda y ajusta el largo si es necesario antes de terminar el dobladillo.' },
      ],
      consejos: [
        'Usa aguja para tejido de punto (ballpoint) para evitar agujerear el hilo.',
        'El punto zigzag es tu amigo si no tienes overlock.',
        'Estira el sesgo al coser el cuello para que quede curvo.',
      ],
    },

    blusa: {
      nombre: 'Blusa con Pinzas',
      tiempo: '4–5 horas',
      dificultad: 'Intermedio',
      materiales: ['Tela plana 1.8m (popelín, batista, lino)', 'Hilo a tono', 'Entretela para cuello (0.3m)', '3 botones o cierre invisible'],
      pasos: [
        { titulo: 'Cortar las piezas', desc: 'Corta Espalda (doblez), Frente (doblez), y Manga ×2. Marca la pinza de busto en el frente con hilo de marcar o jaboncillo.' },
        { titulo: 'Coser la pinza de busto', desc: 'Dobla el tejido con derechos juntos en la línea de la pinza. Cose desde el extremo exterior hacia el vértice, terminando en punta. Corta y plancha la pinza hacia abajo.' },
        { titulo: 'Unir hombros', desc: 'Une las costuras de hombro con derechos juntos. Plancha abiertas o hacia la espalda.' },
        { titulo: 'Preparar y coser mangas', desc: 'Frúnce o reduce levemente la cabeza de manga entre las muescas para que quepa en la sisa. Une manga a cuerpo con derechos juntos, alineando muescas. Cose despacio en la curva de la cabeza.' },
        { titulo: 'Cerrar costado y manga', desc: 'Cierra la costura lateral del cuerpo y la costura de la manga en una sola costura continua desde el dobladillo de la manga hasta el bajo de la blusa.' },
        { titulo: 'Cuello o escote', desc: 'Para cuello redondo: cose tira de sesgo o enfrenta con cuello entretela. Para cuello en V: dobla y plancha el margen, pespuntea a 2mm del borde.' },
        { titulo: 'Dobladillo de mangas', desc: 'Dobla 1.5cm dos veces. Plancha y cose a máquina.' },
        { titulo: 'Dobladillo inferior', desc: 'Igual que mangas: doble doblez, plancha, cose.' },
        { titulo: 'Cierre', desc: 'Coloca cierre invisible en el costado izquierdo, o cose abertura con ojales y botones en el frente.' },
      ],
      consejos: [
        'Plancha la pinza antes de continuar — es difícil corregirla después.',
        'Usa alfileres perpendiculares a la costura al poner la manga.',
        'Hilvana la manga antes de coser a máquina si es tu primera blusa.',
      ],
    },

    camisa: {
      nombre: 'Camisa Dama/Caballero',
      tiempo: '6–8 horas',
      dificultad: 'Intermedio-Avanzado',
      materiales: ['Tela plana 2.2m', 'Entretela 0.5m', 'Hilo a tono', '7–9 botones', 'Interfaz para cuello y puños'],
      pasos: [
        { titulo: 'Cortar e interfasar', desc: 'Corta todas las piezas. Aplica entretela al cuello, collarín, puños y canesú con plancha antes de coser.' },
        { titulo: 'Preparar canesú', desc: 'Une los dos canesús (doble) con derechos juntos en la costura del hombro trasero. El canesú exterior va al lado derecho de la tela.' },
        { titulo: 'Unir espalda al canesú', desc: 'Sándwich: espalda (derecho arriba) + canesú interior (derecho abajo) + canesú exterior (derecho arriba). Cose, voltea y pespuntea.' },
        { titulo: 'Unir frentes al canesú', desc: 'Dobla y cose la tira de botonadura. Une los frentes al canesú por los hombros.' },
        { titulo: 'Preparar cuello', desc: 'Cose el cuello exterior e interior juntos por los extremos y la punta. Voltea, plancha, pespuntea. Añade el collarín (band) de la misma forma.' },
        { titulo: 'Poner cuello en camisa', desc: 'Enfrenta el collarín exterior al escote de la camisa. Cose. Dobla el collarín interior y cose a mano o a máquina por el derecho.' },
        { titulo: 'Coser mangas y pliegues', desc: 'Haz los pliegues o godets en el bajo de la manga. Cose la manga al cuerpo. Cierra la costura del costado y manga en una pasada.' },
        { titulo: 'Puños', desc: 'Une puño exterior e interior. Voltea. Cose el puño a la manga. Haz ojal en el puño.' },
        { titulo: 'Ojales y botones', desc: 'Marca y cose ojales en el frente derecho (mujer) o izquierdo (hombre). Cose botones en la posición correspondiente.' },
        { titulo: 'Dobladillo', desc: 'Dobladillo de 1cm ×2 en el bajo.' },
      ],
      consejos: [
        'El canesú es lo más complicado — tómate tu tiempo.',
        'Entretela en cuello y puños es obligatoria para que mantengan forma.',
        'Prueba un ojal en tela de prueba antes de hacerlos en la camisa.',
      ],
    },

    falda: {
      nombre: 'Falda Recta',
      tiempo: '2–3 horas',
      dificultad: 'Principiante',
      materiales: ['Tela 1.2m', 'Cierre invisible 20cm', 'Entretela para pretina', 'Botón o corchete'],
      pasos: [
        { titulo: 'Cortar piezas', desc: 'Corta Delantera (doblez), Trasera (doblez) y Pretina. Aplica entretela a la pretina.' },
        { titulo: 'Coser pinzas', desc: 'Cose las pinzas de cintura en delantera y trasera. Plancha hacia el centro.' },
        { titulo: 'Unir laterales', desc: 'Une delantera y trasera por los laterales con derechos juntos. Deja abiertos los últimos 20cm del lateral izquierdo para el cierre.' },
        { titulo: 'Poner cierre', desc: 'Instala el cierre invisible en el lateral izquierdo siguiendo las instrucciones del fabricante. El tope del cierre queda a 2.5cm del borde superior.' },
        { titulo: 'Coser pretina', desc: 'Dobla la pretina por la mitad. Enfrenta un lado al borde superior de la falda (derechos juntos). Cose. Dobla al interior, pespuntea desde el derecho.' },
        { titulo: 'Dobladillo', desc: 'Dobla 2cm hacia adentro, plancha. Cose a máquina o a mano con puntada invisible.' },
        { titulo: 'Cierre pretina', desc: 'Cose un corchete o botón en el extremo de la pretina.' },
      ],
      consejos: [
        'El cierre invisible es más fácil con un prensatelas especial para cierre invisible.',
        'Plancha las pinzas antes de unir los laterales.',
      ],
    },

    'falda-lapiz': {
      nombre: 'Falda Lápiz',
      tiempo: '3–4 horas',
      dificultad: 'Intermedio',
      materiales: ['Tela entallada 1.2m', 'Cierre invisible 20cm', 'Entretela pretina', 'Corchete'],
      pasos: [
        { titulo: 'Cortar e interfasar', desc: 'Corta Delantera, Trasera y Pretina. La trasera tiene un tajo (abertura) en el centro inferior de 15–20cm. Aplica entretela a pretina.' },
        { titulo: 'Pinzas', desc: 'Cose las pinzas de cintura (delantera y trasera). Las traseras son más profundas. Plancha hacia el centro.' },
        { titulo: 'Tajo trasero', desc: 'Dobla y plancha el margen del tajo 1cm hacia adentro en ambos lados. Cose a máquina. Esto forma la abertura inferior.' },
        { titulo: 'Unir laterales', desc: 'Une los laterales (deja 20cm abiertos en el izquierdo para el cierre).' },
        { titulo: 'Cierre y pretina', desc: 'Igual que la falda recta: cierre invisible, luego pretina entreterlada.' },
        { titulo: 'Dobladillo', desc: 'Por ser entallada, el bajo puede quedar algo tirante. Dobla 1.5cm, plancha bien y cose a puntada invisible.' },
      ],
      consejos: ['La falda lápiz necesita tela con algo de elasticidad para moverse cómodamente.'],
    },

    vestido: {
      nombre: 'Vestido Básico',
      tiempo: '5–6 horas',
      dificultad: 'Intermedio',
      materiales: ['Tela 2.5m', 'Cierre invisible 50cm', 'Entretela 0.3m'],
      pasos: [
        { titulo: 'Cortar', desc: 'Corta Espalda (doblez) y Frente (doblez). Si el vestido tiene manga, córtala también.' },
        { titulo: 'Pinzas de busto y cintura', desc: 'Cose las pinzas en el frente primero, luego las de cintura. Plancha las de busto hacia abajo, las de cintura hacia el centro.' },
        { titulo: 'Hombros', desc: 'Une las costuras de hombro. Plancha abiertas.' },
        { titulo: 'Escote', desc: 'Aplica sesgo o enfrenta con tira entreterlada en el escote. Pespuntea a 2mm del borde.' },
        { titulo: 'Mangas (si aplica)', desc: 'Frunce la cabeza de manga, únela a la sisa, cierra la manga.' },
        { titulo: 'Cierre', desc: 'Instala el cierre invisible en el lateral izquierdo o en el centro espalda. El largo del cierre debe cubrir desde cintura hasta 5cm bajo el busto.' },
        { titulo: 'Laterales', desc: 'Une los laterales restantes. Refuerza en la cintura.' },
        { titulo: 'Dobladillo', desc: 'Dobladillo de 2.5cm. Verifica que el vestido quede a nivel antes de coser.' },
      ],
      consejos: ['Prueba el vestido antes del dobladillo final para ajustar el largo.'],
    },

    'vestido-cruzado': {
      nombre: 'Vestido Cruzado (Wrap)',
      tiempo: '4–5 horas',
      dificultad: 'Intermedio',
      materiales: ['Tela fluida 2.8m (viscosa, seda, jersey suave)', 'Hilo a tono', 'Cinta o tira de tela para el lazo'],
      pasos: [
        { titulo: 'Cortar', desc: 'Corta Espalda (doblez), Frente Derecho e Izquierdo (piezas completas, no en doblez). La manga kimono se corta como extensión de los hombros.' },
        { titulo: 'Unir hombros', desc: 'Une Espalda con Frente Derecho e Izquierdo en los hombros.' },
        { titulo: 'Mangas kimono', desc: 'Si llevan manga, cierra la costura inferior de cada manga desde la muñeca hasta el cuerpo.' },
        { titulo: 'Laterales', desc: 'Une los laterales del cuerpo.' },
        { titulo: 'Escote cruzado', desc: 'Dobla y plancha el margen del escote en V de cada frente. Pespuntea a 2mm. El frente izquierdo se cruza sobre el derecho.' },
        { titulo: 'Cinturón/lazo', desc: 'Cose la tira del lazo por los lados largos. Voltea y plancha. Cose un extremo al lateral derecho del vestido desde el interior, el otro va suelto para atar.' },
        { titulo: 'Dobladillo', desc: 'Dobladillo estrecho (1cm ×2) en el bajo y en los bordes del frente cruzado.' },
      ],
      consejos: ['Las telas fluidas necesitan alfileres finos y aguja nueva para no marcar.'],
    },

    pantalon: {
      nombre: 'Pantalón Básico',
      tiempo: '5–6 horas',
      dificultad: 'Intermedio',
      materiales: ['Tela 2.2m', 'Cierre de cremallera 18cm', 'Entretela pretina', 'Botón o corchete'],
      pasos: [
        { titulo: 'Cortar', desc: 'Corta Delantero ×2, Trasero ×2 y Pretina. Marca la posición del bolsillo si aplica.' },
        { titulo: 'Bolsillos (opcional)', desc: 'Si llevas bolsillo de ojal: cose la bolsa del bolsillo al delantero antes de unir costuras.' },
        { titulo: 'Pinzas de cintura', desc: 'Cose las pinzas en delantero y trasero. Plancha hacia el centro.' },
        { titulo: 'Unir costados', desc: 'Une el lado derecho delantero con el trasero (costura lateral). Repite para el lado izquierdo. Deja abiertos los primeros 18cm del lateral izquierdo delantero para el cierre (o el tiro si es cierre frontal).' },
        { titulo: 'Unir entrepiernas', desc: 'Une el tiro delantero de cada pierna entre sí. Luego une el tiro trasero. Por último une el entrepierna interior de pierna a pierna.' },
        { titulo: 'Cierre de cremallera', desc: 'Instala la cremallera en el tiro delantero (cierre clásico) o en el lateral según tu diseño.' },
        { titulo: 'Pretina', desc: 'Aplica entretela. Dobla y cose la pretina al borde superior del pantalón con derechos juntos. Dobla al interior y pespuntea.' },
        { titulo: 'Dobladillo', desc: 'Dobla el bajo 2cm ×2. Plancha y cose.' },
      ],
      consejos: [
        'El tiro (entrepierna) es la parte más difícil — hilvana antes de coser a máquina.',
        'Prueba el pantalón antes del dobladillo para ajustar el largo de pierna.',
      ],
    },

    short: {
      nombre: 'Short Básico',
      tiempo: '2–3 horas',
      dificultad: 'Principiante',
      materiales: ['Tela 1.2m', 'Elástico para cintura 2.5cm ancho', 'Hilo a tono'],
      pasos: [
        { titulo: 'Cortar', desc: 'Corta Delantero ×2 y Trasero ×2. Si usas elástico en cintura, no necesitas pretina aparte.' },
        { titulo: 'Unir costados', desc: 'Une los laterales con derechos juntos.' },
        { titulo: 'Entrepierna', desc: 'Une el tiro delantero de ambas piezas, luego el tiro trasero, luego el entre-pierna interior.' },
        { titulo: 'Canal de elástico', desc: 'Dobla el borde superior 3.5cm hacia adentro. Cose dejando 3cm de abertura para introducir el elástico. Introduce el elástico, ajusta al cuerpo, cierra la abertura.' },
        { titulo: 'Dobladillo', desc: 'Dobla el bajo 1.5cm ×2. Cose.' },
      ],
      consejos: ['Con elástico en cintura no necesitas cierre — ideal para principiantes.'],
    },

    blazer: {
      nombre: 'Blazer Básico',
      tiempo: '8–10 horas',
      dificultad: 'Avanzado',
      materiales: ['Tela sastre 2.5m', 'Entretela 1m', 'Forro 2m', 'Botones 3', 'Hombrera par'],
      pasos: [
        { titulo: 'Cortar e interfasar', desc: 'Corta todas las piezas. Aplica entretela al frente completo, cuello, puños y solapas.' },
        { titulo: 'Bolsillos de parche', desc: 'Cose y voltea los bolsillos. Pespuntea en posición en el frente.' },
        { titulo: 'Espalda y costados', desc: 'Une las costuras de la espalda (centro si aplica). Une los costados.' },
        { titulo: 'Hombros', desc: 'Une hombros. Instala hombreras con puntada a mano.' },
        { titulo: 'Solapa', desc: 'Dobla la solapa del frente siguiendo la línea de doblez. Pespuntea el borde de la solapa a 3mm.' },
        { titulo: 'Cuello', desc: 'Si tiene cuello: une cuello exterior e interior, voltea, plancha. Cose al escote. Sin cuello: refuerza el escote en V con sesgo.' },
        { titulo: 'Mangas', desc: 'Cierra la costura trasera de la manga. Frunce la cabeza. Une a la sisa. El blazer tiene manga sastre con costura en el codo.' },
        { titulo: 'Forro', desc: 'Confecciona el forro igual que el exterior pero sin bolsillos. Une al blazer por las solapas y bordes. Deja el bajo del forro libre (se dobla hacia adentro).' },
        { titulo: 'Dobladillo y acabados', desc: 'Dobladillo a mano en el bajo del blazer y del forro. Cose botones. Plancha en vapor.' },
      ],
      consejos: [
        'El blazer requiere plancha de sastre — cada costura debe plancharse antes de continuar.',
        'El forro hace el blazer más profesional y fácil de poner.',
      ],
    },

    chaleco: {
      nombre: 'Chaleco',
      tiempo: '4–5 horas',
      dificultad: 'Intermedio',
      materiales: ['Tela exterior 1.2m', 'Forro o tela de contraste 1.2m', 'Entretela 0.3m', 'Botones 4–5'],
      pasos: [
        { titulo: 'Cortar', desc: 'Corta Espalda ×2 (exterior y forro), Frente ×4 (2 exterior, 2 forro). Aplica entretela al frente exterior.' },
        { titulo: 'Bolsillos', desc: 'Agrega bolsillos de parche o de ojal al frente exterior antes de unir piezas.' },
        { titulo: 'Unir costados exterior', desc: 'Une los costados de las piezas exteriores.' },
        { titulo: 'Unir costados forro', desc: 'Igual para el forro.' },
        { titulo: 'Unir hombros exterior', desc: 'Une hombros del exterior.' },
        { titulo: 'Unir hombros forro', desc: 'Une hombros del forro.' },
        { titulo: 'Unir exterior y forro', desc: 'Con derechos juntos, coloca exterior sobre forro. Cose alrededor de: escote, solapas, frente, bajo. Deja los laterales de las sisas sin coser para voltear.' },
        { titulo: 'Voltear y acabar sisas', desc: 'Voltea el chaleco. Plancha bien. Cose las sisas doblando los márgenes hacia adentro y pespunteando.' },
        { titulo: 'Botones y ojales', desc: 'Marca y cose ojales en el frente derecho. Botones en el izquierdo.' },
      ],
      consejos: ['El truco de unir exterior y forro como un sándwich da acabados muy limpios sin necesidad de puntada invisible.'],
    },
  };

  // ── Renderizar panel de instrucciones ─────────────────────────────────
  function showInstructions(garmentType) {
    const data = STEPS[garmentType];
    if (!data) return;

    const existing = document.getElementById('modal-instructions');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-instructions';
    modal.className = 'modal open';
    modal.innerHTML = `
      <div class="m-ov"></div>
      <div style="
        position:relative;z-index:1;background:var(--panel);
        border:1px solid var(--brd2);border-radius:16px;
        width:min(600px,96vw);max-height:90vh;overflow-y:auto;
        box-shadow:0 24px 64px rgba(0,0,0,.8);
      ">
        <div style="padding:24px 24px 0;display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <h2 style="font-size:18px;font-weight:800;margin:0 0 4px;">🧵 ${data.nombre}</h2>
            <div style="display:flex;gap:12px;font-size:11px;color:var(--tx3);">
              <span>⏱ ${data.tiempo}</span>
              <span>📊 ${data.dificultad}</span>
            </div>
          </div>
          <button onclick="this.closest('.modal').remove()" style="
            background:var(--inp);border:1px solid var(--brd);color:var(--tx2);
            border-radius:8px;width:32px;height:32px;cursor:pointer;font-size:16px;
          ">✕</button>
        </div>

        <div style="padding:16px 24px;">
          <div style="
            background:rgba(139,92,246,.06);border:1px solid rgba(139,92,246,.2);
            border-radius:8px;padding:12px 14px;margin-bottom:16px;
          ">
            <div style="font-size:11px;font-weight:700;color:var(--acc2);margin-bottom:6px;">📦 Materiales necesarios</div>
            <ul style="margin:0;padding-left:16px;font-size:12px;color:var(--tx2);display:flex;flex-direction:column;gap:3px;">
              ${data.materiales.map(m => `<li>${m}</li>`).join('')}
            </ul>
          </div>

          <div style="display:flex;flex-direction:column;gap:10px;">
            ${data.pasos.map((paso, i) => `
              <div style="
                background:var(--inp);border:1px solid var(--brd);
                border-radius:10px;padding:14px;
              ">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
                  <span style="
                    background:var(--acc);color:#fff;border-radius:50%;
                    width:22px;height:22px;display:flex;align-items:center;justify-content:center;
                    font-size:11px;font-weight:800;flex-shrink:0;
                  ">${i + 1}</span>
                  <span style="font-size:13px;font-weight:700;">${paso.titulo}</span>
                </div>
                <p style="margin:0 0 0 32px;font-size:12px;color:var(--tx2);line-height:1.6;">${paso.desc}</p>
              </div>
            `).join('')}
          </div>

          ${data.consejos.length ? `
          <div style="
            margin-top:16px;background:rgba(16,185,129,.06);
            border:1px solid rgba(16,185,129,.2);border-radius:8px;padding:12px 14px;
          ">
            <div style="font-size:11px;font-weight:700;color:#34d399;margin-bottom:6px;">💡 Consejos</div>
            <ul style="margin:0;padding-left:16px;font-size:12px;color:var(--tx2);display:flex;flex-direction:column;gap:4px;">
              ${data.consejos.map(c => `<li>${c}</li>`).join('')}
            </ul>
          </div>` : ''}
        </div>
        <div style="height:20px;"></div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('.m-ov').addEventListener('click', () => modal.remove());
  }

  function getGarmentNames() {
    return Object.fromEntries(Object.entries(STEPS).map(([k, v]) => [k, v.nombre]));
  }

  return { showInstructions, getGarmentNames, STEPS };
})();
