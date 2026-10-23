"use strict";

// ===== Elements =====

const gallery = document.getElementById("gallery");
const loader = document.getElementById("loader");

const lightbox = document.getElementById("lightbox");
const viewerImage = document.getElementById("viewerImage");
const viewerCaption = document.getElementById("viewerCaption");

const closeBtn = document.getElementById("closeBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

// ===== Image Data =====

const images = Array.from({ length: 22 }, (_, index) => ({
    src: `I${index + 1}.jpg`,
    alt: `শারদস্মৃতি — ${index + 1} নম্বর ছবি`
}));

let currentIndex = 0;
let previousFocus = null;
let touchStartX = 0;
let touchStartY = 0;

// ===== Loading Screen =====

function hideLoader() {
    loader.classList.add("hide");
}

// Hide the loader even if an image takes too long.
window.addEventListener("load", hideLoader);

setTimeout(hideLoader, 1800);

// ===== Image Fallback =====

function handleImageError(img, card, index) {
    if (card.classList.contains("image-error")) return;

    card.classList.add("image-error");
    img.style.visibility = "hidden";

    const fallback = document.createElement("div");
    fallback.className = "image-fallback";

    const flower = document.createElement("span");
    flower.textContent = "❀";

    const message = document.createElement("span");
    message.textContent = `ছবি ${index + 1} পাওয়া যায়নি`;

    fallback.append(flower, message);
    card.appendChild(fallback);

    // A missing image should not open the viewer.
    card.setAttribute("aria-disabled", "true");
    card.removeAttribute("tabindex");
}

// ===== Build Gallery =====

images.forEach((image, index) => {
    const card = document.createElement("button");

    card.type = "button";
    card.className = "gallery-card";
    card.setAttribute("aria-label", `ছবি ${index + 1} বড় করে দেখো`);

    const img = document.createElement("img");

    img.src = image.src;
    img.alt = image.alt;
    img.loading = index < 4 ? "eager" : "lazy";
    img.decoding = "async";

    // Reserve space before lazy-loaded images appear.
    img.width = 600;
    img.height = 750;

    img.addEventListener("error", () => {
        handleImageError(img, card, index);
    });

    card.appendChild(img);

    card.addEventListener("click", () => {
        if (card.classList.contains("image-error")) return;

        openViewer(index);
    });

    gallery.appendChild(card);
});

// ===== Scroll Animations =====

const cards = document.querySelectorAll(".gallery-card");

if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
        (entries, currentObserver) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    currentObserver.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.08,
            rootMargin: "0px 0px 35px 0px"
        }
    );

    cards.forEach(card => observer.observe(card));
} else {
    cards.forEach(card => card.classList.add("visible"));
}

// ===== Open Image Viewer =====

function openViewer(index) {
    if (index < 0 || index >= images.length) return;

    currentIndex = index;
    previousFocus = document.activeElement;

    lightbox.classList.add("active");
    lightbox.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";

    showImage(currentIndex);

    closeBtn.focus();
}

// ===== Display Selected Image =====

function showImage(index) {
    currentIndex = (index + images.length) % images.length;

    const image = images[currentIndex];

    viewerImage.classList.add("changing");

    viewerImage.onload = null;
    viewerImage.onerror = null;

    viewerCaption.textContent = `${currentIndex + 1} / ${images.length}`;

    viewerImage.alt = image.alt;
    viewerImage.src = image.src;

    viewerImage.onload = () => {
        viewerImage.classList.remove("changing");
    };

    viewerImage.onerror = () => {
        viewerImage.classList.remove("changing");
        viewerImage.removeAttribute("src");
        viewerImage.alt = "ছবিটি লোড করা যায়নি";

        viewerCaption.textContent =
            `ছবি ${currentIndex + 1} পাওয়া যায়নি`;
    };
}

// ===== Previous / Next =====

function showPrevious() {
    showImage(currentIndex - 1);
}

function showNext() {
    showImage(currentIndex + 1);
}

prevBtn.addEventListener("click", showPrevious);
nextBtn.addEventListener("click", showNext);

// ===== Close Viewer =====

function closeViewer() {
    if (!lightbox.classList.contains("active")) return;

    lightbox.classList.remove("active");
    lightbox.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";

    viewerImage.onload = null;
    viewerImage.onerror = null;
    viewerImage.removeAttribute("src");

    if (previousFocus && typeof previousFocus.focus === "function") {
        previousFocus.focus();
    }
}

closeBtn.addEventListener("click", closeViewer);

// Close when clicking the dark background.
lightbox.addEventListener("click", event => {
    if (event.target === lightbox) {
        closeViewer();
    }
});

// ===== Keyboard Navigation =====

document.addEventListener("keydown", event => {
    if (!lightbox.classList.contains("active")) return;

    switch (event.key) {
        case "Escape":
            closeViewer();
            break;

        case "ArrowLeft":
            event.preventDefault();
            showPrevious();
            break;

        case "ArrowRight":
            event.preventDefault();
            showNext();
            break;

        case "Tab": {
            const focusable = [
                closeBtn,
                prevBtn,
                nextBtn
            ];

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (
                !event.shiftKey &&
                document.activeElement === last
            ) {
                event.preventDefault();
                first.focus();
            }

            break;
        }
    }
});

// ===== Mobile Swipe Navigation =====

lightbox.addEventListener("touchstart", event => {
    if (event.touches.length !== 1) return;

    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
}, { passive: true });

lightbox.addEventListener("touchend", event => {
    if (event.changedTouches.length !== 1) return;

    const endX = event.changedTouches[0].clientX;
    const endY = event.changedTouches[0].clientY;

    const deltaX = endX - touchStartX;
    const deltaY = endY - touchStartY;

    // Ignore vertical movement and short taps.
    if (
        Math.abs(deltaX) < 50 ||
        Math.abs(deltaX) < Math.abs(deltaY) * 1.2
    ) {
        return;
    }

    if (deltaX < 0) {
        showNext();
    } else {
        showPrevious();
    }
}, { passive: true });

// ===== Preload Neighbouring Images =====

function preloadImage(index) {
    const image = new Image();
    image.src = images[(index + images.length) % images.length].src;
}

nextBtn.addEventListener("click", () => {
    preloadImage(currentIndex + 1);
});

prevBtn.addEventListener("click", () => {
    preloadImage(currentIndex - 1);
});