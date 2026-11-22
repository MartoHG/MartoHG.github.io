import * as THREE from './vendor/three-desk.min.js';

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const flatMaterial = new THREE.MeshLambertMaterial();
const matrix = new THREE.Matrix4();
const color = new THREE.Color();
const shadowGeometry = new THREE.PlaneGeometry(1, 1);
shadowGeometry.rotateX(-Math.PI / 2);

const fur = {
  base: 0x8598b2,
  dark: 0x687a95,
  stripe: 0x52637e,
  light: 0xaabacf,
  cream: 0xd9d9e5,
  nose: 0xbf8498,
  ink: 0x333346,
};

function boxes(parent, parts) {
  const mesh = new THREE.InstancedMesh(boxGeometry, flatMaterial, parts.length);
  parts.forEach(([x, y, z, width, height, depth, tint], index) => {
    matrix.makeScale(width, height, depth);
    matrix.setPosition(x, y, z);
    mesh.setMatrixAt(index, matrix);
    mesh.setColorAt(index, color.setHex(tint));
  });
  parent.add(mesh);
  return mesh;
}

function group(parent, x = 0, y = 0, z = 0) {
  const child = new THREE.Group();
  child.position.set(x, y, z);
  parent.add(child);
  return child;
}

function slab(parent, x, y, z, width, height, depth, step, tint) {
  const left = -width / 2;
  const right = width / 2;
  const back = -depth / 2;
  const front = depth / 2;
  const outline = new THREE.Shape();
  outline.moveTo(left + step, back);
  for (const [px, pz] of [
    [right - step, back], [right - step, back + step], [right, back + step],
    [right, front - step], [right - step, front - step], [right - step, front],
    [left + step, front], [left + step, front - step], [left, front - step],
    [left, back + step], [left + step, back + step],
  ]) outline.lineTo(px, pz);
  outline.closePath();
  const geometry = new THREE.ExtrudeGeometry(outline, { depth: height, bevelEnabled: false });
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: tint }));
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function shadowMaterial(opacity, tint) {
  const size = 32;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const distance = Math.hypot((x + .5) / size * 2 - 1, (y + .5) / size * 2 - 1);
      const pixel = (y * size + x) * 4;
      pixels.fill(255, pixel, pixel + 3);
      pixels[pixel + 3] = 255 * Math.max(0, 1 - distance ** 2) ** 2.4;
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return new THREE.MeshBasicMaterial({
    color: tint, map: texture, transparent: true, opacity, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  });
}

