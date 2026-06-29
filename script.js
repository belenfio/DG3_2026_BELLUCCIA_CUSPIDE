/**
 * Fan Card Carousel
 * Desktop: abanico horizontal con hover
 * Mobile:  stack vertical centrado con swipe
 */
(function () {

    const container = document.getElementById('fanContainer');
    const cards     = Array.from(container.querySelectorAll('.card'));
    const dots      = Array.from(document.querySelectorAll('.dot'));
    const N         = cards.length;

    let centerIdx   = 2;
    let hovered     = -1;
    let isAnimating = false;

    /* ── Detectar mobile ── */
    function isMobile() { return window.innerWidth <= 768; }

    /* ══════════════════════════════
       CONFIG DESKTOP — abanico
    ══════════════════════════════ */
    const DESKTOP = {
        ANGLES:    [-22, -11, 0, 11, 22],
        OFFSETS_X: [-210, -105, 0, 105, 210],
        OFFSET_Y:  [38, 20, 0, 20, 38],
        HOVER_LIFT:  -38,
        ADJ_SPREAD:  28,
        HOVER_SCALE: 1.055,
    };

    const Z_INDEXES = [1, 2, 5, 2, 1];

    /* ══════════════════════════════
       CONFIG MOBILE — stack
    ══════════════════════════════ */
    // Posiciones relativas al slot central (slot 2)
    // slot 2 = centro (translateY 0, scale 1, z 5)
    // slot 1 = detrás izquierda visible
    // slot 3 = detrás derecha visible
    // slots 0,4 = ocultos atrás
    const MOBILE_SLOTS = [
        { tx: -50, ty: 30,  scale: 0.82, opacity: 0,    z: 1,  rot: -4 },  // 0: oculto izq
        { tx: -28, ty: 18,  scale: 0.88, opacity: 0.85, z: 2,  rot: -3 },  // 1: atrás izq
        { tx:   0, ty:  0,  scale: 1,    opacity: 1,    z: 5,  rot:  0 },  // 2: centro
        { tx:  28, ty: 18,  scale: 0.88, opacity: 0.85, z: 2,  rot:  3 },  // 3: atrás der
        { tx:  50, ty: 30,  scale: 0.82, opacity: 0,    z: 1,  rot:  4 },  // 4: oculto der
    ];

    const TRANS_FAST = 'transform 0.5s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.4s ease, box-shadow 0.35s ease';
    const TRANS_SLOW = 'transform 0.7s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.5s ease, box-shadow 0.5s ease';

    /* ── Orden de cards según centerIdx ── */
    function getOrder() {
        const order = [];
        for (let slot = 0; slot < N; slot++) {
            order.push((centerIdx + (slot - 2) + N) % N);
        }
        return order;
    }

    /* ── Render DESKTOP ── */
    function renderDesktop(hoverSlot = -1) {
        const order = getOrder();
        order.forEach((cardIdx, slot) => {
            const card  = cards[cardIdx];
            const isH   = slot === hoverSlot;
            const cfg   = DESKTOP;

            let tx    = cfg.OFFSETS_X[slot];
            let ty    = cfg.OFFSET_Y[slot];
            let rot   = cfg.ANGLES[slot];
            let scale = 1;
            let zIdx  = Z_INDEXES[slot];
            let adjDir = 0;

            if (isH) {
                ty    = cfg.OFFSET_Y[slot] + cfg.HOVER_LIFT;
                scale = cfg.HOVER_SCALE;
                zIdx  = 10;
            } else if (hoverSlot !== -1) {
                if (slot === hoverSlot - 1) adjDir = -1;
                if (slot === hoverSlot + 1) adjDir =  1;
                tx += adjDir * cfg.ADJ_SPREAD;
            }

            card.style.zIndex   = zIdx;
            card.style.opacity  = '1';
            card.style.transform = `translateX(${tx}px) translateY(${ty}px) rotate(${rot}deg) scale(${scale})`;
            card.classList.toggle('is-center', slot === 2);
        });
    }

    /* ── Render MOBILE ── */
    function renderMobile() {
        const order = getOrder();
        order.forEach((cardIdx, slot) => {
            const card = cards[cardIdx];
            const s    = MOBILE_SLOTS[slot];

            card.style.zIndex   = s.z;
            card.style.opacity  = s.opacity;
            card.style.transform = `translateX(calc(-50% + ${s.tx}px)) translateY(${s.ty}px) rotate(${s.rot}deg) scale(${s.scale})`;
            card.classList.toggle('is-center', slot === 2);
        });
    }

    /* ── Render general ── */
    function render(hoverSlot = -1) {
        if (isMobile()) renderMobile();
        else renderDesktop(hoverSlot);
    }

    /* ── Init ── */
    render();

    /* ════════════════════════════════
       DESKTOP: hover
    ════════════════════════════════ */
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            if (isAnimating || isMobile()) return;
            const order = getOrder();
            const slot  = order.indexOf(parseInt(card.dataset.idx));
            hovered = slot;
            cards.forEach(c => { c.style.transition = TRANS_FAST; });
            renderDesktop(slot);
        });

        card.addEventListener('mouseleave', () => {
            if (isMobile()) return;
            hovered = -1;
            cards.forEach(c => { c.style.transition = TRANS_FAST; });
            renderDesktop(-1);
        });
    });

    /* ════════════════════════════════
       ROTAR el abanico / stack
    ════════════════════════════════ */
    function rotateTo(targetCardIdx) {
        if (isAnimating || targetCardIdx === centerIdx) return;
        isAnimating = true;
        hovered = -1;

        let diff = targetCardIdx - centerIdx;
        if (diff > N / 2)  diff -= N;
        if (diff < -N / 2) diff += N;

        const steps = Math.abs(diff);
        const dir   = diff > 0 ? 1 : -1;
        let step    = 0;

        function nextStep() {
            centerIdx = (centerIdx + dir + N) % N;
            updateDots();
            cards.forEach(c => { c.style.transition = TRANS_SLOW; });
            render(-1);
            step++;
            if (step < steps) setTimeout(nextStep, 440);
            else setTimeout(() => { isAnimating = false; }, 520);
        }
        nextStep();
    }

    /* ── Click en card ── */
    cards.forEach(card => {
        card.addEventListener('click', e => {
            if (e.target.classList.contains('card-btn')) return;
            const idx = parseInt(card.dataset.idx);
            const order = getOrder();
            const slot  = order.indexOf(idx);
            /* En mobile solo si no es la central */
            if (isMobile() && slot !== 2) {
                rotateTo(idx);
            } else if (!isMobile()) {
                rotateTo(idx);
            }
        });
    });

    /* ── Botón Join ── */
    cards.forEach(card => {
        card.querySelector('.card-btn').addEventListener('click', e => {
            e.stopPropagation();
            alert(`Membresía: ${card.querySelector('.card-name').textContent}`);
        });
    });

    /* ── Dots ── */
    function updateDots() {
        dots.forEach((dot, i) => dot.classList.toggle('active', i === centerIdx));
    }
    dots.forEach(dot => {
        dot.addEventListener('click', () => rotateTo(parseInt(dot.dataset.target)));
    });

    /* ── Scroll desktop ── */
    let scrollAccum = 0;
    container.addEventListener('wheel', e => {
        if (isMobile()) return;
        e.preventDefault();
        scrollAccum += e.deltaY;
        if (Math.abs(scrollAccum) > 80) {
            rotateTo((centerIdx + (scrollAccum > 0 ? 1 : -1) + N) % N);
            scrollAccum = 0;
        }
    }, { passive: false });

    /* ════════════════════════════════
       SWIPE táctil (mobile)
    ════════════════════════════════ */
    let touchStartX = 0;
    let touchStartY = 0;
    let isSwiping   = false;

    container.addEventListener('touchstart', e => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isSwiping   = false;
    }, { passive: true });

    container.addEventListener('touchmove', e => {
        const dx = Math.abs(e.touches[0].clientX - touchStartX);
        const dy = Math.abs(e.touches[0].clientY - touchStartY);
        if (dx > dy && dx > 10) {
            isSwiping = true;
            e.preventDefault();
        }
    }, { passive: false });

    container.addEventListener('touchend', e => {
        if (!isSwiping) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 45) {
            rotateTo((centerIdx + (dx < 0 ? 1 : -1) + N) % N);
        }
    }, { passive: true });

    /* ── Resize ── */
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            cards.forEach(c => { c.style.transition = 'none'; });
            render(-1);
        }, 120);
    });

})();
