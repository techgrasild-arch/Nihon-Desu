
// SLide background
let currentIndex1 = 0;
const slides = document.querySelectorAll('.slideshow-container img');
const totalSlides = slides.length;
const firstSlideClone = slides[0].cloneNode(true);
document.querySelector('.slideshow-container').appendChild(firstSlideClone);

const newTotalSlides = slides.length + 1; 

document.querySelector('.next').addEventListener('click', () => {
  currentIndex1++;
  if (currentIndex1 >= newTotalSlides) {
    currentIndex1 = 1; 
    document.querySelector('.slideshow-container').style.transition = 'none'; // Disable transition for instant jump
    updateSlidePosition();
    setTimeout(() => {
      document.querySelector('.slideshow-container').style.transition = 'transform 0.5s ease-in-out'; // Re-enable transition
    }, 20); 
  }
  updateSlidePosition();
});

document.querySelector('.prev').addEventListener('click', () => {
  currentIndex1--;
  if (currentIndex1 < 0) {
    currentIndex1 = newTotalSlides - 2; 
    document.querySelector('.slideshow-container').style.transition = 'none'; // Disable transition for instant jump
    updateSlidePosition();
    setTimeout(() => {
      document.querySelector('.slideshow-container').style.transition = 'transform 0.5s ease-in-out'; // Re-enable transition
    }, 20); 
  }
  updateSlidePosition();
});

function updateSlidePosition() {
  const slideWidth = slides[0].clientWidth;
  const newTransformValue = -currentIndex1 * slideWidth;
  document.querySelector('.slideshow-container').style.transform = `translateX(${newTransformValue}px)`;
}

setInterval(() => {
  document.querySelector('.next').click();
}, 5000);
// Slide end

    let currentIndex = 0;
    const items = document.querySelectorAll('.slider-items .item');
    const totalItems = items.length;

    function updateSlider() {
        const slider = document.querySelector('.slider-items');
        const offset = -currentIndex * (100 / totalItems); // Adjust based on item width
        slider.style.transform = `translateX(${offset}%)`;
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % totalItems;
        updateSlider();
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + totalItems) % totalItems;
        updateSlider();
    }

    document.querySelector('.category-next').addEventListener('click', nextSlide);
    document.querySelector('.category-prev').addEventListener('click', prevSlide);

    // Automatic sliding every 3 seconds
    setInterval(nextSlide, 3000);

 