function shadow(parent, material, x, y, z, width, depth) {
  const mesh = new THREE.Mesh(shadowGeometry, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(width, 1, depth);
  parent.add(mesh);
  return mesh;
}

function buildDesk(scene, contact) {
  const desk = group(scene);
  shadow(desk, shadowMaterial(.26, 0x57466f), .35, -.72, .36, 17.8, 10.8);

  slab(desk, 0, -.62, 0, 11.1, .21, 6.1, .32, 0x748b72);
  slab(desk, 0, -.44, 0, 11.62, .40, 6.65, .20, 0x98af92);
  slab(desk, 0, -.09, 0, 11.67, .09, 6.68, .20, 0xb4c7ad);
  slab(desk, 0, 0, 0, 11.42, .027, 6.40, .17, 0xbdd0b3);

  boxes(desk, [
    [2.31, -.257, 3.335, 3.36, .26, .028, 0x8ba085],
    [2.31, -.259, 3.359, .54, .082, .045, 0xd4dec4],
    [2.31, -.299, 3.36, .34, .037, .046, 0x71896f],
    [-4.4, -.49, 2.7, .56, .25, .53, 0x7b957a],
    [4.46, -.49, 2.7, .56, .25, .53, 0x7b957a],
  ]);

  shadow(desk, contact, -3.29, .035, -1.17, 3.55, 2.3);
  shadow(desk, contact, 4.35, .035, -1.76, 2.15, 2.1);
  shadow(desk, contact, 1.05, .035, -.44, 4.4, 3.22);
  shadow(desk, contact, -4.35, .035, 2.05, 1.44, 1.46);
  const monitor = buildComputer(desk);
  buildPlant(desk);
  buildAccessories(desk);
  return monitor;
}

function buildComputer(desk) {
  const monitor = group(desk, -3.26, .02, -1.31);
  monitor.rotation.y = .09;
  const lavender = 0xc9b9db;
  slab(monitor, 0, 0, .01, 1.98, .14, 1.14, .12, 0x9c90b7);
  boxes(monitor, [
    [0, .26, -.12, .9, .24, .73, 0xafa0c6],
    [0, 1.17, -.24, 2.08, 1.52, 1.13, 0xa597bc],
    [0, 1.23, 0, 2.22, 1.61, .78, lavender],
    [0, 1.28, .34, 2.38, 1.67, .35, 0xd4c4e5],
    [0, 1.34, .535, 1.92, 1.26, .078, 0x7a7196],
    [0, 1.35, .58, 1.75, 1.12, .045, 0x393f58],
    [0, 1.84, .607, 1.75, .135, .012, 0x515873],
    [-.737, 1.846, .621, .061, .045, .012, 0xe3adb6],
    [-.644, 1.846, .621, .061, .045, .012, 0xffda93],
    [-.551, 1.846, .621, .061, .045, .012, 0xb9d2ab],
    [.77, .536, .526, .096, .057, .018, 0x96b99a],
    [.60, .534, .526, .11, .044, .018, 0x9c8eac],
  ]);
  const code = [
    [-.7, 1.63, .28, 0xd7b5df], [-.37, 1.63, .66, 0x9ec7bd],
    [-.57, 1.48, .53, 0xacc7e8], [.01, 1.48, .25, 0xf2cf9e],
    [-.57, 1.33, .26, 0xd7b5df], [-.24, 1.33, .57, 0x9ec7bd],
    [-.57, 1.18, .38, 0xa4bddd], [-.13, 1.18, .22, 0xf2cf9e],
    [-.7, 1.03, .22, 0xd7b5df], [-.42, 1.03, .08, 0x9ec7bd],
  ];
  const codeLines = boxes(monitor, code.map(([x, y, width, tint]) => [x + width / 2, y, .611, width, .049, .014, tint]));

  const thumbnail = document.createElement('canvas');
  thumbnail.width = 128;
  thumbnail.height = 70;
  const context = thumbnail.getContext('2d');
  const texture = new THREE.CanvasTexture(thumbnail);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(1.65, .90),
    new THREE.MeshBasicMaterial({ map: texture }),
  );
  display.position.set(0, 1.295, .623);
  display.visible = false;
  monitor.add(display);

  const keyboard = group(desk, -3.19, .023, .37);
  keyboard.rotation.y = .09;
  slab(keyboard, 0, 0, 0, 2.27, .105, .86, .085, 0xb9afd0);
  const keys = [];
  for (let row = 0; row < 4; row++) {
    for (let column = 0; column < 11; column++) {
      if (row === 3 && column >= 3 && column <= 7) continue;
      const tint = (row === 0 || column === 0 || column === 10) ? 0x8c86ad : 0xe3dced;
      keys.push([(column - 5) * .184, .131, (row - 1.5) * .167, .148, .06, .127, tint]);
    }
  }
  keys.push([0, .131, .25, .89, .057, .13, 0xcdc1e0]);
  boxes(keyboard, keys);
  slab(desk, -1.52, .03, .46, .76, .031, 1.05, .14, 0x90a594);
  slab(desk, -1.52, .062, .46, .45, .133, .62, .10, 0xded1e5);
  boxes(desk, [[-1.52, .198, .585, .036, .02, .21, 0x9c8eae]]);

  return {
    showPreview(image) {
      const scale = Math.min(thumbnail.width / image.naturalWidth, thumbnail.height / image.naturalHeight);
      const width = Math.round(image.naturalWidth * scale);
      const height = Math.round(image.naturalHeight * scale);
      const left = Math.round((thumbnail.width - width) / 2);
      const top = Math.round((thumbnail.height - height) / 2);
      context.fillStyle = '#292d42';
      context.fillRect(0, 0, thumbnail.width, thumbnail.height);
      context.drawImage(image, left, top, width, height);
      context.fillStyle = 'rgba(41, 45, 66, .14)';
      for (let row = top + 1; row < top + height; row += 2) {
        context.fillRect(left, row, width, 1);
      }
      texture.needsUpdate = true;
      display.visible = true;
      codeLines.visible = false;
    },
  };
}

