class ProductCatalog {
    constructor() {
        this.products = JSON.parse(localStorage.getItem('products')) || [];
        this.currentCategory = 'all';
        this.slideshows = new Map();
        this.init();
    }

    init() {
        this.renderProducts();
        this.setupEventListeners();
        this.setupRealTimeUpdates();
    }

    setupEventListeners() {
        const categoryBtns = document.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterByCategory(e.target.dataset.category);
                this.updateActiveButton(e.target);
            });
        });
    }

    setupRealTimeUpdates() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'products') {
                this.products = JSON.parse(e.newValue) || [];
                this.renderProducts();
            }
        });

        setInterval(() => {
            const updatedProducts = JSON.parse(localStorage.getItem('products')) || [];
            if (JSON.stringify(updatedProducts) !== JSON.stringify(this.products)) {
                this.products = updatedProducts;
                this.renderProducts();
            }
        }, 1000);
    }

    filterByCategory(category) {
        this.currentCategory = category;
        this.renderProducts();
    }

    updateActiveButton(activeBtn) {
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    formatPrice(price) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    }

    createSlideshow(product) {
        if (!product.images || product.images.length === 0) {
            return `
                <div class="product-image">
                    <div class="no-images">Tidak ada gambar</div>
                </div>
            `;
        }

        if (product.images.length === 1) {
            return `
                <div class="product-image">
                    <img src="${product.images[0]}" alt="${product.name}" onerror="this.parentElement.innerHTML='<div class=\\'no-images\\'>Gambar tidak dapat dimuat</div>'">
                </div>
            `;
        }

        const slidesHtml = product.images.map((image, index) => `
            <div class="slide ${index === 0 ? 'active' : ''}">
                <img src="${image}" alt="${product.name} - Image ${index + 1}" onerror="this.style.display='none'">
            </div>
        `).join('');

        const indicatorsHtml = product.images.map((_, index) => `
            <span class="indicator ${index === 0 ? 'active' : ''}" data-slide="${index}"></span>
        `).join('');

        return `
            <div class="product-slideshow" data-product-id="${product.id}">
                <div class="slideshow-container">
                    ${slidesHtml}
                    <button class="slide-nav prev" data-direction="prev">‹</button>
                    <button class="slide-nav next" data-direction="next">›</button>
                </div>
                <div class="slide-indicators">
                    ${indicatorsHtml}
                </div>
            </div>
        `;
    }

    initializeSlideshows() {
        // Clear existing slideshows
        this.slideshows.clear();
        
        const slideshows = document.querySelectorAll('.product-slideshow');
        slideshows.forEach(slideshow => {
            const productId = slideshow.dataset.productId;
            const product = this.products.find(p => p.id === productId);
            
            if (product && product.images && product.images.length > 1) {
                this.setupSlideshowControls(slideshow, product.images.length, productId);
            }
        });
    }

    setupSlideshowControls(slideshowElement, imageCount, productId) {
        let currentSlide = 0;
        
        const slides = slideshowElement.querySelectorAll('.slide');
        const indicators = slideshowElement.querySelectorAll('.indicator');
        const prevBtn = slideshowElement.querySelector('.prev');
        const nextBtn = slideshowElement.querySelector('.next');

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

        // Remove existing event listeners
        const newPrevBtn = prevBtn.cloneNode(true);
        const newNextBtn = nextBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

        // Add new event listeners
        newPrevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            prevSlide();
        });

        newNextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            nextSlide();
        });

        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', (e) => {
                e.stopPropagation();
                showSlide(index);
            });
        });

        // Auto-play
        let autoPlayInterval = setInterval(nextSlide, 4000);

        slideshowElement.addEventListener('mouseenter', () => {
            clearInterval(autoPlayInterval);
        });

        slideshowElement.addEventListener('mouseleave', () => {
            autoPlayInterval = setInterval(nextSlide, 4000);
        });

        // Store slideshow data
        this.slideshows.set(productId, {
            currentSlide,
            showSlide,
            nextSlide,
            prevSlide,
            autoPlayInterval
        });
    }

    renderProducts() {
        const container = document.getElementById('products-container');
        let filteredProducts = this.products;

        if (this.currentCategory !== 'all') {
            filteredProducts = this.products.filter(product => 
                product.categories && product.categories.includes(this.currentCategory)
            );
        }

        if (filteredProducts.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                    <h2>Tidak ada produk tersedia</h2>
                    <p>Belum ada produk dalam kategori ini.</p>
                    <small style="color: #999; display: block; margin-top: 1rem;">
                        Tekan Ctrl+Shift+A untuk akses admin
                    </small>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredProducts.map(product => `
            <div class="product-card" onclick="viewProduct('${product.id}')">
                ${this.createSlideshow(product)}
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${this.formatPrice(product.price)}</div>
                    <div class="product-categories">
                        ${product.categories ? product.categories.map(cat => 
                            `<span class="category-tag">${this.getCategoryName(cat)}</span>`
                        ).join('') : ''}
                    </div>
                    <div class="product-description">${product.description ? product.description.substring(0, 100) : ''}${product.description && product.description.length > 100 ? '...' : ''}</div>
                </div>
            </div>
        `).join('');

        // Initialize slideshows after rendering
        setTimeout(() => {
            this.initializeSlideshows();
        }, 100);
    }

    getCategoryName(category) {
        const categoryNames = {
            'classic-slalom': 'Classic Slalom',
            'freestyle-slide': 'Freestyle Slide',
            'speed-slalom': 'Speed Slalom'
        };
        return categoryNames[category] || category;
    }
}

function viewProduct(productId) {
    window.location.href = `product.html?id=${productId}`;
}

// Initialize the catalog
document.addEventListener('DOMContentLoaded', () => {
    new ProductCatalog();
});
