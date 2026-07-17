/* ============================================================
   Portfolio — Martiniano Gavotti
   Animaciones: GSAP + ScrollTrigger + SplitText, scroll con Lenis.
   Si el usuario pide menos movimiento (prefers-reduced-motion),
   nada de esto corre y el sitio queda estático y completo.
   ============================================================ */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var nav = document.getElementById("nav");

  /* ---------- Nav compacta al scrollear (corre siempre) ---------- */
  function actualizarNav() {
    nav.classList.toggle("nav--compacta", window.scrollY > 40);
  }
  window.addEventListener("scroll", actualizarNav, { passive: true });
  actualizarNav();

  if (reduceMotion || typeof gsap === "undefined") {
    return; // sitio 100% funcional sin animaciones
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);

  /* ---------- Lenis: scroll con inercia ---------- */
  var lenis = new Lenis({ autoRaf: false });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(function (time) {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // Anclas internas pasan por Lenis para mantener la inercia
  // (excepto el skip-link, que debe mover el foco de forma nativa)
  document.querySelectorAll('a[href^="#"]:not(.saltar)').forEach(function (enlace) {
    enlace.addEventListener("click", function (e) {
      var destino = document.querySelector(enlace.getAttribute("href"));
      if (!destino) return;
      e.preventDefault();
      lenis.scrollTo(destino, { offset: -70 });
    });
  });

  /* ---------- Hero: del caos al orden ----------
     Las letras del titular entran dispersas y desordenadas y se
     acomodan en su lugar: la metáfora del trabajo de Martiniano. */
  var split = new SplitText("#hero-titulo", { type: "chars, words" });

  var intro = gsap.timeline({ defaults: { ease: "power3.out" } });

  intro
    .from(split.chars, {
      opacity: 0,
      x: function () { return gsap.utils.random(-120, 120); },
      y: function () { return gsap.utils.random(-80, 80); },
      rotation: function () { return gsap.utils.random(-40, 40); },
      duration: 0.9,
      stagger: { amount: 0.55, from: "random" }
    })
    .from(".hero__eyebrow", { opacity: 0, y: 14, duration: 0.5 }, "-=0.35")
    .from(".hero__bajada", { opacity: 0, y: 18, duration: 0.55 }, "-=0.25")
    .from(".hero__acciones .boton", { opacity: 0, y: 16, duration: 0.45, stagger: 0.12 }, "-=0.3")
    .from(".hero__scroll", { opacity: 0, duration: 0.6 }, "-=0.1");

  /* ---------- Secciones: reglas que se trazan y contenido que aparece ---------- */
  document.querySelectorAll(".registro").forEach(function (seccion) {
    var regla = seccion.querySelector(".registro__regla");
    if (regla) {
      gsap.from(regla, {
        scaleX: 0,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: { trigger: seccion, start: "top 75%" }
      });
    }

    gsap.from(seccion.querySelectorAll(".registro__cabecera > *:not(.registro__regla)"), {
      opacity: 0,
      y: 24,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out",
      scrollTrigger: { trigger: seccion, start: "top 75%" }
    });
  });

  // Bloques de contenido: aparecen al entrar en viewport
  gsap.utils.toArray(
    ".sobremi__retrato, .sobremi__texto, .skills__grupo, .ficha, .servicio, .contacto"
  ).forEach(function (bloque) {
    gsap.from(bloque, {
      opacity: 0,
      y: 32,
      duration: 0.7,
      ease: "power2.out",
      scrollTrigger: { trigger: bloque, start: "top 82%" }
    });
  });

  // Chips de skills: cascada corta
  gsap.utils.toArray(".skills__lista").forEach(function (lista) {
    gsap.from(lista.querySelectorAll(".chip"), {
      opacity: 0,
      y: 14,
      duration: 0.4,
      stagger: 0.05,
      ease: "power2.out",
      scrollTrigger: { trigger: lista, start: "top 85%" }
    });
  });

  /* ---------- Link activo en la nav ---------- */
  document.querySelectorAll(".nav__links a").forEach(function (enlace) {
    var seccion = document.querySelector(enlace.getAttribute("href"));
    if (!seccion) return;
    ScrollTrigger.create({
      trigger: seccion,
      start: "top 40%",
      end: "bottom 40%",
      onToggle: function (self) {
        enlace.classList.toggle("activo", self.isActive);
      }
    });
  });
})();