function buildPlant(desk) {
  const pot = group(desk, 4.35, .027, -1.8);
  slab(pot, 0, 0, 0, .70, .21, .69, .10, 0xc08088);
  slab(pot, 0, .21, 0, .81, .41, .80, .095, 0xd89d9f);
  slab(pot, 0, .58, 0, .94, .16, .93, .095, 0xe8adaf);
  boxes(pot, [
    [0, .744, 0, .715, .028, .72, 0x786962],
    [0, .99, 0, .16, .57, .16, 0x567b62],
    [.05, 1.37, -.04, .20, .29, .19, 0x668c6b],
    [.13, 1.57, -.065, .26, .24, .22, 0x83a77c],
    [.19, 1.725, -.08, .21, .11, .17, 0xa4bd8d],
    [.27, 1.18, .12, .37, .16, .25, 0x739b72],
    [.45, 1.30, .12, .20, .18, .24, 0x8daf7e],
    [-.24, 1.17, .08, .39, .2, .26, 0x577f62],
    [-.46, 1.28, .10, .22, .16, .23, 0x779b73],
    [-.49, 1.40, .10, .15, .10, .16, 0x95ad7f],
    [-.20, 1.38, -.13, .36, .15, .24, 0x7ca17a],
    [-.32, 1.51, -.14, .20, .15, .22, 0x8eb187],
    [.17, 1.04, -.21, .34, .15, .26, 0x638e68],
    [.33, 1.125, -.30, .21, .14, .22, 0x87ad7d],
  ]);
}

function buildLightSwitch(scene, contact) {
  const base = group(scene, 3.14, .029, .60);
  shadow(scene, contact, base.position.x, .034, base.position.z, .82, .68);
  slab(base, 0, 0, 0, .56, .075, .46, .055, 0x77758b);
  slab(base, 0, .074, 0, .51, .04, .41, .04, 0xd5c6dd);
  const rocker = group(base, -.06, .137, 0);
  boxes(rocker, [[0, 0, 0, .21, .057, .32, 0xf1e3f2]]);
  const indicator = new THREE.Mesh(boxGeometry, new THREE.MeshBasicMaterial({ color: 0x91a58d }));
  indicator.position.set(.149, .125, .065);
  indicator.scale.set(.063, .025, .10);
  base.add(indicator);

  return {
    contact: new THREE.Vector3(base.position.x - .06, .285, base.position.z),
    setDark(dark) {
      rocker.rotation.x = dark ? .23 : -.23;
      indicator.material.color.setHex(dark ? 0xf7c67d : 0x91a58d);
    },
  };
}

function buildAccessories(desk) {
  const mug = group(desk, -4.23, .03, 2.07);
  mug.rotation.y = -.12;
  slab(mug, 0, 0, 0, .62, .13, .63, .10, 0xd8a09e);
  boxes(mug, [
    [-.31, .40, 0, .12, .62, .66, 0xeab5ad],
    [.31, .40, 0, .12, .62, .66, 0xeab5ad],
    [0, .40, -.31, .62, .62, .12, 0xf1c1b6],
    [0, .40, .31, .62, .62, .12, 0xf1c1b6],
    [0, .53, 0, .505, .04, .506, 0x79594e],
    [.50, .57, .04, .32, .10, .13, 0xe3a6a1],
    [.50, .23, .04, .32, .10, .13, 0xe3a6a1],
    [.62, .40, .04, .10, .34, .13, 0xe3a6a1],
    [-.03, .40, .377, .19, .06, .016, 0xc47b84],
    [-.03, .345, .377, .08, .06, .016, 0xc47b84],
  ]);

  const notepad = group(desk, 4.32, .03, 1.08);
  notepad.rotation.y = -.23;
  slab(notepad, 0, 0, 0, 1.24, .075, .96, .08, 0x9d83b2);
  slab(notepad, 0, .075, 0, 1.17, .091, .86, .04, 0xf2e2db);
  slab(notepad, 0, .168, 0, 1.24, .055, .96, .08, 0xcab2d9);
  boxes(notepad, [
    [-.14, .226, .01, .53, .009, .023, 0x8e789d],
    [-.21, .226, .134, .40, .009, .023, 0x8e789d],
    [-.26, .226, .258, .29, .009, .023, 0x8e789d],
    [.43, .225, .015, .147, .08, .83, 0xd49c7f],
    [.43, .227, .464, .147, .078, .087, 0xf0cca5],
    [.43, .226, .524, .08, .052, .049, 0x625065],
  ]);

  const note = group(desk, -2.19, .029, 2.27);
  note.rotation.y = -.15;
  slab(note, 0, 0, 0, .83, .030, .69, .035, 0xe6cb86);
  slab(note, 0, .030, 0, .81, .017, .67, .035, 0xf7e2a4);
  boxes(note, [
    [-.14, .049, -.10, .27, .012, .025, 0x9b8256],
    [-.05, .049, .03, .45, .012, .025, 0x9b8256],
    [-.095, .049, .157, .36, .012, .025, 0x9b8256],
  ]);
}

