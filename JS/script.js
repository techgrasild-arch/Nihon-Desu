// ============================================================
// Slideshow banner (fade carousel) — hanya jalan jika elemennya
// ada di halaman ini, supaya tidak error di halaman lain.
// ============================================================
(function () {
  var container = document.querySelector(".slideshow-container");
  if (!container) return;

  var slides = Array.prototype.slice.call(container.querySelectorAll("img"));
  if (slides.length === 0) return;

  var nextBtn = document.querySelector(".Bg-slide.next");
  var prevBtn = document.querySelector(".Bg-slide.prev");
  var current = 0;
  var autoplayTimer = null;

  // Buat titik indikator (dots) di bawah banner
  var dotsWrap = document.createElement("div");
  dotsWrap.className = "nd-slide-dots";
  slides.forEach(function (_, i) {
    var dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", "Slide " + (i + 1));
    dot.addEventListener("click", function () {
      goToSlide(i);
    });
    dotsWrap.appendChild(dot);
  });
  var slideshowWrap = document.querySelector(".slideshow");
  if (slideshowWrap) slideshowWrap.appendChild(dotsWrap);

  function render() {
    slides.forEach(function (img, i) {
      img.classList.toggle("nd-slide-active", i === current);
    });
    var dots = dotsWrap.querySelectorAll("button");
    dots.forEach(function (dot, i) {
      dot.classList.toggle("nd-dot-active", i === current);
    });
  }

  function goToSlide(index) {
    current = (index + slides.length) % slides.length;
    render();
  }

  function nextSlide() {
    goToSlide(current + 1);
  }

  function prevSlide() {
    goToSlide(current - 1);
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(nextSlide, 5000);
  }

  function stopAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      nextSlide();
      startAutoplay();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      prevSlide();
      startAutoplay();
    });
  }

  render();
  startAutoplay();
})();
