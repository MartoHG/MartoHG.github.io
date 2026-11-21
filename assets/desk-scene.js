import * as THREE from './vendor/three-desk.min.js';
import { buildModels } from './desk-models.js';

const sceneColor = 0xeae2f4;
const butter = 0xf4d284;
const wakeEnd = 175;
const reachStart = 270;
const pushStart = 465;
const release = 795;
const settle = 1240;
const up = new THREE.Vector3(0, 1, 0);

const mix = (first, last, amount) => first + (last - first) * amount;
const unit = value => Math.min(1, Math.max(0, value));
const smooth = value => value * value * (3 - 2 * value);
const easeBetween = (time, start, end) => smooth(unit((time - start) / (end - start)));

function alignSegment(segment, from, to, direction) {
  direction.subVectors(to, from);
  segment.position.copy(from);
  segment.scale.y = direction.length();
  segment.quaternion.setFromUnitVectors(up, direction.normalize());
}

function makeChoreography(folders, cat) {
  const progress = folders.map(() => 0);
  const paw = new THREE.Vector3();
  const shoulder = new THREE.Vector3();
  const elbow = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const restPaw = new THREE.Vector3(2.19, .738, .49);
  const reach = new THREE.Vector3();
  const folderCenter = (folders.length - 1) / 2;
  let awake = 0;
  let look = 0;
  let target = 0;
  let motion = null;

  function markSelection(index) {
    target = index;
    folders.forEach(({ cover, tab, marker, tint }, position) => {
      const active = position === index;
      cover.material.color.setHex(active ? butter : tint);
      tab.setColorAt(0, cover.material.color);
      tab.instanceColor.needsUpdate = true;
      marker.visible = active;
    });
  }

  function placeFolders(bounce = 0) {
    folders.forEach(({ root, shade, slot, out }, index) => {
      const travel = progress[index];
      root.position.lerpVectors(slot, out, travel);
      // Keep the folder level until the front edge has slid out of the pile.
      root.position.y = mix(slot.y, out.y, smooth(unit((travel - .56) / .44)));
      if (index === target) root.position.y += bounce;
      const side = (index - folderCenter) / Math.max(1, folderCenter);
      root.rotation.y = mix(side * .0575, -.13 + .10 * side, travel);
      shade.position.x = root.position.x + .08;
      shade.position.z = root.position.z + .05;
      shade.visible = travel > .53;
    });
  }

  function poseCat() {
    cat.head.position.set(1.66 + look * .095, 1.04 + awake * .37, -.21 - awake * .15);
    cat.head.rotation.set(.075 + awake * .12, .09 + look * .27, -.067 + awake * .09 - look * .04);
    cat.openEyes.visible = awake > .49;
    cat.closedEyes.visible = !cat.openEyes.visible;
    cat.torso.rotation.z = look * .036;
    cat.tail.rotation.y = -awake * .25 + look * .06;

    shoulder.set(1.76 + look * .09, 1.06 + awake * .17, -.31);
    elbow.lerpVectors(shoulder, paw, .55);
    // The raised elbow lets the toes lead during the push.
    elbow.x += .13;
    elbow.y += .16 + awake * .18;
    alignSegment(cat.upper, shoulder, elbow, direction);
    alignSegment(cat.lower, elbow, paw, direction);
    cat.paw.position.copy(paw);
    cat.paw.rotation.set(-.09 + awake * .14, look * .19, -.03);
  }

  function finish(index = target) {
    markSelection(index);
    motion = null;
    progress.forEach((_, position) => { progress[position] = position === index ? 1 : 0; });
    awake = 0;
    look = 0;
    paw.copy(restPaw);
    placeFolders();
    poseCat();
  }

  function start(index, replay) {
    markSelection(index);
    motion = {
      elapsed: 0,
      progress: progress.slice(),
      awake,
      look,
      paw: paw.clone(),
      replay,
    };
  }

  function advance(delta) {
    if (!motion) return false;
    motion.elapsed += delta;
    const time = motion.elapsed;
    if (time >= settle) {
      finish();
      return false;
    }

    const recoil = easeBetween(time, release, settle);
    const wake = easeBetween(time, 0, wakeEnd);
    const pull = easeBetween(time, pushStart, release - 66);
    const park = easeBetween(time, 0, pushStart - 24);
    const bouncePhase = unit((time - (release - 66)) / 260);
    const bounce = .105 * Math.sin(Math.PI * bouncePhase) ** 2 * (1 - bouncePhase);

    progress.forEach((_, index) => {
      const initial = motion.progress[index];
      const parked = mix(initial, 0, park);
      progress[index] = index === target
        ? mix(motion.replay ? parked : initial, 1, pull)
        : parked;
    });
    placeFolders(bounce);

    const gaze = (target - folderCenter) / Math.max(1, folderCenter);
    awake = mix(motion.awake, 1, wake) * (1 - recoil);
    look = mix(motion.look, gaze, wake) * (1 - recoil);
    const folder = folders[target].root.position;
    reach.set(folder.x + .36, folder.y + folders[target].surface + .128, folder.z + .52);
    paw.copy(motion.paw);
    paw.lerp(restPaw, wake * .52);
    paw.lerp(reach, easeBetween(time, reachStart, pushStart));
    paw.lerp(restPaw, recoil);
    poseCat();

    return true;
  }

  return { start, finish, advance };
}