const glyphs = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011',
  D: '110101101101110', E: '111100110100111', F: '111100110100100',
  G: '011100101101011', H: '101101111101101', I: '111010010010111',
  J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '101111111111101', O: '010101101101010',
  P: '110101110100100', Q: '010101101111011', R: '110101110101101',
  S: '011100010001110', T: '111010010010010', U: '101101101101111',
  V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111',
  0: '111101101101111', 1: '010110010010111', 2: '110001010100111',
  3: '110001010001110', 4: '101101111001001', 5: '111100110001110',
  6: '011100110101010', 7: '111001010010010', 8: '010101010101010',
  9: '010101011001110',
};

function labelTexture(name) {
  const words = name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase().match(/[A-Z0-9]+/g) ?? [];
  const text = (words.find(word => word.length >= 3) || words[0] || 'PROYECTO').slice(0, 8);
  const label = document.createElement('canvas');
  label.width = 64;
  label.height = 16;
  const context = label.getContext('2d');
  context.fillStyle = '#302638';
  const left = Math.round((64 - (text.length * 8 - 2)) / 2);
  for (let index = 0; index < text.length; index++) {
    const glyph = glyphs[text[index]];
    for (let pixel = 0; glyph && pixel < glyph.length; pixel++) {
      if (glyph[pixel] === '1') {
        context.fillRect(left + 8 * index + 2 * (pixel % 3), 3 + 2 * Math.floor(pixel / 3), 2, 2);
      }
    }
  }
  const texture = new THREE.CanvasTexture(label);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

const folderColors = [0xb8a7ce, 0xaac3a6, 0xa4b8d4, 0xe3aba9, 0xb6a3c9, 0xdcc097];

function buildFolders(scene, contact, names) {
  const intervals = Math.max(1, names.length - 1);
  const spacing = Math.min(.102, .51 / intervals);
  return names.map((name, index) => {
    const spread = index / intervals;
    const tint = folderColors[index % folderColors.length];
    const slot = new THREE.Vector3(.94 + .4 * spread, .591 - spacing * index, -.32 + .4 * spread);
    const out = new THREE.Vector3(1.21 + 1.10 * spread, .05, 2.08);
    const root = group(scene);
    const artwork = group(root);
    artwork.scale.y = spacing / .102;
    const cover = slab(artwork, 0, 0, 0, 2.52, .093, 1.59, .07, tint);
    const tab = boxes(artwork, [[-.49, .041, .845, 1.07, .091, .22, tint]]);
    const labelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.42, .355),
      new THREE.MeshBasicMaterial({ map: labelTexture(name), transparent: true, depthWrite: false }),
    );
    labelMesh.rotation.x = -Math.PI / 2;
    labelMesh.position.set(-.04, .098, .375);
    artwork.add(labelMesh);
    boxes(artwork, [
      [-.06, .055, .77, 1.89, .036, .075, 0xe8ded7],
      [.15, .055, .795, 1.16, .019, .043, 0xc9beaf],
    ]);
    const marker = boxes(artwork, [
      [.89, .105, .299, .125, .017, .055, 0x594226],
      [.89, .105, .352, .18, .017, .055, 0x594226],
      [.89, .105, .405, .232, .017, .055, 0x594226],
    ]);
    const shade = shadow(scene, contact, slot.x, .033, slot.z, 3.12, 2.25);
    return { root, cover, tab, marker, shade, slot, out, tint, surface: .093 * artwork.scale.y };
  });
}

