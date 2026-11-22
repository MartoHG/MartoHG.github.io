import * as THREE from './vendor/three-desk.min.js';
import { buildModels } from './desk-models.js';

const sceneColor = 0xeae2f4;
const butter = 0xf4d284;
const wakeEnd = 175;
const reachStart = 270;
const pushStart = 465;
const release = 795;
const tapReady = 840;
const tapAt = 965;
const settle = 1290;
const petEnd = 710;
const napDelay = 4800;
const napEnd = 1480;
const switchAt = 350;
const switchEnd = 795;
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

function makeChoreography(folders, cat, showProject, lightSwitchContact, applyPendingTheme) {
  const progress = folders.map(() => 0);
  const paw = new THREE.Vector3();
  const shoulder = new THREE.Vector3();
  const elbow = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const restPaw = new THREE.Vector3(2.19, .738, .49);
  const tuckedPaw = new THREE.Vector3(1.96, .70, .52);
  const idlePaw = restPaw.clone();
  const reach = new THREE.Vector3();
  const folderCenter = (folders.length - 1) / 2;
  let awake = 0;
  let look = 0;
  let tuck = 0;
  let target = 0;
  let motion = null;
  let petQueued = false;

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

  function poseCat({ peek = false, lift = 0, tailFlick = 0, earFlick = 0, breath = 0 } = {}) {
    const cushion = tuck * (1 - awake);
    cat.head.position.set(
      1.66 + look * .095 + cushion * .055,
      1.04 + awake * .37 + lift - cushion * .105,
      -.21 - awake * .15 + cushion * .068,
    );
    cat.head.rotation.set(
      .075 + awake * .12 + cushion * .10,
      .09 + look * .27 + cushion * .06,
      -.067 + awake * .09 - look * .04 - cushion * .10,
    );
    cat.openEyes.forEach((eye, index) => {
      eye.visible = awake > .49 || (peek && index === 1);
      cat.closedEyes[index].visible = !eye.visible;
    });
    cat.torso.rotation.z = look * .036;
    cat.torso.scale.y = 1 + breath * .068;
    cat.tail.rotation.y = -awake * .25 + look * .06 + tailFlick;
    cat.ear.rotation.z = earFlick;

    shoulder.set(1.76 + look * .09, 1.06 + awake * .17, -.31);
    elbow.lerpVectors(shoulder, paw, .55);
    // The raised elbow lets the toes lead during the push.
    elbow.x += .13;
    elbow.y += .16 + awake * .18;
    alignSegment(cat.upper, shoulder, elbow, direction);
    alignSegment(cat.lower, elbow, paw, direction);
    cat.paw.position.copy(paw);
    cat.paw.rotation.set(-.09 + awake * .14, look * .19 - cushion * .28, -.03 - cushion * .10);
  }

  function finish(index = target) {
    markSelection(index);
    motion = null;
    petQueued = false;
    progress.forEach((_, position) => { progress[position] = position === index ? 1 : 0; });
    awake = 0;
    look = 0;
    paw.copy(idlePaw);
    placeFolders();
    poseCat();
  }

  function start(index, replay) {
    markSelection(index);
    motion = {
      kind: 'folder',
      elapsed: 0,
      progress: progress.slice(),
      awake,
      look,
      paw: paw.clone(),
      replay,
    };
  }

  function pet() {
    if (motion?.kind === 'folder' || motion?.kind === 'light') {
      petQueued = true;
    } else {
      motion = { kind: 'pet', elapsed: 0, paw: paw.clone() };
    }
  }

  function finishActiveMotion() {
    const shouldPet = petQueued;
    finish();
    if (shouldPet) pet();
    return shouldPet;
  }

  function advance(delta) {
    if (!motion) return false;
    const previous = motion.elapsed;
    motion.elapsed += delta;
    const time = motion.elapsed;
    if (motion.kind === 'pet') {
      const lift = easeBetween(time, 0, 155) * (1 - easeBetween(time, 435, petEnd));
      const flick = Math.sin(2 * Math.PI * easeBetween(time, 95, 590)) * lift * .46;
      paw.lerpVectors(motion.paw, idlePaw, easeBetween(time, 0, 180));
      poseCat({ peek: time >= 105 && time < 480, lift: lift * .085, tailFlick: flick });
      if (time < petEnd) return true;
      motion = null;
      return false;
    }

    if (motion.kind === 'nap') {
      const inhale = easeBetween(time, 0, 390) * (1 - easeBetween(time, 470, 1120));
      const ear = Math.sin(2 * Math.PI * easeBetween(time, 900, 1280));
      tuck = easeBetween(time, 260, 1130);
      idlePaw.lerpVectors(restPaw, tuckedPaw, tuck);
      paw.copy(idlePaw);
      paw.y += .17 * Math.sin(Math.PI * tuck);
      poseCat({
        lift: inhale * .073,
        tailFlick: inhale * .13,
        earFlick: ear * .26,
        breath: inhale,
      });
      if (time < napEnd) return true;
      motion = null;
      return false;
    }

    if (motion.kind === 'light') {
      const wake = easeBetween(time, 0, 170);
      const reachSwitch = easeBetween(time, 85, switchAt);
      const recoil = easeBetween(time, switchAt + 48, switchEnd);
      awake = mix(motion.awake, .82, wake) * (1 - recoil);
      look = mix(motion.look, .86, wake) * (1 - recoil);
      paw.copy(motion.paw).lerp(lightSwitchContact, reachSwitch).lerp(idlePaw, recoil);
      paw.y += .27 * Math.sin(Math.PI * reachSwitch) + .22 * Math.sin(Math.PI * recoil);
      poseCat();
      if (previous < switchAt && time >= switchAt) applyPendingTheme();
      return time < switchEnd ? true : finishActiveMotion();
    }

    if (time >= settle) return finishActiveMotion();

    const recoil = easeBetween(time, tapAt + 45, settle);
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
    const tapLift = easeBetween(time, release - 60, tapReady) * (1 - easeBetween(time, tapReady, tapAt));
    reach.set(
      folder.x + .36,
      folder.y + folders[target].surface + .128 + tapLift * .31,
      folder.z + .52 - tapLift * .16,
    );
    paw.copy(motion.paw);
    paw.lerp(idlePaw, wake * .52);
    paw.lerp(reach, easeBetween(time, reachStart, pushStart));
    paw.lerp(idlePaw, recoil);
    poseCat();
    if (previous < tapAt && time >= tapAt) showProject(target);

    return true;
  }

  return {
    get kind() { return motion?.kind; },
    start,
    finish,
    advance,
    pet,
    stillPet: () => poseCat({ peek: true }),
    nap: () => { motion = { kind: 'nap', elapsed: 0 }; },
    switchLight: () => {
      motion = { kind: 'light', elapsed: 0, awake, look, paw: paw.clone() };
    },
  };
}

