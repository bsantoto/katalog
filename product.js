class ProductDetail {
    constructor() {
        this.products = JSON.parse(localStorage.getItem('products')) || [];
        this.productId = this.getProductIdFromURL();
        this.init();
    }

    init() {
        this.renderProduct();
        this.setupRealTimeUpdates();
    }

    getProductIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    setupRealTimeUpdates() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'products') {
                this.products = JSON.parse(e.newValue) || [];
                this.renderProduct();
            }
        });

        setInterval(() => {
            const updatedProducts = JSON.parse(localStorage.getItem('products')) || [];
            if (JSON.stringify(updatedProducts) !== JSON.stringify(this.products)) {
                this.products = updatedProducts;
                this.renderProduct();
            }
        }, 1000);
    }

    formatPrice(price) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    }

    getCategoryName(category) {
        const categoryNames = {
            'classic-slalom': 'Classic Slalom',
            'freestyle-slide': 'Freestyle Slide',
            'speed-slalom': 'Speed Slalom'
        };
        return categoryNames[category] || category;
    }

    createDetailSlideshow(product) {
        if (!product.images || product.images.length === 0) {
            return `
                <div class="product-detail-image">
                    <div class="no-images">Tidak ada gambar</div>
                </div>
            `;
        }

        if (product.images.length === 1) {
            return `
                <div class="product-detail-image">
                    <img src="${product.images[0]}" alt="${product.name}" onerror="this.parentElement.innerHTML='<div class=\\'no-images\\'>Gambar tidak dapat dimuat</div>'">
                </div>
            `;
        }

        const slidesHtml = product.images.map((image, index) => `
            <div class="detail-slide ${index === 0 ? 'active' : ''}">
                <img src="${image}" alt="${product.name} - Image ${index + 1}" onerror="this.style.display='none'">
            </div>
        `).join('');

        const indicatorsHtml = product.images.map((_, index) => `
            <span class="detail-indicator ${index === 0 ? 'active' : ''}" data-slide="${index}"></span>
        `).join('');

        return `
            <div class="product-detail-slideshow" data-product-id="${product.id}">
                <div class="detail-slideshow-container">
                    ${slidesHtml}
                    <button class="detail-slide-nav detail-prev" data-direction="prev">‹</button>
                    <button class="detail-slide-nav detail-next" data-direction="next">›</button>
                </div>
                <div class="detail-slide-indicators">
                    ${indicatorsHtml}
                </div>
            </div>
        `;
    }

    setupDetailSlideshow(product) {
        if (!product.images || product.images.length <= 1) return;

        const slideshow = document.querySelector('.product-detail-slideshow');
        if (!slideshow) return;

        let currentSlide = 0;
        const imageCount = product.images.length;
        
        const slides = slideshow.querySelectorAll('.detail-slide');
        const indicators = slideshow.querySelectorAll('.detail-indicator');
        const prevBtn = slideshow.querySelector('.detail-prev');
        const nextBtn = slideshow.querySelector('.detail-next');

        if (!slides.length || !prevBtn || !nextBtn) return;

        const showSlide = (index) => {
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });
            indicators.forEach((indicator, i) => {
                indicator.classList.toggle('active', i === index);
            });
            currentSlide = index;
        };

        const nextSlide = () => {
            const next = (currentSlide + 1) % imageCount;
            showSlide(next);
        };

        const prevSlide = () => {
            const prev = (currentSlide - 1 + imageCount) % imageCount;
            showSlide(prev);
        };

        // Event listeners
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            prevSlide();
        });
        
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            nextSlide();
        });

        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', (e) => {
                e.preventDefault();
                showSlide(index);
            });
        });

        // Keyboard navigation
        const keyHandler = (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevSlide();
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                nextSlide();
            }
        };

        document.addEventListener('keydown', keyHandler);

        // Auto-play
        let autoPlayInterval = setInterval(nextSlide, 5000);

        slideshow.addEventListener('mouseenter', () => {
            clearInterval(autoPlayInterval);
        });

        slideshow.addEventListener('mouseleave', () => {
            autoPlayInterval = setInterval(nextSlide, 5000);
        });

        // Cleanup function
        this.cleanup = () => {
            document.removeEventListener('keydown', keyHandler);
            clearInterval(autoPlayInterval);
        };
    }

    renderProduct() {
        const container = document.getElementById('product-container');
        const product = this.products.find(p => p.id === this.productId);

        if (!product) {
            container.innerHTML = `
                <div class="product-detail-card">
                    <div class="product-detail-info">
                        <h2>Produk tidak ditemukan</h2>
                        <p>Produk yang Anda cari tidak tersedia.</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="product-detail-card">
                ${this.createDetailSlideshow(product)}
                <div class="product-detail-info">
                    <h1 class="product-detail-name">${product.name}</h1>
                    <div class="product-detail-price">${this.formatPrice(product.price)}</div>
                    <div class="product-categories">
                        ${product.categories ? product.categories.map(cat => 
                            `<span class="category-tag">${this.getCategoryName(cat)}</span>`
                        ).join('') : ''}
                    </div>
                    <div class="product-detail-description">${product.description || ''}</div>
                </div>
            </div>
        `;

        // Cleanup previous slideshow
        if (this.cleanup) {
            this.cleanup();
        }

        // Setup slideshow after rendering
        setTimeout(() => {
            this.setupDetailSlideshow(product);
        }, 100);
    }
}

function goBack() {
    window.history.back();
}

document.addEventListener('DOMContentLoaded', () => {
    new ProductDetail();
});