function buildCat(scene) {
  const torso = group(scene, .75, .61, -.79);
  slab(torso, -.33, -.06, -.36, 2.66, .16, 1.41, .18, fur.dark);
  slab(torso, -.36, .09, -.36, 2.98, .34, 1.57, .23, fur.base);
  slab(torso, -.42, .41, -.46, 2.52, .32, 1.32, .21, fur.base);
  slab(torso, -.53, .70, -.51, 2.06, .17, 1.09, .19, fur.light);
  const stripes = [];
  for (const x of [-1.30, -.84, -.38, .08]) {
    stripes.push([x, .875, -.56, .16, .027, .56, fur.dark]);
    stripes.push([x + .025, .875, -.205, .105, .027, .17, fur.dark]);
    stripes.push([x + .03, .744, .127, .15, .126, .029, fur.dark]);
    stripes.push([x + .068, .581, .206, .13, .15, .028, fur.stripe]);
  }
  boxes(torso, stripes);
  boxes(torso, [
    [-1.11, .16, .52, .59, .25, .51, fur.dark],
    [-1.09, .112, .735, .45, .12, .21, fur.light],
    [.46, .14, .515, .51, .27, .63, fur.dark],
    [.50, .103, .792, .43, .18, .27, fur.light],
  ]);

  const tail = group(torso, -1.65, .29, -.69);
  boxes(tail, [
    [-.25, -.09, .03, .67, .30, .39, fur.base],
    [-.64, -.105, .25, .31, .28, .52, fur.dark],
    [-.63, -.115, .57, .35, .28, .30, fur.base],
    [-.45, -.133, .80, .44, .245, .29, fur.dark],
    [-.17, -.141, .825, .26, .23, .28, fur.base],
    [.01, -.15, .825, .23, .215, .25, fur.stripe],
  ]);

  const head = group(scene);
  slab(head, 0, -.32, 0, 1.36, .18, 1.05, .13, fur.dark);
  slab(head, 0, -.23, .025, 1.63, .50, 1.17, .14, fur.base);
  slab(head, -.015, .24, -.035, 1.48, .28, 1.055, .13, fur.light);
  const ear = group(head, .50, .48, -.02);
  boxes(ear, [
    [0, .024, 0, .39, .30, .36, fur.dark],
    [.16, .171, .105, .40, .18, .36, fur.base],
    [.34, .11, .203, .16, .26, .31, fur.dark],
    [.28, .105, .37, .17, .16, .031, fur.nose],
  ]);
  boxes(head, [
    [-.53, .48, -.06, .42, .30, .40, fur.dark],
    [-.60, .69, -.09, .29, .19, .31, fur.base],
    [-.66, .815, -.11, .17, .095, .23, fur.light],
    [-.55, .558, .157, .235, .24, .04, fur.nose],
    [-.61, .70, .08, .12, .13, .046, fur.nose],
    [-.275, .489, .245, .12, .063, .29, fur.dark],
    [0, .498, .27, .125, .046, .36, fur.stripe],
    [.275, .489, .245, .115, .063, .28, fur.dark],
    [-.24, .329, .48, .09, .115, .045, fur.dark],
    [.015, .342, .473, .115, .144, .046, fur.stripe],
    [.266, .331, .478, .092, .107, .046, fur.dark],
    [.754, .172, .197, .13, .094, .30, fur.stripe],
    [.766, .039, .28, .125, .083, .25, fur.dark],
    [-.62, -.115, .613, .27, .14, .11, fur.light],
    [.62, -.115, .613, .27, .14, .11, fur.light],
    [-.19, -.13, .64, .33, .194, .18, fur.cream],
    [.19, -.13, .64, .33, .194, .18, fur.cream],
    [0, -.225, .618, .26, .086, .18, fur.light],
    [0, -.064, .755, .147, .095, .055, fur.nose],
    [0, -.127, .755, .052, .057, .048, fur.ink],
    [-.195, -.12, .732, .041, .039, .018, fur.dark],
    [.195, -.12, .732, .041, .039, .018, fur.dark],
  ]);
  const closedEyes = [-1, 1].map(side => boxes(head, [
    [side * .39, .09, .631, .255, .052, .045, fur.ink],
    [side * .53, .12, .631, .053, .052, .047, fur.ink],
  ]));
  const openEyes = [-1, 1].map(side => boxes(head, [
    [side * .36, .096, .628, .165, .15, .042, fur.ink],
    [side * .36 - .02, .129, .653, .048, .047, .016, 0xfaf1d9],
  ]));

  const upper = group(scene);
  boxes(upper, [[0, .50, 0, .40, 1, .39, fur.base], [0, .68, .004, .411, .17, .399, fur.dark]]);
  const lower = group(scene);
  boxes(lower, [[0, .51, 0, .345, 1.06, .35, fur.base], [0, .53, .006, .357, .19, .36, fur.stripe]]);
  const paw = group(scene);
  boxes(paw, [
    [0, 0, 0, .435, .235, .46, fur.light],
    [-.098, -.037, .231, .018, .082, .016, fur.dark],
    [.098, -.037, .231, .018, .082, .016, fur.dark],
  ]);
  return { torso, tail, head, ear, openEyes, closedEyes, upper, lower, paw };
}

export function buildModels(scene, folderNames) {
  const contact = shadowMaterial(.27, 0x445748);
  const monitor = buildDesk(scene, contact);
  const lightSwitch = buildLightSwitch(scene, contact);
  const folders = buildFolders(scene, contact, folderNames);
  const cat = buildCat(scene);
  return { folders, cat, monitor, lightSwitch };
}