export function mountDesk(stage, folderNames, projectImages, initialProject) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: false, powerPreference: 'low-power',
  });

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 65);
  camera.position.set(7.8, 11.4, 15);
  camera.lookAt(0, .28, -.02);
  const ambient = new THREE.AmbientLight();
  scene.add(ambient);
  const lamp = new THREE.DirectionalLight();
  lamp.position.set(-4, 8, 5);
  scene.add(lamp);
  const fill = new THREE.DirectionalLight();
  fill.position.set(5, 3, -5);
  scene.add(fill);

  const { folders, cat, monitor, lightSwitch } = buildModels(scene, folderNames);
  const catMotion = makeChoreography(folders, cat, showProject, lightSwitch.contact, applyPendingTheme);
  const petButton = stage.querySelector('[data-cat-pet]');
  const petCenter = new THREE.Vector3();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 640px), (pointer: coarse)');
  let project = initialProject;
  let visible = false;
  let contextLost = false;
  let sizeChanged = true;
  let animating = false;
  let frame = 0;
  let previousTime = null;
  let pendingPreview = false;
  let monitorProject = null;
  let stillPetTimer = 0;
  let napTimer = 0;
  let napped = false;
  let pendingTheme = null;
  catMotion.finish(project);
  setDeskTheme(document.documentElement.dataset.theme === 'dark');
  stage.append(canvas);

  function canRender() {
    return visible && !document.hidden && !contextLost;
  }

  function setDeskTheme(dark) {
    renderer.setClearColor(dark ? 0x28243a : sceneColor);
    ambient.color.setHex(dark ? 0xbab4f0 : 0xf3e9ff);
    ambient.intensity = dark ? .95 : 1.28;
    lamp.color.setHex(dark ? 0xbbc6ff : 0xfff1dc);
    lamp.intensity = dark ? .85 : 2.14;
    fill.color.setHex(dark ? 0xa0b2fc : 0xe7ebff);
    fill.intensity = dark ? .57 : .36;
    lightSwitch.setDark(dark);
  }

  function applyPendingTheme() {
    const commit = pendingTheme;
    pendingTheme = null;
    commit?.();
  }

  function startTheme() {
    catMotion.switchLight();
    previousTime = null;
    animating = true;
  }

  function cancelNapTimer() {
    clearTimeout(napTimer);
    napTimer = 0;
  }

  function planNap() {
    if (napped || napTimer || reducedMotion.matches || !canRender()) return;
    napTimer = setTimeout(() => {
      napTimer = 0;
      if (!canRender() || animating || reducedMotion.matches) return;
      napped = true;
      catMotion.nap();
      animating = true;
      schedule();
    }, napDelay);
  }

  function showProject(index) {
    pendingPreview = false;
    if (monitorProject === index) return;
    const image = projectImages[index];

    function display() {
      if (project !== index || pendingPreview || !image.naturalWidth) return;
      monitor.showPreview(image);
      monitorProject = index;
      schedule();
    }

    if (image.complete) display();
    else image.decode().then(display, () => {});
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
    camera.updateMatrixWorld();

    petCenter.set(.43, 1.38, -.69).project(camera);
    petButton.style.left = `${(petCenter.x + 1) * 50}%`;
    petButton.style.top = `${(1 - petCenter.y) * 50}%`;
    petButton.style.width = `${4.1 / (viewHeight * aspect) * 100}%`;
    petButton.style.height = `${2.15 / viewHeight * 100}%`;

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
    if (!animating) {
      previousTime = null;
      if (pendingTheme) startTheme();
      else planNap();
    }
    if (animating) schedule();
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
    clearTimeout(stillPetTimer);
    cancelNapTimer();
    animating = false;
    catMotion.finish(project);
    if (pendingPreview) showProject(project);
    applyPendingTheme();
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
    if (reducedMotion.matches) settleImmediately();
    schedule();
  });

  document.addEventListener('desk:theme-request', event => {
    if (!canRender() || !stage.hasAttribute('data-rendered') || reducedMotion.matches) return;
    event.preventDefault();
    pendingTheme = event.detail.commit;
    cancelNapTimer();
    if (catMotion.kind !== 'folder' && catMotion.kind !== 'light') {
      startTheme();
      schedule();
    }
  });
  document.addEventListener('desk:theme-change', event => {
    setDeskTheme(event.detail.dark);
    schedule();
  });

  petButton.addEventListener('click', () => {
    if (!canRender()) return;
    cancelNapTimer();
    if (reducedMotion.matches) {
      clearTimeout(stillPetTimer);
      catMotion.stillPet();
      stillPetTimer = setTimeout(() => {
        catMotion.finish(project);
        schedule();
      }, petEnd);
    } else {
      catMotion.pet();
      animating = true;
    }
    schedule();
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
      pendingPreview = true;
      if (reducedMotion.matches || !canRender()) {
        settleImmediately();
      } else {
        clearTimeout(stillPetTimer);
        cancelNapTimer();
        if (catMotion.kind === 'light') applyPendingTheme();
        catMotion.start(index, replay);
        previousTime = null;
        animating = true;
      }
      schedule();
    },
  };
}