export function mountDesk(stage, folderNames, initialProject) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: false, powerPreference: 'low-power',
  });
  renderer.setClearColor(sceneColor);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 65);
  camera.position.set(7.8, 11.4, 15);
  camera.lookAt(0, .28, -.02);
  scene.add(new THREE.AmbientLight(0xf3e9ff, 1.28));
  const lamp = new THREE.DirectionalLight(0xfff1dc, 2.14);
  lamp.position.set(-4, 8, 5);
  scene.add(lamp);
  const fill = new THREE.DirectionalLight(0xe7ebff, .36);
  fill.position.set(5, 3, -5);
  scene.add(fill);

  const { folders, cat } = buildModels(scene, folderNames);
  const catMotion = makeChoreography(folders, cat);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 640px), (pointer: coarse)');
  let project = initialProject;
  let visible = false;
  let contextLost = false;
  let sizeChanged = true;
  let animating = false;
  let frame = 0;
  let previousTime = null;
  catMotion.finish(project);
  stage.append(canvas);

  function canRender() {
    return visible && !document.hidden && !contextLost;
  }

  function resize() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return false;
    const mobile = compact.matches;
    const aspect = width / height;
    const viewHeight = Math.max((mobile ? 14.1 : 15.1) / aspect, 7.35);
    camera.left = -viewHeight * aspect / 2;
    camera.right = -camera.left;
    camera.top = viewHeight / 2;
    camera.bottom = -camera.top;
    camera.updateProjectionMatrix();
    const ratio = Math.min(
      window.devicePixelRatio || 1,
      mobile ? 1.25 : 1.5,
      (mobile ? 600 : 1440) / width,
      (mobile ? 390 : 840) / height,
    );
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    return true;
  }

  function paint(time) {
    frame = 0;
    if (!canRender()) return;
    if (sizeChanged) {
      if (!resize()) return;
      sizeChanged = false;
    }
    if (animating) {
      const delta = previousTime === null ? 0 : Math.min(48, time - previousTime);
      previousTime = time;
      animating = catMotion.advance(delta);
    }
    renderer.render(scene, camera);
    stage.dataset.rendered = '';
    if (animating) schedule();
    else previousTime = null;
  }

  function schedule() {
    if (!frame && canRender()) frame = requestAnimationFrame(paint);
  }

  function pause() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = null;
  }

  function settleImmediately() {
    animating = false;
    catMotion.finish(project);
  }

  function onVisibilityChange() {
    if (canRender()) {
      schedule();
    } else {
      pause();
      settleImmediately();
    }
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    onVisibilityChange();
  });
  observer.observe(stage);

  new ResizeObserver(() => {
    sizeChanged = true;
    schedule();
  }).observe(stage);
  compact.addEventListener('change', () => {
    sizeChanged = true;
    schedule();
  });
  document.addEventListener('visibilitychange', onVisibilityChange);
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      settleImmediately();
      schedule();
    }
  });

  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    contextLost = true;
    delete stage.dataset.rendered;
    onVisibilityChange();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    sizeChanged = true;
    onVisibilityChange();
  });

  return {
    select(index) {
      const replay = index === project;
      project = index;
      if (reducedMotion.matches || !canRender()) {
        settleImmediately();
      } else {
        catMotion.start(index, replay);
        previousTime = null;
        animating = true;
      }
      schedule();
    },
  };
}
