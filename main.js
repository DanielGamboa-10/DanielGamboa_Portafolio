// ──────────────────────────────────────────────────────────
// DANIEL GAMBOA — SENBONZAKURA KAGEYOSHI BANKAI SEQUENCE
//
// 1. Geometría y Presencia de las Katanas Colosales:
//    - Ancho colosal (1.6 u) con perfil en rombo (arista Shinogi marcada: 0.55 u)
//    - Curvatura suave (Sori) y corte diagonal afilado en la punta (Kissaki)
//    - Eliminación de discos/círculos en los pies: la hoja nace directamente del suelo (Y = 0)
//    - Material: THREE.MeshStandardMaterial (metalness: 0.9, roughness: 0.1, emissive: 0x221133)
//    - Iluminación especular cortante: luces direccionales laterales y cenital
//
// 2. Flujo de Pétalos en Dos Tiempos:
//    - Fase Géiser (0.0s a 1.5s): Emisión continua desde la base de cada espada,
//      ascendiendo a gran velocidad vertical (Y += vel) paralela a las hojas hacia el cielo.
//    - Fase Avalancha (1.5s a 3.5s): Al desaparecer las espadas, la masa superior colapsa
//      y se precipita violentamente hacia la cámara (Z fuertemente positivo + abanico en X/Y).
//    - Fase Reposo (3.5s+): Frenado de inercia y caída suave flotante. Portafolio opacity: 1 en 4.0s.
//
// 3. Erradicación Absoluta del Cuadro Blanco de Byakuya:
//    - transparent: true, depthWrite: false, depthTest: true, alphaTest: 0.1
//    - En t = 1.5s: opacity = 0, visible = false, scene.remove(byakuyaSprite)
//    - Flash overlay con display: none y pointer-events: none garantizados.
//
// 4. Selector Bilingüe de CV y Preservación del Contenido
// ──────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {

  // ── 1. CONFIGURACIÓN DE COLORES Y TEMAS ──
  const THEMES = {
    light: {
      petalColor: 0xff69b4,     // Rosa brillante (#ff69b4) - Modo Claro
      swordColor: 0xffffff,     // Blanco puro reflectante
      emissive:   0x221133      // Resplandor espiritual en sombras
    },
    dark: {
      petalColor: 0xa855f7,     // Morado neón (#a855f7) - Modo Oscuro
      swordColor: 0xffffff,     // Blanco puro reflectante
      emissive:   0x2a1244      // Resplandor espiritual morado profundo
    }
  };

  let currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  if (!THEMES[currentTheme]) currentTheme = 'light';

  // ── 2. INICIALIZACIÓN THREE.JS EN #webgl-container (Z-INDEX: 0, TRANSPARENTE) ──
  const container = document.getElementById('webgl-container');
  if (!container) {
    console.error('Error: #webgl-container no encontrado en el DOM.');
    return;
  }

  const scene = new THREE.Scene();
  // scene.background = null para respetar al 100% los fondos CSS claro y oscuro

  const camera = new THREE.PerspectiveCamera(
    62, // FOV panorámico completo (60 a 65 grados)
    window.innerWidth / window.innerHeight,
    0.1,
    220
  );
  camera.position.set(0, 4, 30);
  camera.lookAt(0, 6, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true, // Fondo transparente del canvas
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0); // Transparencia total
  container.appendChild(renderer.domElement);

  // ── 3. ILUMINACIÓN ESPECULAR DE ACERO PARA LAS HOJAS ──
  // Luz cenital superior
  const dirLightTop = new THREE.DirectionalLight(0xffffff, 2.2);
  dirLightTop.position.set(0, 48, 12);
  scene.add(dirLightTop);

  // Dos luces direccionales laterales que recorren el pasillo e inciden sobre el bisel Shinogi
  const dirLightLeft = new THREE.DirectionalLight(0xffffff, 2.5);
  dirLightLeft.position.set(-36, 26, 18);
  scene.add(dirLightLeft);

  const dirLightRight = new THREE.DirectionalLight(0xffffff, 2.5);
  dirLightRight.position.set(36, 26, 18);
  scene.add(dirLightRight);

  // Luz ambiental para revelar el resplandor espiritual emissive en las sombras
  const ambientLight = new THREE.AmbientLight(0x221338, 1.2);
  scene.add(ambientLight);

  // ── 4. BYAKUYA DE FRENTE Y DETALLADO (SIN BUG DEL CUADRO BLANCO) ──
  const textureLoader = new THREE.TextureLoader();
  const byakuyaTexture = textureLoader.load('assets/byakuya-front.png');
  byakuyaTexture.generateMipmaps = true;

  // Material configurado con transparent: true, depthWrite: false, depthTest: true y alphaTest: 0.1
  const byakuyaSpriteMaterial = new THREE.SpriteMaterial({
    map: byakuyaTexture,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    alphaTest: 0.1,
    opacity: 1.0
  });

  const byakuyaSprite = new THREE.Sprite(byakuyaSpriteMaterial);
  // Centro exacto del pasillo (X = 0, Y = 0, Z = -12)
  byakuyaSprite.position.set(0, 0, -12);
  byakuyaSprite.scale.set(8.5, 12.75, 1);
  scene.add(byakuyaSprite);

  // ── 5. GEOMETRÍA COLOSAL DE HOJA DE KATANA (FILO Y BISEL 3D EN ROMBO) ──
  const swordsGroup = new THREE.Group();
  scene.add(swordsGroup);

  const waterRipplesGroup = new THREE.Group();
  scene.add(waterRipplesGroup);

  function createColossalKatanaGeometry() {
    // Sección transversal en rombo/diamante alargado (arista Shinogi central marcada):
    // Ancho total de la hoja: 1.8 unidades (Ha afilado a Mune lomo)
    // Espesor en la arista central Shinogi: 0.55 unidades
    const shape = new THREE.Shape();
    const halfW = 0.9;   // Ancho = 1.8 unidades (en el rango solicitado 1.2 a 1.8)
    const halfT = 0.275; // Espesor en el lomo Shinogi = 0.55 unidades

    // Puntos del perfil en rombo con arista central marcada:
    // Filo afilado Ha en (halfW, 0)
    // Arista Shinogi derecha en (0.05, halfT)
    // Lomo biselado Mune en (-halfW, 0)
    // Arista Shinogi izquierda en (0.05, -halfT)
    shape.moveTo(halfW, 0);
    shape.lineTo(0.05, halfT);
    shape.lineTo(-halfW, 0);
    shape.lineTo(0.05, -halfT);
    shape.closePath();

    // Altura colosal de 42 unidades (en el rango solicitado 35 a 45) con curvatura suave de katana (Sori)
    const segments = 45;
    const totalLength = 42.0;
    const curvePoints = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = t * totalLength;
      // Curvatura suave Sori hacia el lomo
      const curveX = -Math.pow(t, 2) * 1.2;
      curvePoints.push(new THREE.Vector3(curveX, y, 0));
    }
    const extrudePath = new THREE.CatmullRomCurve3(curvePoints);

    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: segments,
      bevelEnabled: false,
      extrudePath: extrudePath
    });

    // Remate de punta diagonal afilada (Kissaki japonés):
    // En las últimas 7.5 unidades de altura (Y >= 34.5), el filo y el bisel se afilan hacia el ápice diagonal
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    const kissakiStartY = 34.5;

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      if (v.y >= kissakiStartY) {
        const tipT = Math.min((v.y - kissakiStartY) / (totalLength - kissakiStartY), 1.0);
        // Adelgazamiento del grosor hacia filo de navaja
        v.z *= (1.0 - tipT * 0.94);
        // Corte diagonal del Kissaki: el filo se repliega hacia el lomo
        if (v.x > 0) {
          v.x *= (1.0 - tipT * 0.88);
        } else {
          v.x *= (1.0 - tipT * 0.35);
        }
        if (tipT >= 0.98) {
          v.x = -Math.pow(1.0, 2) * 1.2;
          v.z = 0;
        }
        pos.setXYZ(i, v.x, v.y, v.z);
      }
    }

    geo.computeVertexNormals();
    // La geometría NO se centra en Y para que el pie de la hoja nazca directamente a nivel del suelo (Y = 0)
    return geo;
  }

  const bladeGeometry = createColossalKatanaGeometry();

  // Material de acero reflectante: metalness: 0.9, roughness: 0.1, emissive: 0x221133
  const swordMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.9,
    roughness: 0.1,
    emissive: 0x221133,
    emissiveIntensity: 0.45,
    transparent: true,
    opacity: 1.0,
    depthWrite: false
  });

  // Geometría horizontal de ondas de agua concéntricas en el suelo (Y = 0)
  const ringGeometry = new THREE.RingGeometry(1.2, 1.85, 32);
  ringGeometry.rotateX(-Math.PI / 2); // Orientado horizontalmente sobre el agua

  const swordsList = [];
  const ripplesList = [];
  const emitterPositions = []; // Coordenadas de los 14 emisores de géiser

  const bladesPerSide = 7;
  const zStart = 4.0;
  const zSpacing = 7.0;

  for (let side = -1; side <= 1; side += 2) {
    const xPos = side * 18.0; // Pasillo central de 36 unidades, enmarcando majestuosamente los bordes

    for (let i = 0; i < bladesPerSide; i++) {
      const zPos = zStart - i * zSpacing;

      // Grupo de espada (CERO DISCOS NI CÍRCULOS SÓLIDOS: la hoja nace directamente desde el suelo)
      const singleSword = new THREE.Group();
      const bladeMesh = new THREE.Mesh(bladeGeometry, swordMaterial);
      singleSword.add(bladeMesh);

      // Inicia oculta bajo el suelo a -42.0 unidades y asciende hasta 0.0 (nivel del suelo)
      singleSword.position.set(xPos, -42.0, zPos);

      // Rotación calculada para exponer la cara ancha colosal (1.8 u) y el bisel Shinogi hacia la cámara y pasillo
      singleSword.rotation.y = (side === -1 ? -1.05 : 1.05);
      // Inclinación sutil hacia el centro en perspectiva
      singleSword.rotation.z = side * 0.04;

      swordsGroup.add(singleSword);

      swordsList.push({
        group: singleSword,
        startY: -42.0,
        targetY: 0.0,
        delay: i * 0.08,
        duration: 0.72
      });

      // ── 2 Anillos Concéntricos de Ondas en el Agua (Y = 0) ──
      // La hoja atraviesa el centro exacto de estas ondas concéntricas
      const ringMat1 = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const ringMesh1 = new THREE.Mesh(ringGeometry, ringMat1);
      ringMesh1.position.set(xPos, 0.02, zPos);
      waterRipplesGroup.add(ringMesh1);

      const ringMat2 = new THREE.MeshBasicMaterial({
        color: 0xf5bde6,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const ringMesh2 = new THREE.Mesh(ringGeometry, ringMat2);
      ringMesh2.position.set(xPos, 0.03, zPos);
      waterRipplesGroup.add(ringMesh2);

      ripplesList.push({
        ring1: ringMesh1,
        mat1: ringMat1,
        ring2: ringMesh2,
        mat2: ringMat2,
        delay: i * 0.08
      });

      // Guardar posición de cada base como emisor de géiser
      emitterPositions.push({ x: xPos, z: zPos, delay: i * 0.08 });
    }
  }

  // ── 6. FLUJO DE PÉTALOS EN DOS TIEMPOS (GÉISER -> AVALANCHA FRONTAL) ──
  function createSakuraPetalTexture() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(size / 2, size / 2);

    ctx.beginPath();
    ctx.moveTo(0, -50);
    ctx.bezierCurveTo(28, -34, 34, 18, 0, 50);
    ctx.bezierCurveTo(-34, 18, -28, -34, 0, -50);
    ctx.closePath();

    const grad = ctx.createRadialGradient(0, -6, 4, 0, 0, 52);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.45, 'rgba(255, 235, 245, 0.95)');
    grad.addColorStop(0.75, 'rgba(255, 182, 193, 0.85)');
    grad.addColorStop(0.95, 'rgba(255, 105, 180, 0.40)');
    grad.addColorStop(1.0, 'rgba(255, 105, 180, 0.0)');

    ctx.fillStyle = grad;
    ctx.fill();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.stroke();

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    return texture;
  }

  const petalTexture = createSakuraPetalTexture();

  // Sistema denso de 30,000 partículas para géiser continuo y avalancha
  const particleCount = 30000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);

  // Arrays tipados para alto rendimiento
  const pEmitter = new Int16Array(particleCount);
  const pVy = new Float32Array(particleCount);
  const pAvalancheVz = new Float32Array(particleCount);
  const pFanX = new Float32Array(particleCount);
  const pFanY = new Float32Array(particleCount);
  const pRadius = new Float32Array(particleCount);
  const pTheta = new Float32Array(particleCount);
  const pAngularSpeed = new Float32Array(particleCount);
  const pFallSpeed = new Float32Array(particleCount);
  const pSwaySpeed = new Float32Array(particleCount);
  const pPhase = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    // Asignar cada partícula a uno de los 14 emisores de géiser en la base de las espadas
    const emIdx = i % emitterPositions.length;
    pEmitter[i] = emIdx;
    const em = emitterPositions[emIdx];

    const r = 0.2 + Math.random() * 1.5;
    const th = Math.random() * Math.PI * 2;
    pRadius[i] = r;
    pTheta[i] = th;

    // Posición inicial en el nivel del suelo del emisor
    positions[i * 3]     = em.x + r * Math.cos(th);
    positions[i * 3 + 1] = 0.0;
    positions[i * 3 + 2] = em.z + r * Math.sin(th);

    // Velocidad vertical controlada para la fuente (19 a 27 u/s)
    pVy[i] = 19.0 + Math.random() * 8.0;

    // Velocidad de avalancha frontal hacia la cámara (Z positivo veloz hacia Z = 28)
    pAvalancheVz[i] = 48.0 + Math.random() * 45.0;

    // Factores de dispersión uniforme en ancho (X in [-25, 25]) y alto (Y in [-12, 16])
    pFanX[i] = (Math.random() - 0.5) * 50.0;
    pFanY[i] = -12.0 + Math.random() * 28.0;

    pAngularSpeed[i] = (Math.random() > 0.5 ? 1 : -1) * (2.4 + Math.random() * 3.6);
    pFallSpeed[i] = 1.0 + Math.random() * 2.2;
    pSwaySpeed[i] = 1.0 + Math.random() * 2.0;
    pPhase[i] = Math.random() * Math.PI * 2;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const pointsMaterial = new THREE.PointsMaterial({
    size: 0.18, // Fino y nítido para evitar manchas borrosas
    map: petalTexture,
    transparent: true,
    opacity: 0.95, // Visible desde el inicio para alimentar el géiser
    alphaTest: 0.04,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    color: new THREE.Color(THEMES[currentTheme].petalColor)
  });

  const particleSystem = new THREE.Points(geometry, pointsMaterial);
  scene.add(particleSystem);

  // Parallax interactivo con cursor
  const mouse = new THREE.Vector2(0, 0);
  const targetMouse = new THREE.Vector2(0, 0);
  window.addEventListener('mousemove', (e) => {
    targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, { passive: true });

  // Responsive Resize
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }, { passive: true });

  // ── 7. CONTROL TEMPORAL Y CRONOGRAMA DE FASES ──
  let burstTriggered = false;
  let transitionFactor = 0.0;
  let hasTransitionedPhase4 = false;

  const bankaiFlash = document.getElementById('bankai-flash');
  const portfolioContent = document.getElementById('portfolio-content');
  const sakuraBranch = document.getElementById('sakuraBranch');

  // Disparo del flash blanco/rosa sin interferencias visuales
  function triggerFlashOverlay() {
    if (!bankaiFlash) return;
    bankaiFlash.style.display = 'block';
    bankaiFlash.style.pointerEvents = 'none';
    bankaiFlash.classList.add('active');
    void bankaiFlash.offsetWidth;

    requestAnimationFrame(() => {
      bankaiFlash.classList.remove('active');
      // Forzar display: none y pointer-events: none apenas termine su transición de opacidad
      setTimeout(() => {
        bankaiFlash.style.display = 'none';
        bankaiFlash.style.pointerEvents = 'none';
      }, 400);
    });
  }

  // Revelación del portafolio al llegar a la fase de reposo (3.5s)
  setTimeout(() => {
    if (hasTransitionedPhase4) return;
    hasTransitionedPhase4 = true;

    document.body.classList.remove('splash-active');

    if (portfolioContent) portfolioContent.classList.add('visible');
    if (sakuraBranch) sakuraBranch.classList.add('visible');

    startTerminal();
  }, 3500);

  // ── 8. BUCLE DE ANIMACIÓN Y FÍSICA TEMPORAL BANKAI ──
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsedTime = clock.getElapsedTime();

    // ── FASE GÉISER (0.0s A 1.5s): ASCENSO DE ESPADAS, ONDAS Y COLUMNAS DE PÉTALOS ──
    if (elapsedTime < 1.5) {
      // Byakuya permanece de frente flotando suavemente en el centro
      if (byakuyaSprite) {
        byakuyaSprite.position.y = Math.sin(elapsedTime * 2.2) * 0.05;
      }

      // Ascenso de las katanas colosales: de -42.0 hasta 0.0 (suelo)
      for (let i = 0; i < swordsList.length; i++) {
        const sw = swordsList[i];
        const t = Math.max(elapsedTime - sw.delay, 0);
        const progress = Math.min(t / sw.duration, 1.0);
        const ease = 1 - Math.pow(1 - progress, 3);
        sw.group.position.y = sw.startY + (sw.targetY - sw.startY) * ease;
      }

      // Ondas concéntricas de agua en el pie de las hojas (Y = 0)
      for (let i = 0; i < ripplesList.length; i++) {
        const rp = ripplesList[i];
        if (elapsedTime >= rp.delay) {
          const tRipple = (elapsedTime - rp.delay) * 1.8;

          // Onda 1: Expansión de escala y desvanecimiento
          const p1 = tRipple % 1.0;
          const s1 = 0.6 + p1 * 5.2;
          rp.ring1.scale.set(s1, s1, s1);
          rp.mat1.opacity = Math.max(0, (1.0 - p1) * 0.85);

          // Onda 2: Desfasada
          const p2 = (tRipple + 0.5) % 1.0;
          const s2 = 0.6 + p2 * 5.2;
          rp.ring2.scale.set(s2, s2, s2);
          rp.mat2.opacity = Math.max(0, (1.0 - p2) * 0.65);
        }
      }

      // ── FÍSICA DE FUENTE / DOMO: GÉISER CONTROLADO Y BÓVEDA SOBRE BYAKUYA ──
      const pos = geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const em = emitterPositions[pEmitter[i]];
        const idx = i * 3;

        if (elapsedTime >= em.delay) {
          let curY = pos[idx + 1];
          let vy = pVy[i];

          // Ascenso vertical a lo largo de las hojas
          curY += vy * delta;

          // Al llegar a media pantalla (Y ≈ 10 a 14), desacelera progresivamente (velocidadY *= 0.96)
          if (curY > 9.0) {
            vy *= Math.pow(0.96, delta * 60.0);
          }
          if (curY > 13.0) {
            vy -= 14.0 * delta; // Arco gravitatorio parabólico suave
          }

          // Límite vertical estricto: ninguna partícula debe superar Y = 18
          if (curY > 17.5) {
            curY = 17.5;
            vy = Math.min(vy, -1.0); // Curva hacia abajo y hacia el espectador
          }
          pVy[i] = vy;
          pos[idx + 1] = curY;

          // Curvatura hacia el centro del pasillo formando la cúpula sobre Byakuya (X ≈ 0, Z ≈ -10)
          if (curY > 6.0) {
            const domeWeight = Math.min((curY - 6.0) / 8.0, 1.0);
            const targetX = Math.sin(pPhase[i] + elapsedTime * 1.8) * 4.5;
            const targetZ = -10.0 + Math.cos(pPhase[i] + elapsedTime * 1.5) * 5.0;

            pos[idx]     = THREE.MathUtils.lerp(pos[idx], targetX, domeWeight * delta * 2.8);
            pos[idx + 2] = THREE.MathUtils.lerp(pos[idx + 2], targetZ, domeWeight * delta * 2.4);

            // Curvar hacia el espectador (+Z) antes de salir de la pantalla
            if (curY > 13.5) {
              pos[idx + 2] += 5.5 * delta;
            }
          } else {
            // Ascenso helicoidal inicial en la base
            pTheta[i] += pAngularSpeed[i] * delta;
            pos[idx]     = em.x + pRadius[i] * Math.cos(pTheta[i]);
            pos[idx + 2] = em.z + pRadius[i] * Math.sin(pTheta[i]);
          }
        }
      }
      geometry.attributes.position.needsUpdate = true;
    }

    // ── FASE AVALANCHA (1.5s A 3.5s): DETONACIÓN Y COLAPSO FRONTAL MASIVO ──
    if (elapsedTime >= 1.5 && !burstTriggered) {
      burstTriggered = true;
      triggerFlashOverlay();

      // Erradicación absoluta de Byakuya al segundo 1.5 (Desaparición Limpia)
      if (byakuyaSprite) {
        byakuyaSprite.material.opacity = 0;
        byakuyaSprite.visible = false; // Desactiva por completo el dibujo del quad
        scene.remove(byakuyaSprite);
      }

      // Desaparición inmediata de las espadas y ondas al detonar
      if (swordsGroup.visible) swordsGroup.visible = false;
      if (waterRipplesGroup.visible) waterRipplesGroup.visible = false;
    }

    // Transición en el segundo 3.5 en adelante hacia el reposo
    if (elapsedTime >= 3.5 && transitionFactor < 1.0) {
      transitionFactor = Math.min(transitionFactor + delta * 2.0, 1.0);
    }

    // ── FÍSICA DE LA AVALANCHA FRONTAL Y CAÍDA LIBRE (1.5s+) ──
    if (elapsedTime >= 1.5) {
      const pos = geometry.attributes.position.array;
      const mouseX = mouse.x * 2.2;
      const mouseY = mouse.y * 1.0;

      // ── FASE 2: AVALANCHA FRONTAL EN PANTALLA COMPLETA (1.5s A 3.5s) ──
      // Al desaparecer las espadas y Byakuya, la cúpula acumulada en el centro NO sube más.
      // Colapsa y se dispara con fuerza explosiva hacia la cámara (Z positivo veloz hacia Z = 28),
      // dispersándose uniformemente en todo el ancho (X in [-25, 25]) y alto (Y in [-12, 16]) del monitor.
      if (elapsedTime < 3.5) {
        for (let i = 0; i < particleCount; i++) {
          const idx = i * 3;

          // 1. Z positivo veloz hacia la cámara (hacia Z = 28 y cruzando el frente)
          pos[idx + 2] += pAvalancheVz[i] * delta;

          // 2. Dispersión uniforme en todo el ancho (X in [-25, 25])
          pos[idx] = THREE.MathUtils.lerp(pos[idx], pFanX[i] + mouseX, delta * 3.2);

          // 3. Colapso hacia abajo y dispersión en todo el alto (Y in [-12, 16])
          pos[idx + 1] = THREE.MathUtils.lerp(pos[idx + 1], pFanY[i] + mouseY, delta * 2.8);

          // Límite vertical estricto: ninguna partícula debe superar Y = 18
          if (pos[idx + 1] > 17.5) {
            pos[idx + 1] = 17.5;
          }

          // 4. Marea densa durante los 2 segundos: si cruza la cámara (Z > 30), reciclar en Z in [-2, 8]
          if (pos[idx + 2] > 30.0) {
            pos[idx + 2] = -2.0 + Math.random() * 8.0;
            pos[idx]     = (Math.random() - 0.5) * 48.0; // X in [-24, 24]
            pos[idx + 1] = -10.0 + Math.random() * 26.0; // Y in [-10, 16]
            pAvalancheVz[i] = 48.0 + Math.random() * 45.0;
          }
        }
      }
      // ── FASE 3: REPOSO Y CAÍDA AMBIENTAL LENTA (3.5s en adelante) ──
      // La avalancha se asienta y los pétalos flotan suavemente en caída ambiental lenta de arriba hacia abajo
      else {
        for (let i = 0; i < particleCount; i++) {
          const idx = i * 3;

          // Frenar la inercia de avalancha frontal suavemente
          pAvalancheVz[i] = THREE.MathUtils.lerp(pAvalancheVz[i], 0.0, delta * 3.0);
          pos[idx + 2] += pAvalancheVz[i] * delta * (1.0 - transitionFactor);

          // Caída ambiental lenta de arriba hacia abajo
          pos[idx + 1] -= pFallSpeed[i] * delta * transitionFactor;

          // Balanceo suave orgánico
          pos[idx]     += Math.sin(elapsedTime * pSwaySpeed[i] + pPhase[i]) * 0.022;
          pos[idx + 2] += Math.cos(elapsedTime * pSwaySpeed[i] * 0.8 + pPhase[i]) * 0.015;

          // Reciclaje ambiental en caída suave dentro del campo de visión (Y <= 17.5, respetando límite Y <= 18)
          if (pos[idx + 1] < -14.0) {
            pos[idx + 1] = 17.5;
            pos[idx]     = (Math.random() - 0.5) * 48.0;
            pos[idx + 2] = 2.0 + Math.random() * 24.0;
          }
        }
      }

      geometry.attributes.position.needsUpdate = true;
    }

    // Suavizado de cámara / Parallax panorámico calibrado
    mouse.lerp(targetMouse, 0.05);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.x * 2.2, 0.03);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 4.0 + mouse.y * 1.0, 0.03);
    camera.lookAt(0, 6, 0);

    renderer.render(scene, camera);
  }

  animate();

  // ── 9. SISTEMA DE TEMAS DINÁMICOS (MODO CLARO / MODO OSCURO) ──
  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);

    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }

    localStorage.setItem('portfolio_theme', theme);

    const themeConfig = THEMES[theme];
    if (themeConfig) {
      pointsMaterial.color.setHex(themeConfig.petalColor);
      swordMaterial.color.setHex(themeConfig.swordColor);
      swordMaterial.emissive.setHex(themeConfig.emissive);
    }
  }

  function toggleTheme() {
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
  }

  const themeToggleDock = document.getElementById('themeToggleDock');
  const themeToggleNav = document.getElementById('themeToggleNav');
  const themeToggleMobile = document.getElementById('themeToggleMobile');

  if (themeToggleDock) themeToggleDock.addEventListener('click', toggleTheme);
  if (themeToggleNav) themeToggleNav.addEventListener('click', toggleTheme);
  if (themeToggleMobile) themeToggleMobile.addEventListener('click', toggleTheme);

  const savedTheme = localStorage.getItem('portfolio_theme');
  if (savedTheme && THEMES[savedTheme]) {
    applyTheme(savedTheme);
  }

  // ── 10. GESTIÓN DEL MODAL Y DESCARGA BILINGÜE DE CV (ESPAÑOL / INGLÉS) ──
  const cvModal = document.getElementById('cvModal');
  const openCvModalBtn = document.getElementById('openCvModalBtn');
  const contactCvBtn = document.getElementById('contactCvBtn');
  const cvModalClose = document.getElementById('cvModalClose');
  const cvModalBackdrop = document.getElementById('cvModalBackdrop');

  function openCvModal() {
    if (!cvModal) return;
    cvModal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeCvModal() {
    if (!cvModal) return;
    cvModal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  if (openCvModalBtn) openCvModalBtn.addEventListener('click', openCvModal);
  if (contactCvBtn) contactCvBtn.addEventListener('click', openCvModal);
  if (cvModalClose) cvModalClose.addEventListener('click', closeCvModal);
  if (cvModalBackdrop) cvModalBackdrop.addEventListener('click', closeCvModal);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cvModal && !cvModal.hasAttribute('hidden')) {
      closeCvModal();
    }
  });

  let toastTimer = null;
  function showDownloadToast(filename, isEnglish = false) {
    const toast = document.getElementById('downloadToast');
    if (!toast) return;

    const titleEl = toast.querySelector('.toast-title');
    const msgEl = toast.querySelector('.toast-msg');

    if (titleEl && msgEl) {
      if (isEnglish) {
        titleEl.textContent = 'CV Downloaded!';
        msgEl.textContent = `${filename} (Ready for review)`;
      } else {
        titleEl.textContent = '¡CV descargado!';
        msgEl.textContent = `${filename} (Listo para revisión)`;
      }
    }

    if (toastTimer) clearTimeout(toastTimer);
    toast.classList.add('show');

    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3800);
  }

  document.querySelectorAll('.btn-download-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const isEnglish = btn.getAttribute('data-lang') === 'en';
      const downloadAttr = btn.getAttribute('download') || (isEnglish ? 'Daniel_Jaimes_CV_EN.pdf' : 'Daniel_Jaimes_CV_ES.pdf');
      showDownloadToast(downloadAttr, isEnglish);
    });
  });

  // ── 11. TERMINAL TYPEWRITER (STACK Y EXPERIENCIA DE DANIEL) ──
  const terminalLines = [
    { text: 'whoami',                             cls: 'prompt' },
    { text: '→ Daniel Gamboa (Daniel E. Jaimes)', cls: 'out' },
    { text: '',                                   cls: 'out'    },
    { text: 'cat stack.json',                     cls: 'prompt' },
    { text: '{ frontend: "HTML/CSS/JS" }',        cls: 'accent' },
    { text: '{ backend:  "Python/Node" }',        cls: 'accent' },
    { text: '{ data:     "SQL" }',                cls: 'accent' },
    { text: '{ bots:     "n8n" }',                cls: 'accent' },
    { text: '',                                   cls: 'out'    },
    { text: 'git log --oneline',                  cls: 'prompt' },
    { text: '✔ Hackathon Metrolínea',             cls: 'out'    },
    { text: '✔ DeliveryBot con n8n',              cls: 'out'    },
    { text: '✔ Sistema préstamos vecinal',        cls: 'out'    },
  ];

  let terminalStarted = false;
  async function startTerminal() {
    if (terminalStarted) return;
    terminalStarted = true;

    const termBody = document.getElementById('terminalBody');
    if (!termBody) return;
    termBody.innerHTML = '';

    for (const line of terminalLines) {
      const el = document.createElement('div');
      if (line.cls === 'prompt') {
        const pr = document.createElement('span');
        pr.className = 't-prompt';
        pr.textContent = '❯ ';
        const cmd = document.createElement('span');
        cmd.className = 't-cmd';
        el.appendChild(pr);
        el.appendChild(cmd);
        termBody.appendChild(el);
        await typeLine(cmd, line.text, 35);
      } else if (line.cls === 'accent') {
        el.className = 't-accent';
        termBody.appendChild(el);
        await typeLine(el, line.text, 22);
      } else {
        el.className = 't-out';
        el.textContent = line.text;
        termBody.appendChild(el);
        await delay(60);
      }
    }

    const cursor = document.createElement('span');
    cursor.className = 't-cursor';
    termBody.appendChild(cursor);
  }

  function typeLine(el, text, speed = 40) {
    return new Promise(resolve => {
      let i = 0;
      const interval = setInterval(() => {
        el.textContent += text[i++];
        if (i >= text.length) {
          clearInterval(interval);
          resolve();
        }
      }, speed);
    });
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ── 12. MENÚ MÓVIL Y HAMBURGER ──
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (hamburgerBtn && mobileMenu) {
    hamburgerBtn.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      hamburgerBtn.classList.toggle('open', open);
      hamburgerBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.querySelectorAll('.mobile-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburgerBtn.classList.remove('open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ── 13. SCROLL REVEAL Y BARRAS DE HABILIDADES ──
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        entry.target.querySelectorAll('.skill-bar[data-w]').forEach(bar => {
          bar.style.width = bar.dataset.w + '%';
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  document.querySelectorAll('.skill-card').forEach(card => observer.observe(card));

});
