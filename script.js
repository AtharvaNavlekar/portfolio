// 1. SELECTORS & SETUP
const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");
const loader = document.querySelector("#loader");
const progressBar = document.querySelector("#progress-bar");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- PERFORMANCE FIX: DEBOUNCE RESIZE ---
// Prevents the code from running 1000 times while dragging window
let resizeTimeout;
window.addEventListener("resize", function () {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
  }, 100); // 100ms delay
});

// 2. FILE NAMING
function files(index) {
  // Looks for 1.webp, 2.webp... in Images folder
  // Note: Converted to .webp for performance
  return `./Images/${index + 1}.webp`;
}

// 3. IMAGE PRELOADING
// ⚠️ Ensure this matches your EXACT image count
const frameCount = 40;

const images = [];
const imageSeq = { frame: 0 };
let loadedImages = 0;

for (let i = 0; i < frameCount; i++) {
  const img = new Image();
  img.src = files(i);
  img.onload = () => {
    loadedImages++;
    if (progressBar) {
      const percentage = (loadedImages / frameCount) * 100;
      progressBar.style.width = `${percentage}%`;
    }
    if (loadedImages === frameCount) {
      startWebsite();
    }
  };
  img.onerror = () => {
    // Keep going even if one fails
    console.warn(`Failed to load image index: ${i}`);
    loadedImages++;
    if (loadedImages === frameCount) startWebsite();
  };
  images.push(img);
}

// 4. STARTUP
function startWebsite() {
  if (loader) loader.classList.add("loader-hidden");
  initScroll();
  render();
}

function render() {
  scaleImage(images[imageSeq.frame], context);
}

// 5. IMAGE SCALING & POSITIONING
function scaleImage(img, ctx) {
  var canvas = ctx.canvas;
  if (!img) return;

  // Calculate scale to COVER the screen
  var hRatio = canvas.width / img.width;
  var vRatio = canvas.height / img.height;
  var ratio = Math.max(hRatio, vRatio);

  var centerShift_x = (canvas.width - img.width * ratio) / 2;

  // --- VERTICAL POSITION FIX ---
  // Push image down by 50px to avoid cutting the head
  var topOffset = 50;
  var centerShift_y = (canvas.height - img.height * ratio) / 2;

  // If the image is taller than screen (negative shift), force it to start at top + offset
  if (centerShift_y < 0) {
    centerShift_y = 0 + topOffset;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (img) {
    ctx.drawImage(
      img,
      0,
      0,
      img.width,
      img.height,
      centerShift_x,
      centerShift_y,
      img.width * ratio,
      img.height * ratio
    );
  }
}

// --- PERFORMANCE: RAF THROTTLE ---
let ticking = false;
function requestTick() {
  if (!ticking) {
    requestAnimationFrame(() => {
      render();
      ticking = false;
    });
    ticking = true;
  }
}

// 6. SCROLL ANIMATIONS (GSAP + LOCOMOTIVE)
function initScroll() {
  gsap.registerPlugin(ScrollTrigger);

  const scrollElement = document.querySelector("#main");
  if (!scrollElement) return;

  const locoScroll = new LocomotiveScroll({
    el: scrollElement,
    smooth: true,
    lerp: 0.12, // Higher = faster response, smoother feel
    multiplier: 1.2, // Scroll distance multiplier
    smartphone: { smooth: true },
    tablet: { smooth: true },
  });
  locoScroll.on("scroll", ScrollTrigger.update);

  ScrollTrigger.scrollerProxy("#main", {
    scrollTop(value) {
      return arguments.length
        ? locoScroll.scrollTo(value, 0, 0)
        : locoScroll.scroll.instance.scroll.y;
    },
    getBoundingClientRect() {
      return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
    },
    pinType: document.querySelector("#main").style.transform ? "transform" : "fixed",
  });

  // --- GO UP BUTTON LOGIC ---
  const goUpBtn = document.querySelector("#go-up-btn");
  if (goUpBtn) {
    goUpBtn.addEventListener("click", () => {
      locoScroll.scrollTo(0);
    });

    locoScroll.on("scroll", (args) => {
      // Go Up Button Visibility
      if (args.scroll.y > 100) {
        goUpBtn.classList.add("show");
      } else {
        goUpBtn.classList.remove("show");
      }

      // Nav Scroll Effect
      const nav = document.querySelector("#nav");
      if (nav) {
        if (args.scroll.y > 50) {
          nav.classList.add("scrolled");
        } else {
          nav.classList.remove("scrolled");
        }
      }
    });
  }

  // --- CONTACT BUTTON SCROLL LOGIC ---
  const contactBtn = document.querySelector(".nav-btn");
  if (contactBtn) {
    contactBtn.addEventListener("click", (e) => {
      e.preventDefault();
      locoScroll.scrollTo("#footer");
    });
  }

  // --- CTA BUTTON SCROLL LOGIC ---
  const ctaBtn = document.querySelector(".cta-btn");
  if (ctaBtn) {
    ctaBtn.addEventListener("click", (e) => {
      e.preventDefault();
      locoScroll.scrollTo("#footer");
    });
  }

  // --- LOGO SCROLL TO TOP LOGIC ---
  const logoLink = document.querySelector(".logo-link");
  if (logoLink) {
    logoLink.addEventListener("click", (e) => {
      e.preventDefault();
      locoScroll.scrollTo("#page"); // Hero section
    });
  }

  // --- CANVAS SEQUENCE ANIMATION ---
  gsap.to(imageSeq, {
    frame: frameCount - 1,
    snap: "frame",
    ease: "none",
    scrollTrigger: {
      scrub: 0.5, // Reduced from 1 for faster response
      trigger: `#page>canvas`,
      start: `top top`,
      end: `600% top`,
      scroller: `#main`,
    },
    onUpdate: requestTick, // Performance: RAF Throttle
  });

  ScrollTrigger.create({
    trigger: "#page>canvas",
    pin: true,
    scroller: `#main`,
    start: `top top`,
    end: `600% top`,
  });

  // --- TEXT ENTRY ANIMATIONS ---
  const pages = ["#page-about", "#page1", "#page2", "#page-experience", "#page-education", "#page-projects", "#page3"];

  pages.forEach((page) => {
    // Pinning the page
    gsap.to(page, {
      scrollTrigger: {
        trigger: page,
        start: `top top`,
        end: `bottom top`,
        pin: true,
        scroller: `#main`,
      },
    });

    // Animating text elements within the page
    gsap.from(document.querySelectorAll(`${page} h1, ${page} h3, ${page} p, ${page} .project-link`), {
      y: 50,
      opacity: 0,
      duration: 1,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: page,
        scroller: "#main",
        start: "top 60%",
        toggleActions: "restart none none reverse", // Replays on scroll back
      }
    });
  });

  // --- MAGNETIC CURSOR EFFECT ---
  const magneticElements = document.querySelectorAll('.nav-btn, .project-link, .exp-card, .edu-card');
  magneticElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      el.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`; // Gentle magnetism
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translate(0, 0)';
    });
  });

  ScrollTrigger.addEventListener("refresh", () => locoScroll.update());
  ScrollTrigger.refresh();
}