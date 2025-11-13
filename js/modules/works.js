    window.ProjectApp = window.ProjectApp || {};

    (function () {
    const hasGSAP = () => typeof window !== 'undefined' && !!window.gsap;
    const reduceMotion = () =>
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches;

    function collectEls(slide) {
    return {
    projectTop: slide.querySelector('.project-top'),
    projectBottom: slide.querySelector('.project-bottom'),
    videoWrappers: Array.from(slide.querySelectorAll('.video-wrapper, .video-spacer')),
    previewWrapper: slide.querySelector('.preview-wrapper'),
    previewTop: Array.from(slide.querySelectorAll('.preview-block.is--top')),
    previewBottom: Array.from(slide.querySelectorAll('.preview-block.is--bottom')),
    nameRightLines: Array.from(slide.querySelectorAll('.name-wrapper.has--align-right .name-xlarge .line')),
    nameLeftLines: Array.from(slide.querySelectorAll('.name-wrapper.has--align-left .name-xlarge .line')),
};
}

    function setHiddenStates(slide) {
    if (!hasGSAP() || !slide) return;
    const {
    projectTop,
    projectBottom,
    videoWrappers,
    previewWrapper,
    previewTop,
    previewBottom,
    nameRightLines,
    nameLeftLines,
} = collectEls(slide);

    if (projectTop) gsap.set(projectTop, { y: '100%' });
    if (projectBottom) gsap.set(projectBottom, { y: '100%' });

    if (videoWrappers.length)
    gsap.set(videoWrappers, { clipPath: 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)' });

    if (previewWrapper) gsap.set(previewWrapper, { opacity: 0 });

    if (previewBottom.length)
    gsap.set(previewBottom, { clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0% 100%)' });
    if (previewTop.length)
    gsap.set(previewTop, { clipPath: 'polygon(0 0%, 100% 0%, 100% 0%, 0 0%)' });

    if (nameRightLines.length) gsap.set(nameRightLines, { y: '110%' });
    if (nameLeftLines.length) gsap.set(nameLeftLines, { y: '-110%' });
}

    function clearProjectBlockInline(slide) {
    if (!slide) return;
    const blocks = slide.querySelectorAll('.video-wrapper');
    blocks.forEach((el) => {
    el.style.clipPath = '';
    el.style.webkitClipPath = '';
    el.style.transition = '';
});
    if (hasGSAP()) {
    blocks.forEach((el) => gsap.set(el, { clearProps: 'clipPath,webkitClipPath,transition' }));
}
}

    ProjectApp.slideAnimations = {
    animateSlideIn(slideElement, options = {}) {
    if (!slideElement || !hasGSAP()) return Promise.resolve();

    const defaults = {
    duration: 1,
    ease: (gsap.parseEase && gsap.parseEase('power2.out')) || 'power2.out',
    headingEase: (gsap.parseEase && gsap.parseEase('power2.out')) || 'power2.out',
    stagger: 0.08,
    onComplete: null,
};
    const s = { ...defaults, ...options };

    if (reduceMotion()) {
    const {
    projectTop,
    projectBottom,
    videoWrappers,
    previewWrapper,
    previewTop,
    previewBottom,
    nameRightLines,
    nameLeftLines,
} = collectEls(slideElement);

    if (projectTop) gsap.set(projectTop, { y: '0%' });
    if (projectBottom) gsap.set(projectBottom, { y: '0%' });
    if (videoWrappers.length) gsap.set(videoWrappers, { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' });
    if (previewWrapper) gsap.set(previewWrapper, { opacity: 1 });
    if (previewTop.length) gsap.set(previewTop, { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' });
    if (previewBottom.length) gsap.set(previewBottom, { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' });
    if (nameRightLines.length) gsap.set(nameRightLines, { y: '0%' });
    if (nameLeftLines.length) gsap.set(nameLeftLines, { y: '0%' });

    clearProjectBlockInline(slideElement);
    s.onComplete && s.onComplete();
    return Promise.resolve();
}

    setHiddenStates(slideElement);

    return new Promise((resolve) => {
    const tl = gsap.timeline({
    onComplete: () => {
    clearProjectBlockInline(slideElement);
    s.onComplete && s.onComplete();
    resolve();
},
});

    const {
    projectTop,
    projectBottom,
    videoWrappers,
    previewWrapper,
    previewTop,
    previewBottom,
    nameRightLines,
    nameLeftLines,
} = collectEls(slideElement);

    if (projectTop)
    tl.fromTo(projectTop, { y: '100%' }, { y: '0%', duration: s.duration * 0.8, ease: s.ease, force3D: true }, 0);

    if (projectBottom)
    tl.fromTo(projectBottom, { y: '100%' }, { y: '0%', duration: s.duration * 0.8, ease: s.ease, force3D: true }, 0);

    if (videoWrappers.length)
    tl.fromTo(
    videoWrappers,
{ clipPath: 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)' },
{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: s.duration * 0.8, ease: s.ease },
    0
    );

    if (nameRightLines.length)
    tl.fromTo(
    nameRightLines,
{ y: '110%' },
{ y: '0%', duration: s.duration, ease: s.headingEase, stagger: s.stagger, clearProps: 'transform' },
    0
    );

    if (nameLeftLines.length)
    tl.fromTo(
    nameLeftLines,
{ y: '-110%' },
{ y: '0%', duration: s.duration, ease: s.headingEase, stagger: s.stagger, clearProps: 'transform' },
    0
    );

    if (previewWrapper)
    tl.fromTo(previewWrapper, { opacity: 0 }, { opacity: 1, duration: s.duration * 0.8, ease: s.ease }, 0);

    if (previewBottom.length)
    tl.fromTo(
    previewBottom,
{ clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0% 100%)' },
{ clipPath: 'polygon(0 0%, 100% 0%, 100% 100%, 0% 100%)', duration: s.duration, ease: s.ease },
    0
    );

    if (previewTop.length)
    tl.fromTo(
    previewTop,
{ clipPath: 'polygon(0 0%, 100% 0%, 100% 0%, 0 0%)' },
{ clipPath: 'polygon(0 0%, 100% 0%, 100% 100%, 0% 100%)', duration: s.duration, ease: s.ease },
    0
    );

    if (!tl.getChildren().length) {
    clearProjectBlockInline(slideElement);
    resolve();
}
});
},

    setSlideHidden(slideElement) {
    setHiddenStates(slideElement);
},

    animatePreloaderSlideIn(swiperEl) {
    const container = swiperEl || document.querySelector('.swiper.is--visible, .swiper.is-visible');
    if (!container) return Promise.resolve();

    return new Promise((resolve) => {
    let tries = 0;
    const maxTries = 20;
    const tick = () => {
    const active = container.querySelector('.swiper-slide-active, .is--active-logical');
    if (active) {
    this.setSlideHidden(active);
    this.animateSlideIn(active, {
    duration: 1,
    headingEase: (gsap.parseEase && gsap.parseEase('power2.out')) || 'power2.out',
    ease: (gsap.parseEase && gsap.parseEase('power2.out')) || 'power2.out',
    stagger: 0.08,
}).then(resolve);
} else if (tries++ < maxTries) {
    requestAnimationFrame(tick);
} else {
    resolve();
}
};
    requestAnimationFrame(tick);
});
},

    hideNonActiveInContainer(container) {
    if (!container) return;
    const active = container.querySelector('.swiper-slide-active, .is--active-logical');
    container.querySelectorAll('.swiper-slide').forEach((s) => {
    if (s !== active) setHiddenStates(s);
});
},

    animateActiveInContainer(container, options) {
    if (!container) return Promise.resolve();
    const active = container.querySelector('.swiper-slide-active, .is--active-logical');
    if (!active) return Promise.resolve();
    setHiddenStates(active);
    return this.animateSlideIn(active, options);
},

    deactivateContainer(container) {
    if (!container || !hasGSAP()) return;
    const nodes = container.querySelectorAll(
    '.swiper-slide, .project-top, .project-bottom, .video-wrapper, .preview-wrapper, .video-spacer, .preview-block, .name-wrapper .line'
    );
    container.querySelectorAll('.swiper-slide').forEach(setHiddenStates);
},

    bindSlideChangeForSwiper(swiper) {
    if (!swiper || swiper._paBound) return;
    swiper._paBound = true;

    swiper.on('init', () => {
    const root = swiper.el;
    this.hideNonActiveInContainer(root);
    this.animateActiveInContainer(root, { duration: 0.75 });
});

    swiper.on('slideChangeTransitionStart', () => {
    const prev = swiper.slides?.[swiper.previousIndex];
    const next = swiper.slides?.[swiper.activeIndex];
    if (prev && prev !== next) setHiddenStates(prev);
    if (next) {
    if (hasGSAP()) {
    const nodes = next.querySelectorAll(
    '.project-top, .project-bottom, .video-wrapper, .preview-wrapper, .video-spacer, .preview-block, .name-wrapper .line'
    );
}
    setHiddenStates(next);
    this.animateSlideIn(next, { duration: 0.75 });
}
});
},
};

    ProjectApp.slidePresets = {
    setSlideElementsHidden(slideElement) {
    ProjectApp.slideAnimations.setSlideHidden(slideElement);
},
    setPrevSlidesHidden(slideElement) {
    if (!slideElement || !hasGSAP()) return;
    gsap.set(slideElement, {visibility: 'hidden'});
},
    setLogicalPrevHidden(slideElement) {
    this.setPrevSlidesHidden(slideElement);
},
    resetSlideElements(slideElement) {
    ProjectApp.slideAnimations.animateSlideIn(slideElement, {duration: 0});
},
    resetPrevSlidesVisibility(slideElement) {
    if (!slideElement || !hasGSAP()) return;
    gsap.set(slideElement, {visibility: 'visible'});
},

    activateSwiperContainer(containerEl) {
    ProjectApp.slideAnimations.hideNonActiveInContainer(containerEl);
    return ProjectApp.slideAnimations.animateActiveInContainer(containerEl, {duration: 0.8});
},

    deactivateSwiperContainer(containerEl) {
    ProjectApp.slideAnimations.deactivateContainer(containerEl);
},
};
})();


        window.ProjectApp = window.ProjectApp || {};
        ProjectApp.state = ProjectApp.state || {};
        ProjectApp.animations = ProjectApp.animations || {};
        ProjectApp.utils = ProjectApp.utils || {};

        (function(){
        const hasGSAP = ()=> typeof window.gsap !== 'undefined';
        const EZ = 'headingHoverEase';
        const D  = .8;
        const qAll = (slide, sel)=> slide ? slide.querySelectorAll(sel) : [];
        const q    = (slide, sel)=> slide ? slide.querySelector(sel) : null;

        ProjectApp.slideAnimations = ProjectApp.slideAnimations || {
        setSlideHidden(slide){
        if (!slide) return;
        qAll(slide, '.name-wrapper.has--align-right .name-xlarge .line').forEach(l=> l.style.transform = 'translateY(110%)');
        qAll(slide, '.name-wrapper.has--align-left  .name-xlarge .line').forEach(l=> l.style.transform = 'translateY(-110%)');
        qAll(slide, '.project-block, .background-video-block').forEach(el=> el.style.clipPath = 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)');
        qAll(slide, '.preview-block.is--top .preview-video').forEach(el=> el.style.clipPath = 'polygon(0 0%, 100% 0%, 100% 0%, 0 0%)');
        qAll(slide, '.preview-block.is--bottom .preview-video').forEach(el=> el.style.clipPath = 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)');

    },
        collapseBG(slide, d=D, ez=EZ){
        if (!hasGSAP() || !slide) return gsap.timeline();
        const tl = gsap.timeline();
        const bgBlocks = qAll(slide, '.background-video-block');
        if (bgBlocks.length) tl.to(bgBlocks, { clipPath:'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)', duration:d, ease:ez }, 0);
        return tl;
    },
        revealBG(slide, d=D, ez=EZ){
        if (!hasGSAP() || !slide) return gsap.timeline();
        const tl = gsap.timeline();
        const bgBlocks = qAll(slide, '.background-video-block');
        if (bgBlocks.length) tl.to(bgBlocks, { clipPath:'polygon(0 0, 100% 0, 100% 100%, 0 100%)', duration:d, ease:ez }, 0);
        return tl;
    },
        animateSlideIn(slide, opts={}){
        if (!hasGSAP() || !slide) return Promise.resolve();
        const d = opts.duration || D;
        const ez = opts.ease || EZ;
        const stagger = opts.stagger || 0.08;
        const projectDelay = (typeof opts.projectDelay === 'number') ? opts.projectDelay : .18;
        const onComplete = typeof opts.onComplete === 'function' ? opts.onComplete : null;
        return new Promise(resolve=>{
        const tl = gsap.timeline({ defaults:{ ease: ez }, onComplete: ()=>{ onComplete && onComplete(); resolve(); } });
        const bgBlocks = qAll(slide, '.background-video-block');
        if (bgBlocks.length) tl.to(bgBlocks, { clipPath:'polygon(0 0, 100% 0, 100% 100%, 0 100%)', duration:d }, 0);
        qAll(slide, '.name-wrapper.has--align-right .name-xlarge .line').forEach((line,i)=> tl.to(line, { y:'0%', duration:d, ease:ez, delay:i*stagger }, 0));
        qAll(slide, '.name-wrapper.has--align-left  .name-xlarge .line').forEach((line,i)=> tl.to(line, { y:'0%', duration:d, ease:ez, delay:i*stagger }, 0));
        const projectTop    = q(slide, '.project-top');
        const projectBottom = q(slide, '.project-bottom');
        if (projectTop)    tl.to(projectTop,    { y:'0%', duration:d }, projectDelay);
        if (projectBottom) tl.to(projectBottom, { y:'0%', duration:d }, projectDelay);
        qAll(slide, '.project-block').forEach((b,i)=> tl.to(b, { clipPath:'polygon(0 0, 100% 0, 100% 100%, 0 100%)', duration:d, }, 0));
        qAll(slide, '.preview-block.is--top .preview-video').forEach(el=> tl.to(el, { clipPath:'polygon(0 0, 100% 0, 100% 100%, 0 100%)', duration:d }, 0));
        qAll(slide, '.preview-block.is--bottom .preview-video').forEach(el=> tl.to(el, { clipPath:'polygon(0 0, 100% 0, 100% 100%, 0 100%)', duration:d }, 0));
    });
    }
    };

        ProjectApp.slidePresets = ProjectApp.slidePresets || {

    };

        ProjectApp.animations.addHoverAnimationToSwiperSlides =
        ProjectApp.animations.addHoverAnimationToSwiperSlides || function(){};
    })();








        ProjectApp.swiperModule = {
        swipers: {},
        _two(n){ n = Number(n)||0; return n<10 ? ('0'+n) : String(n); },
        _hasGSAP(){ return typeof window.gsap !== 'undefined'; },
        _hasSwiper(){ return typeof window.Swiper !== 'undefined'; },
        _normalizeCategory(cat){
        const v = String(cat || 'all').trim().toLowerCase();
        if (v === 'tv & film' || v === 'tv film' || v === 'tvfilm' || v === 'tv_and_film') return 'tv-film';
        if (v === 'editorials') return 'editorial';
        if (v === 'ads' || v === 'ad') return 'commercial';
        if (!v) return 'all';
        return v;
    },
        _swiperSelectorByCategory(catNorm){ return `.swiper.is--${catNorm}`; },
        _getSwiperEl(catNorm){ return document.querySelector(this._swiperSelectorByCategory(catNorm)); },
        _getOriginalSlides(swiper){
        if (!swiper || !swiper.slides) return [];
        return Array.from(swiper.slides).filter(s => !s.classList.contains('swiper-slide-duplicate'));
    },
        _getDataIndex(el){
        if (!el) return null;
        const v = el.getAttribute('data-swiper-slide-index');
        if (v == null) return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    },
        _getUniqueDataIndices(swiper){
        const originals = this._getOriginalSlides(swiper);
        const seen = new Set();
        const list = [];
        originals.forEach(slide=>{
        const idx = this._getDataIndex(slide);
        if (idx != null && !seen.has(idx)) { seen.add(idx); list.push(idx); }
    });
        return list;
    },
        _forEachByDataIndex(swiper, dataIdx, fn){
        if (!swiper || !swiper.slides) return;
        const want = String(dataIdx);
        Array.from(swiper.slides).forEach(slide=>{
        if (slide.getAttribute('data-swiper-slide-index') === want) fn(slide);
    });
    },
        _mirrorSourceIndexToDuplicates(swiper){
        if (!swiper || !swiper.slides) return;
        Array.from(swiper.slides).forEach(slide=>{
        if (slide.classList.contains('swiper-slide-duplicate')) {
        const dataIdx = slide.getAttribute('data-swiper-slide-index');
        const srcIdx  = slide.getAttribute('data-source-index');
        const finalIdx = dataIdx != null ? dataIdx : srcIdx;
        if (finalIdx != null) {
        slide.setAttribute('data-swiper-slide-index', finalIdx);
        slide.setAttribute('data-source-index', finalIdx);
    }
    }
    });
    },
        _assignSourceIndices(wrapper){
        const originals = Array.from(wrapper.querySelectorAll('.swiper-slide')).filter(s => !s.classList.contains('swiper-slide-duplicate'));
        originals.forEach((slide, i)=>{
        slide.setAttribute('data-swiper-slide-index', String(i));
        slide.setAttribute('data-source-index', String(i));
    });
    },
        _assignPermanentNumbers(swiper){
        if (!swiper || !swiper.slides) return;
        const originals = this._getOriginalSlides(swiper);
        originals.forEach((slide, i)=>{
        const target = slide.querySelector('[data-slide-index]');
        if (target && !target.dataset.permanentNumber) {
        const displayNumber = this._two(i+1);
        target.textContent = displayNumber;
        target.dataset.permanentNumber = displayNumber;
    }
    });
        Array.from(swiper.slides).forEach(slide=>{
        if (slide.classList.contains('swiper-slide-duplicate')) {
        const dataIdx = slide.getAttribute('data-swiper-slide-index');
        if (dataIdx != null) {
        const original = originals.find(s => s.getAttribute('data-swiper-slide-index') === dataIdx);
        if (original) {
        const o  = original.querySelector('[data-slide-index]');
        const d  = slide.querySelector('[data-slide-index]');
        if (o && d) {
        d.textContent = o.textContent;
        d.dataset.permanentNumber = o.dataset.permanentNumber;
    }
    }
    }
    }
    });
    },
        _setupPreviewClickHandlers(swiper){
        if (!swiper || !swiper.slides) return;
        Array.from(swiper.slides).forEach(slide=>{
        const prevPreview = slide.querySelector('.preview-video.is--prev');
        if (prevPreview && !prevPreview.dataset.clickHandlerAdded){
        prevPreview.dataset.clickHandlerAdded = 'true';
        prevPreview.style.cursor = 'pointer';
        prevPreview.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); swiper.slidePrev && swiper.slidePrev(); });
    }
        const nextPreview = slide.querySelector('.preview-video.is--next');
        if (nextPreview && !nextPreview.dataset.clickHandlerAdded){
        nextPreview.dataset.clickHandlerAdded = 'true';
        nextPreview.style.cursor = 'pointer';
        nextPreview.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); swiper.slideNext && swiper.slideNext(); });
    }
    });
    },
        _getActiveDataIndex(swiper){
        const activeEl = (swiper && swiper.slides) ? swiper.slides[swiper.activeIndex] : null;
        let idx = this._getDataIndex(activeEl);
        if (idx == null && swiper){
        const set = this._getUniqueDataIndices(swiper);
        if (set.length){
        const ri = Number(swiper.realIndex) || 0;
        idx = set[((ri % set.length) + set.length) % set.length];
    } else {
        idx = 0;
    }
    }
        return idx == null ? 0 : idx;
    },
        getLogicalNeighbors(swiper){
        const set = this._getUniqueDataIndices(swiper);
        const N = set.length;
        if (!N) return { prev:0, next:0, active:0, N:0, indices:set };
        const activeIdxVal = this._getActiveDataIndex(swiper);
        const pos = set.indexOf(activeIdxVal);
        const i = (pos === -1) ? 0 : pos;
        const prev = set[(i - 1 + N) % N];
        const next = set[(i + 1) % N];
        return { prev, next, active: activeIdxVal, N, indices:set };
    },
        applyLogicalPrevNextClasses(swiper){
        if (!swiper || !swiper.wrapperEl) return;
        Array.from(swiper.slides).forEach(el => el.classList.remove('is--prev-logical','is--next-logical','is--active-logical'));
        this._mirrorSourceIndexToDuplicates(swiper);
        const { prev, active, next, N } = this.getLogicalNeighbors(swiper);
        if (!N) return;
        this._forEachByDataIndex(swiper, prev,   el=> el.classList.add('is--prev-logical'));
        this._forEachByDataIndex(swiper, active, el=> el.classList.add('is--active-logical'));
        this._forEachByDataIndex(swiper, next,   el=> el.classList.add('is--next-logical'));
    },
        animateSlideTextLines(swiper){
        if (!swiper || !swiper.slides || !this._hasGSAP()) return;
        Array.from(swiper.slides).forEach(slide=>{
        const isPrev   = slide.classList.contains('is--prev-logical');
        const isNext   = slide.classList.contains('is--next-logical');
        const isActive = slide.classList.contains('is--active-logical');
        if (isPrev){
        const rightLines = slide.querySelectorAll('.name-wrapper.has--align-right .name-xlarge .line');
        const leftLines  = slide.querySelectorAll('.name-wrapper.has--align-left  .name-xlarge .line');
        rightLines.forEach((line,i)=> gsap.to(line, { y:'-110%', duration:.8, ease:'headingHoverEase', delay:i*.08 }));
        leftLines .forEach((line,i)=> gsap.to(line, { y:'110%',  duration:.8, ease:'headingHoverEase', delay:i*.08 }));
    }
        if (isNext){
        const rightLines = slide.querySelectorAll('.name-wrapper.has--align-right .name-xlarge .line');
        const leftLines  = slide.querySelectorAll('.name-wrapper.has--align-left  .name-xlarge .line');
        rightLines.forEach((line,i)=> gsap.to(line, { y:'110%',  duration:.8, ease:'headingHoverEase', delay:i*.08 }));
        leftLines .forEach((line,i)=> gsap.to(line, { y:'-110%', duration:.8, ease:'headingHoverEase', delay:i*.08 }));
    }
        if (isActive){
        const rightLines = slide.querySelectorAll('.name-wrapper.has--align-right .name-xlarge .line');
        const leftLines  = slide.querySelectorAll('.name-wrapper.has--align-left  .name-xlarge .line');
        [...rightLines, ...leftLines].forEach((line,i)=> gsap.to(line, { y:'0%', duration:.8, ease:'headingHoverEase', delay:i*.08 }));
    }
    });
    },

        _clearClipInlineStyles(swiperEl){
        if (!swiperEl) return;
        const nodes = swiperEl.querySelectorAll(
        '.background-video-block, .background-block, .project-block, .preview-block .preview-video'
        );
        nodes.forEach(el=>{
        el.style.clipPath = '';
        el.style.webkitClipPath = '';
        el.style.transition = '';
    });
        if (this._hasGSAP()){
        nodes.forEach(el=> gsap.set(el, { clearProps: 'clipPath,webkitClipPath,transition' }));
    }
    },

        _armSlide(slide){ if (slide) slide.classList.add('__armed'); },
        _armAllSlides(swiper){
        if (!swiper || !swiper.slides) return;
        Array.from(swiper.slides).forEach(s=> this._armSlide(s));
    },
        _armCurrentNext(swiper){
        if (!swiper || !swiper.slides) return;
        const { prev, next, active } = this.getLogicalNeighbors(swiper);
        const armByIdx = (idx)=> this._forEachByDataIndex(swiper, idx, el=> this._armSlide(el));
        armByIdx(prev); armByIdx(active); armByIdx(next);
    },
        _ensureArmed(slide){ if (slide) slide.classList.add('__armed'); },
        _animateSlideOutOnce(slide, tl, opts){
        if (!slide || !window.gsap) return;
        const d  = (opts && opts.duration) || 0.8;
        const ez = (opts && opts.ease)     || 'headingHoverEase';
        this._ensureArmed(slide);
        const rightLines = slide.querySelectorAll('.name-wrapper.has--align-right .name-xlarge .line');
        const leftLines  = slide.querySelectorAll('.name-wrapper.has--align-left .name-xlarge .line');
        rightLines.forEach((line,i)=> tl.to(line, { y:'-110%',  duration:d, ease:ez, delay:i*.08 }, 0));
        leftLines .forEach((line,i)=> tl.to(line, { y:'110%', duration:d, ease:ez, delay:i*.08 }, 0));
        const projectBlocks = slide.querySelectorAll('.project-block');
        const bgVideoBlocks = slide.querySelectorAll('.background-video-block');
        projectBlocks.forEach((b,i)=> tl.to(b, { clipPath:'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)', duration:d, ease:ez, delay:1.5 }, 0));
        if (bgVideoBlocks.length) tl.to(bgVideoBlocks, { clipPath:'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)', duration:d, delay:1.5, ease:ez }, 0);
        const previewBlockBottom = slide.querySelectorAll('.preview-block.is--bottom .preview-video');
        const previewBlockTop    = slide.querySelectorAll('.preview-block.is--top .preview-video');
        previewBlockBottom.forEach(b=> tl.to(b, { clipPath:'polygon(0 100%, 100% 100%, 100% 100%, 0% 100%)', duration:d, ease:ez }, 0));
        previewBlockTop   .forEach(b=> tl.to(b, { clipPath:'polygon(0 0%,   100% 0%,   100% 0%,   0 0%)',   duration:d, ease:ez }, 0));
    },
        animateSwiperOut(swiperEl){
        return new Promise((resolve)=>{
        if (!this._hasGSAP() || !swiperEl){ resolve(); return; }
        const activeSlide = swiperEl.querySelector('.swiper-slide-active, .is--active-logical');
        const prevSlide   = swiperEl.querySelector('.is--prev-logical');
        if (!activeSlide && !prevSlide){ resolve(); return; }
        const elementsToAnimate = swiperEl.querySelectorAll('.background-video-block, .background-block, .project-block');
        elementsToAnimate.forEach(el => gsap.set(el, { transition:'none' }));
        const tl = gsap.timeline({ onComplete:()=>{ elementsToAnimate.forEach(el => gsap.set(el, { clearProps:'transition' })); resolve(); } });
        if (activeSlide) this._animateSlideOutOnce(activeSlide, tl, { duration:.8, ease:'headingHoverEase' });
        if (prevSlide)   this._animateSlideOutOnce(prevSlide,   tl, { duration:.8, ease:'headingHoverEase' });
        if (!tl.getChildren().length){
        elementsToAnimate.forEach(el => gsap.set(el, { clearProps:'transition' }));
        resolve();
    }
    });
    },
        async animateActiveSlideIn(swiperEl){
        if (!swiperEl) return Promise.resolve();
        this._clearClipInlineStyles(swiperEl);

        const activeSlide = swiperEl.querySelector('.swiper-slide-active, .is--active-logical');
        const prevSlides  = swiperEl.querySelectorAll('.is--prev-logical');
        if (!activeSlide) return Promise.resolve();
        prevSlides.forEach(slide=>{ ProjectApp.slidePresets?.setPrevSlidesHidden?.(slide); });
        ProjectApp.slideAnimations?.setSlideHidden?.(activeSlide);
        return ProjectApp.slideAnimations?.animateSlideIn
        ? ProjectApp.slideAnimations.animateSlideIn(activeSlide, {
        duration: .8, ease: 'headingHoverEase', stagger: .08, projectDelay: .18,
        onComplete: ()=>{ prevSlides.forEach(slide=>{ ProjectApp.slidePresets?.resetPrevSlidesVisibility?.(slide); }); }
    })
        : Promise.resolve();
    },
        updatePreviews(swiper){
        if (!swiper || !swiper.slides || !swiper.slides.length) return;
        this.applyLogicalPrevNextClasses(swiper);
        const activeEl = swiper.slides[swiper.activeIndex];
        if (!activeEl) return;
        const { prev:prevIdx, next:nextIdx } = this.getLogicalNeighbors(swiper);
        const originals = this._getOriginalSlides(swiper);
        const findByIdx = (idx)=>{
        let el = originals.find(sl => sl.getAttribute('data-swiper-slide-index') === String(idx));
        if (!el) el = Array.from(swiper.slides).find(sl => sl.getAttribute('data-swiper-slide-index') === String(idx));
        return el || null;
    };
        const prevSlide = findByIdx(prevIdx);
        const nextSlide = findByIdx(nextIdx);
        const prevPreview = activeEl.querySelector('.preview-video.is--prev');
        const nextPreview = activeEl.querySelector('.preview-video.is--next');
        const prevImg = prevSlide ? prevSlide.querySelector('.project-video') : null;
        const nextImg = nextSlide ? nextSlide.querySelector('.project-video') : null;
        if (prevImg && prevPreview) prevPreview.src = prevImg.src || prevImg.getAttribute('src') || '';
        if (nextImg && nextPreview) nextPreview.src = nextImg.src || nextImg.getAttribute('src') || '';
    },

        _attachGuards(swiper, cat){
        if (!swiper || !swiper.on) return;
        let rafPending = false;
        const refresh = ()=>{
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(()=>{
        rafPending = false;
        if (!swiper || !swiper.slides) return;
        try{ swiper.updateSlides(); swiper.updateProgress(); swiper.updateSlidesClasses(); }catch(e){}
        this._mirrorSourceIndexToDuplicates(swiper);
        this.applyLogicalPrevNextClasses(swiper);
        this._armCurrentNext(swiper);
        this.animateSlideTextLines(swiper);
        this.updatePreviews(swiper);
        this._setupPreviewClickHandlers(swiper);
    });
    };
        swiper.on('init', refresh);
        swiper.on('slideChange', refresh);
        swiper.on('slideChangeTransitionStart', refresh);
        setTimeout(refresh, 0);
        setTimeout(refresh, 60);
    },
        _updateCountsInSwiper(){
        if (ProjectApp.filterModule && ProjectApp.filterModule.updateAllCountDisplays) {
        ProjectApp.filterModule.updateAllCountDisplays();
    }
    },
        initSwiper(category){
        if (!this._hasSwiper()){ console.warn('Swiper library not found'); return null; }
        const cat = this._normalizeCategory(category);
        const swiperEl = this._getSwiperEl(cat);
        if (!swiperEl){ console.warn(`Swiper not found for category: ${cat}`); return null; }
        if (this.swipers[cat]) return this.swipers[cat];
        const wrapper = swiperEl.querySelector('.swiper-wrapper');
        if (!wrapper) return null;
        this._assignSourceIndices(wrapper);
        const slides = Array.from(wrapper.querySelectorAll('.swiper-slide'));
        const enableLoop = slides.length > 1;
        const module = this;
        const swiperInstance = new Swiper(this._swiperSelectorByCategory(cat), {
        loop: enableLoop,
        loopPreventsSliding: true,
        loopAdditionalSlides: 0,
        speed: 0,
        slidesPerView: 1,
        centeredSlides: false,
        allowTouchMove: true,
        simulateTouch: false,
        touchRatio: 0,
        watchSlidesProgress: true,
        normalizeSlideIndex: true,
        effect: 'fade',
        fadeEffect: { crossFade: true },
        mousewheel: { enabled: true, sensitivity: 1, releaseOnEdges: false, thresholdDelta: 6, thresholdTime: 1000, eventsTarget: 'container' },
        initialSlide: 0,
        on: {
        init: function(){
        const s = this;
        requestAnimationFrame(()=>{
        if (s.params && s.params.loop) s.slideToLoop(0, 0, false);
        else                          s.slideTo(0, 0, false);
        try{ s.updateSlides(); s.updateProgress(); s.updateSlidesClasses(); }catch(e){}
        module._mirrorSourceIndexToDuplicates(s);
        module.applyLogicalPrevNextClasses(s);
        module._armAllSlides(s);
        module._armCurrentNext(s);
        module.updatePreviews(s);
        module._assignPermanentNumbers(s);
        module._setupPreviewClickHandlers(s);
        if (ProjectApp.animations && ProjectApp.animations.addHoverAnimationToSwiperSlides) {
        ProjectApp.animations.addHoverAnimationToSwiperSlides(s);
    }

        module._updateCountsInSwiper();
        module.animateSlideTextLines(s);
    });
        module._attachGuards(s, cat);
    }
    }
    });
        this.swipers[cat] = swiperInstance;
        return swiperInstance;
    },
        async switchToCategory(category){
        const normalizedCategory = this._normalizeCategory(category);
        const categoryToIndex = { 'all':0, 'tv-film':1, 'commercial':2, 'editorial':3 };
        const targetIndex = categoryToIndex[normalizedCategory];
        if (targetIndex === undefined) return;
        const swipersContainer = document.querySelector('.swipers-container');
        if (!swipersContainer) return;
        const allSwipers = Array.from(swipersContainer.querySelectorAll('.swiper'));
        const currentVisibleSwiper = allSwipers.find(s => s.classList.contains('is--visible'));
        const targetSwiper = allSwipers[targetIndex];
        if (!targetSwiper) return;

        if (currentVisibleSwiper === targetSwiper){
        ProjectApp.state.currentCategory = normalizedCategory;
        this._updateCountsInSwiper();
        return;
    }

        const isActualSwitch = !!currentVisibleSwiper && ProjectApp.state.currentView === 'swiper';

        if (isActualSwitch){
        const outPromise = this.animateSwiperOut(currentVisibleSwiper);
        allSwipers.forEach(s => s.classList.remove('is--visible'));
        targetSwiper.classList.add('is--visible');
        if (!this.swipers[normalizedCategory]){
        this.initSwiper(normalizedCategory);
    } else {
        const swiper = this.swipers[normalizedCategory];
        try{ swiper.updateSlides(); swiper.updateProgress(); swiper.updateSlidesClasses(); }catch(e){}
        this._mirrorSourceIndexToDuplicates(swiper);
        this.applyLogicalPrevNextClasses(swiper);
        this._armCurrentNext(swiper);
        this.updatePreviews(swiper);
        this._setupPreviewClickHandlers(swiper);
    }
        this._clearClipInlineStyles(targetSwiper);
        const inPromise = this.animateActiveSlideIn(targetSwiper);
        await Promise.all([outPromise, inPromise]);
        setTimeout(()=>{ if (this._hasGSAP()){ gsap.set(targetSwiper, { clearProps:'position,top,left,width,height,zIndex,x,y' }); } }, 100);
    } else {
        allSwipers.forEach(s => s.classList.remove('is--visible'));
        targetSwiper.classList.add('is--visible');

        if (!this.swipers[normalizedCategory]){
        this.initSwiper(normalizedCategory);
    } else {
        const swiper = this.swipers[normalizedCategory];
        try{ swiper.updateSlides(); swiper.updateProgress(); swiper.updateSlidesClasses(); }catch(e){}
        this._mirrorSourceIndexToDuplicates(swiper);
        this.applyLogicalPrevNextClasses(swiper);
        this._armCurrentNext(swiper);
        this.updatePreviews(swiper);
        this._setupPreviewClickHandlers(swiper);
    }
        this._clearClipInlineStyles(targetSwiper);

        await this.animateActiveSlideIn(targetSwiper);
    }

        ProjectApp.state.currentCategory = normalizedCategory;
        this._updateCountsInSwiper();
    },
        initAll(){
        const allSwiper = document.querySelector('.swiper.is--all');
        if (allSwiper){
        allSwiper.classList.add('is--visible');
        if (!this.swipers['all']) this.initSwiper('all');
        ProjectApp.state.currentCategory = 'all';
        this._updateCountsInSwiper();
    }
    }
    };



    ProjectApp.listModule = {
    animateOutCurrentItems: function(animateDividers = false) {
    return new Promise((resolve) => {
    const projectList = document.querySelector('.project-list');
    if (!projectList) { resolve(); return; }
    const visibleItems = Array.from(projectList.querySelectorAll('.project-item'));
    if (!visibleItems.length || !window.gsap) { resolve(); return; }

    const d = 0.6;
    const ez = 'mainEase';
    const tl = gsap.timeline({
    onComplete: resolve,
    defaults: {duration: d, ease: ez}
});

    visibleItems.forEach((item, index) => {
    const delay = index * 0.01;
    if (animateDividers) {
    const dividers = item.querySelectorAll('.list-divider');
    if (dividers.length) tl.to(dividers, {scaleX: 0}, delay);
}
    const clips = item.querySelectorAll('.hover-trigger, .list-video-wrapper');
    const texts = item.querySelectorAll('.name-medium .line-wrapper .line, .text-abs, .text-mono:not(.description-block .text-mono)');
    if (clips.length) tl.to(clips, {clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)'}, delay);
    if (texts.length) tl.to(texts, {y: '110%'}, delay);
});

    if (!tl.getChildren().length) resolve();
});
},

    initInfiniteScroll: function (animateDividers = true) {
    if (ProjectApp.state.scrollInitialized) return;
    const projectList = document.querySelector('.project-list');
    if (!projectList) return;

    const templates = ProjectApp.templateManager.getFilteredListTemplates();
    ProjectApp.listModule.hardResetListContainer(projectList);
    const total = templates.length;

    if (total === 0) {
    setTimeout(() => {
    const empty = document.createElement('div');
    empty.className = 'project-empty';
    empty.style.padding = '2rem';
    empty.textContent = 'No results found';
    empty.style.opacity = '0';
    projectList.appendChild(empty);
    if (window.gsap) {
    gsap.to(empty, {opacity: 1, duration: 0.3});
} else {
    empty.style.opacity = '1';
}
}, 100);
    ProjectApp.state.scrollInitialized = true;
    return;
}

    let itemHeight = ProjectApp.state.cachedItemHeight || ProjectApp.utils.measureItemHeight(templates, projectList);
    if (itemHeight <= 10) {
    return requestAnimationFrame(() => {
    itemHeight = ProjectApp.utils.measureItemHeight(templates, projectList);
    if (itemHeight > 10) ProjectApp.listModule.buildVirtual(itemHeight, templates, projectList, animateDividers);
});
}

    ProjectApp.listModule.buildVirtual(itemHeight, templates, projectList, animateDividers);
},

    cleanupInfiniteScroll: function () {
    const projectList = document.querySelector('.project-list');
    if (projectList && ProjectApp.state.scrollListener) {
    projectList.removeEventListener('scroll', ProjectApp.state.scrollListener);
}
    ProjectApp.state.scrollInitialized = false;
    ProjectApp.state.scrollListener = null;
    ProjectApp.state.cachedItemHeight = null;
},

    rebuildListForCurrentFilter: async function () {
    const projectList = document.querySelector('.project-list');
    if (!projectList) return;

    const savedScrollTop = projectList.scrollTop;

    await ProjectApp.listModule.animateOutCurrentItems(false);
    await new Promise(resolve => setTimeout(resolve, 100));

    ProjectApp.listModule.cleanupInfiniteScroll();
    ProjectApp.state.cachedItemHeight = null;
    ProjectApp.state.scrollInitialized = false;

    ProjectApp.state.restoreScrollTop = savedScrollTop;

    ProjectApp.listModule.initInfiniteScroll(false);

    if (ProjectApp.filterModule && ProjectApp.filterModule.updateCurrentTotalCount) {
    ProjectApp.filterModule.updateCurrentTotalCount();
}
},

    buildVirtual: function (itemHeight, templates, projectList, animateDividers = true) {
    const sentinelTop = document.createElement('div');
    sentinelTop.className = 'virtual-sentinel';
    sentinelTop.style.height = (templates.length * itemHeight * 100) + 'px';
    sentinelTop.style.position = 'absolute';
    sentinelTop.style.top = '0';
    sentinelTop.style.left = '0';
    sentinelTop.style.right = '0';
    sentinelTop.style.pointerEvents = 'none';
    projectList.appendChild(sentinelTop);

    const bufferSize = 10;
    let offset = 0;
    const itemPool = new Map();
    const animatedItems = new Set();

    function getItem(index) {
    const N = templates.length;
    const sourceIndex = ((index % N) + N) % N;
    if (itemPool.has(index)) return itemPool.get(index);

    const clone = templates[sourceIndex].cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.width = '100%';
    clone.style.left = '0';
    clone.dataset.index = String(index);

    const idxEl = clone.querySelector('[data-index]');
    if (idxEl) {
    const displayIndex = sourceIndex + 1;
    idxEl.textContent = displayIndex < 10 ? `0${displayIndex}` : String(displayIndex);
}

    if (window.gsap) {
    if (animateDividers) {
    const dividers = clone.querySelectorAll('.list-divider');
    if (dividers.length) gsap.set(dividers, {scaleX: 0});
}
    const clips = clone.querySelectorAll('.hover-trigger, .list-video-wrapper');
    const texts = clone.querySelectorAll('.name-medium .line-wrapper .line, .text-abs, .text-mono:not(.description-block .text-mono)');
    if (clips.length) gsap.set(clips, {clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)'});
    if (texts.length) gsap.set(texts, {y: '110%'});
}

    if (ProjectApp.animations && ProjectApp.animations.addHoverAnimationToListItem) {
    ProjectApp.animations.addHoverAnimationToListItem(clone);
}

    itemPool.set(index, clone);
    return clone;
}

    function animateItem(item, delay = 0) {
    const itemIndex = item.dataset.index;
    if (animatedItems.has(itemIndex)) return;
    animatedItems.add(itemIndex);
    if (!window.gsap) return;

    const d = 0.6;
    const ez = 'mainEase';

    if (animateDividers) {
    const dividers = item.querySelectorAll('.list-divider');
    if (dividers.length) gsap.to(dividers, {scaleX: 1, duration: d, ease: ez, delay});
}

    const clips = item.querySelectorAll('.hover-trigger, .list-video-wrapper');
    const texts = item.querySelectorAll('.name-medium .line-wrapper .line, .text-abs, .text-mono:not(.description-block .text-mono)');
    if (clips.length) gsap.to(clips, {
    clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
    duration: d,
    ease: ez,
    delay
});
    if (texts.length) gsap.to(texts, {y: '0%', duration: d, ease: ez, delay});
}

    function updateVisible() {
    const containerH = projectList.clientHeight || window.innerHeight;
    const scrollTop = projectList.scrollTop;
    const adjusted = scrollTop + (offset * itemHeight);
    const startIndex = Math.floor(adjusted / itemHeight) - bufferSize;
    const endIndex = Math.ceil((adjusted + containerH) / itemHeight) + bufferSize;
    const active = new Set();

    for (let i = startIndex; i <= endIndex; i++) {
    active.add(i);
    const node = getItem(i);
    const wasNew = !node.parentElement;
    if (wasNew) projectList.appendChild(node);
    node.style.top = ((i - offset) * itemHeight) + 'px';
    if (wasNew) requestAnimationFrame(() => animateItem(node));
}

    Array.from(projectList.children).forEach(child => {
    const idx = parseInt(child.dataset && child.dataset.index, 10);
    if (!isNaN(idx) && !active.has(idx)) {
    child.remove();
    animatedItems.delete(String(idx));
}
});

    if (scrollTop < itemHeight * 3) {
    offset -= templates.length;
    projectList.scrollTop = scrollTop + (templates.length * itemHeight);
    updateVisible();
} else if (scrollTop > projectList.scrollHeight - containerH - (itemHeight * 3)) {
    offset += templates.length;
    projectList.scrollTop = scrollTop - (templates.length * itemHeight);
    updateVisible();
}
}

    if (ProjectApp.state.restoreScrollTop !== undefined) {
    projectList.scrollTop = ProjectApp.state.restoreScrollTop;
    delete ProjectApp.state.restoreScrollTop;
} else {
    projectList.scrollTop = 0;
}

    ProjectApp.state.scrollListener = updateVisible;
    projectList.addEventListener('scroll', ProjectApp.state.scrollListener);
    updateVisible();
    ProjectApp.state.scrollInitialized = true;

    requestAnimationFrame(() => {
    requestAnimationFrame(() => {
    const items = Array.from(projectList.querySelectorAll('.project-item')).filter(el => el.offsetParent !== null);
    if (!items.length || !window.gsap) return;
    items.forEach(item => {
    animatedItems.delete(item.dataset.index);
});
    items.forEach((item, index) => {
    animateItem(item, index * 0.01); });
});
});
},

    hardResetListContainer: function(projectList) {
    projectList.innerHTML = '';
    projectList.style.height = 'calc(100vh - 10.6vw)';
    projectList.style.overflowY = 'scroll';
    projectList.style.position = 'relative';
},

    ensureListInit: function() {
    if(ProjectApp.state.scrollInitialized) return;
    const projectList = document.querySelector('.project-list');
    if(!projectList) return;
    ProjectApp.state.currentView = 'list';
    ProjectApp.listModule.initInfiniteScroll(true);
},

    updateListItemIndices: function() {
    const projectList = document.querySelector('.project-list');
    if(!projectList) return;
    const visibleItems = Array.from(projectList.querySelectorAll('.project-item'));
    visibleItems.forEach((item, index) => {
    const indexElements = item.querySelectorAll('[data-index]');
    indexElements.forEach(el => {
    const displayIndex = index + 1;
    el.textContent = displayIndex < 10 ? `0${displayIndex}` : String(displayIndex);
});
});
}
};

    if(window.ProjectApp && ProjectApp.bootstrap) ProjectApp.bootstrap();



        window.ProjectApp = window.ProjectApp || {};
        ProjectApp.state = ProjectApp.state || {};
        ProjectApp.animations = ProjectApp.animations || {};
        ProjectApp.utils = ProjectApp.utils || {};

        const HIDE_DELAY_MS = 100;

        if (ProjectApp.state.currentView == null) ProjectApp.state.currentView = 'list';
        if (ProjectApp.state.currentCategory == null) ProjectApp.state.currentCategory = 'all';
        if (!ProjectApp.state.switchAnim) ProjectApp.state.switchAnim = {listeners: []};

        ProjectApp.utils.norm = ProjectApp.utils.norm || function (s) {
        return String(s || '').toLowerCase().trim();
    };
        ProjectApp.utils.withTemporarilyShown = ProjectApp.utils.withTemporarilyShown || function (el, fn) {
        if (!el) return fn && fn();
        const wasNone = getComputedStyle(el).display === 'none' || el.classList.contains('is--hidden');
        const prev = { display: el.style.display, visibility: el.style.visibility, pointerEvents: el.style.pointerEvents };
        if (wasNone) {
        el.classList.remove('is--hidden');
        el.style.display = 'block';
        el.style.visibility = 'hidden';
        el.style.pointerEvents = 'none';
    }
        try { return fn && fn(); } finally {
        if (wasNone) {
        el.style.display = prev.display || '';
        el.style.visibility = prev.visibility || '';
        el.style.pointerEvents = prev.pointerEvents || '';
        el.classList.add('is--hidden');
    }
    }
    };
        ProjectApp.utils.measureItemHeight = ProjectApp.utils.measureItemHeight || function(templates, listEl){
        const tmp = document.createElement('div');
        tmp.style.position = 'absolute';
        tmp.style.left = '-99999px';
        tmp.style.top = '0';
        tmp.style.width = (listEl && listEl.clientWidth ? listEl.clientWidth : 1000) + 'px';
        document.body.appendChild(tmp);
        const first = templates && templates[0] ? templates[0].cloneNode(true) : null;
        if (!first){ document.body.removeChild(tmp); return 120; }
        tmp.appendChild(first);
        const h = Math.max(1, first.offsetHeight || 0);
        document.body.removeChild(tmp);
        return h;
    };



        ProjectApp.templateManager = (function (prev) {
        const tm = prev || {};
        tm.captureListTemplatesOnce = tm.captureListTemplatesOnce || function () {
        if (ProjectApp.state.listTemplates && ProjectApp.state.listTemplates.length) return;
        const projectList = document.querySelector('.project-list');
        if (!projectList) return;
        if (!ProjectApp.state.listTemplates) ProjectApp.state.listTemplates = [];
        ProjectApp.utils.withTemporarilyShown(projectList, () => {
        const originals = Array.from(projectList.querySelectorAll('.project-item'));
        ProjectApp.state.listTemplates = originals.map(n => n.cloneNode(true));
    });
    };
        tm.getItemCategory = tm.getItemCategory || function (el) {
        const raw = el.getAttribute('filter') ?? el.getAttribute('data-filter') ?? '';
        return ProjectApp.utils.norm(raw || 'all');
    };
        tm.matchesCurrentCategory = function (el, category) {
        const current = ProjectApp.utils.norm(category != null ? category : (ProjectApp.state.currentCategory || 'all'));
        if (current === 'all') return true;
        return ProjectApp.templateManager.getItemCategory(el) === current;
    };
        tm.getFilteredListTemplates = function (category) {
        this.captureListTemplatesOnce();
        const list = ProjectApp.state.listTemplates || [];
        return list.filter(el => this.matchesCurrentCategory(el, category));
    };
        tm.getAllListTemplates = tm.getAllListTemplates || function () {
        this.captureListTemplatesOnce();
        return (ProjectApp.state.listTemplates || []).slice();
    };
        return tm;
    })(ProjectApp.templateManager);

        ProjectApp.uiLock = (() => {
        let depth = 0;
        function setDisabled(disabled) {
        const nodes = document.querySelectorAll('.filter-item, .option-item, .mode-block');
        nodes.forEach((el) => {
        el.classList.toggle('is--disabled', disabled);
        el.style.pointerEvents = disabled ? 'none' : '';
        el.setAttribute('aria-disabled', disabled ? 'true' : 'false');
        if (disabled) {
        el.dataset._tabindex = el.getAttribute('tabindex') ?? '';
        el.setAttribute('tabindex', '-1');
    } else {
        const prev = el.dataset._tabindex;
        if (prev !== undefined) {
        if (prev === '') el.removeAttribute('tabindex');
        else el.setAttribute('tabindex', prev);
        delete el.dataset._tabindex;
    }
    }
    });
    }
        return {
        lock()   { if (++depth === 1) setDisabled(true); },
        unlock() { depth = Math.max(0, depth - 1); if (depth === 0) setDisabled(false); },
        isLocked(){ return depth > 0; }
    };
    })();

        ProjectApp.filterCooldown = (() => {
        let until = 0, timer = null;
        function applyDisabled(disabled) {
        const btns = document.querySelectorAll('.filter-item');
        btns.forEach(b => {
        b.classList.toggle('is--disabled', disabled);
        b.setAttribute('aria-disabled', disabled ? 'true' : 'false');
        b.style.pointerEvents = disabled ? 'none' : '';
        if (disabled) {
        b.dataset._tabindex = b.getAttribute('tabindex') ?? '';
        b.setAttribute('tabindex', '-1');
    } else {
        const prev = b.dataset._tabindex;
        if (prev !== undefined) {
        if (prev === '') b.removeAttribute('tabindex'); else b.setAttribute('tabindex', prev);
        delete b.dataset._tabindex;
    }
    }
    });
    }
        function isActive() { return Date.now() < until; }
        function start(ms = 50) {
        until = Date.now() + ms;
        clearTimeout(timer);
        applyDisabled(true);
        timer = setTimeout(() => { if (!isActive()) applyDisabled(false); }, ms + 5);
    }
        function cancel() { until = 0; clearTimeout(timer); applyDisabled(false); }
        return { isActive, start, cancel };
    })();

        ProjectApp.slideHelpers = {
        _CLIP_FULL: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
        _CLIP_BASE: 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)',
        _CLIP_TOP:  'polygon(0 0%, 100% 0%, 100% 0%, 0 0%)',
        _CLIP_BOT:  'polygon(0 100%, 100% 100%, 100% 100%, 0% 100%)',

        setSlideBaseline(slide) {
        if (!slide || !window.gsap) return;
        const gs = gsap;
        const projectBlocks = slide.querySelectorAll('.project-block');
        the_bg = slide.querySelectorAll('.background-video-block');
        const previewBottom = slide.querySelectorAll('.preview-block.is--bottom');
        const previewTop    = slide.querySelectorAll('.preview-block.is--top');
        const nameLeftLines = slide.querySelectorAll('.name-wrapper.has--align-left');
        const nameRightLines= slide.querySelectorAll('.name-wrapper.has--align-right');

        if (projectBlocks.length) gs.set(projectBlocks, { clipPath: this._CLIP_BASE });
        if (the_bg.length)        gs.set(the_bg,        { clipPath: this._CLIP_BASE });
        if (previewTop.length)    gs.set(previewTop,    { clipPath: this._CLIP_TOP  });
        if (previewBottom.length) gs.set(previewBottom, { clipPath: this._CLIP_BOT  });

        if (nameLeftLines.length)  gs.set(nameLeftLines,  { opacity: 0 });
        if (nameRightLines.length) gs.set(nameRightLines, { opacity: 0 });
    },

        revealSlide(slide, duration = 0.8) {
        if (!slide || !window.gsap) return Promise.resolve();
        const ez = 'headingHoverEase';
        const tl = gsap.timeline();
        const projectBlocks = slide.querySelectorAll('.project-block');
        const the_bg        = slide.querySelectorAll('.background-video-block');
        const previewBottom = slide.querySelectorAll('.preview-block.is--bottom');
        const previewTop    = slide.querySelectorAll('.preview-block.is--top');
        const nameLeftLines = slide.querySelectorAll('.name-wrapper.has--align-left ');
        const nameRightLines= slide.querySelectorAll('.name-wrapper.has--align-right');

        if (projectBlocks.length)  tl.to(projectBlocks,  { clipPath: this._CLIP_FULL, duration, ease: ez }, 0);
        if (the_bg.length)         tl.to(the_bg,        { clipPath: this._CLIP_FULL, duration, ease: ez }, 0);
        if (previewBottom.length)  tl.to(previewBottom, { clipPath: this._CLIP_FULL, duration, ease: ez }, 0);
        if (previewTop.length)     tl.to(previewTop,    { clipPath: this._CLIP_FULL, duration, ease: ez }, 0);

        if (nameLeftLines.length)  tl.to(nameLeftLines,  { opacity: 1, duration, ease: ez, willChange: 'opacity' }, 0);
        if (nameRightLines.length) tl.to(nameRightLines, { opacity: 1, duration, ease: ez, willChange: 'opacity' }, 0);

        tl.add(() => {
        const clearTargets = [...projectBlocks, ...the_bg, ...previewBottom, ...previewTop, ...nameLeftLines, ...nameRightLines];
        if (clearTargets.length && window.gsap) {
        gsap.set(clearTargets, { clearProps: 'clipPath,transform,opacity,filter,willChange,transition' });
    }
        clearTargets.forEach(el => {
        el.style.removeProperty('clip-path');
        el.style.removeProperty('transform');
        el.style.removeProperty('opacity');
        el.style.removeProperty('filter');
        el.style.removeProperty('will-change');
        el.style.removeProperty('transition');
        if ((el.getAttribute('style') || '').trim() === '') el.removeAttribute('style');
    });
    }, '+=0.01');

        return new Promise(r => tl.eventCallback('onComplete', r));
    },

        hideToBaseline(slide, duration = 0.8, ease = 'headingHoverEase') {
        if (!slide || !window.gsap) return Promise.resolve();

        const tl = gsap.timeline({ defaults: { ease } });
        const allSlides = [
        slide,
        ...slide.parentElement.querySelectorAll('.swiper-slide-prev, .w-dyn-item.__armed')
        ].filter((el, i, arr) => el && arr.indexOf(el) === i);

        allSlides.forEach((sl) => {
        const projectBlocks = sl.querySelectorAll('.project-block');
        const the_bg        = sl.querySelectorAll('.background-video-block');
        const previewTop    = sl.querySelectorAll('.preview-block.is--top');
        const previewBottom = sl.querySelectorAll('.preview-block.is--bottom');
        const nameLeftLines = sl.querySelectorAll('.name-wrapper.has--align-left ');
        const nameRightLines= sl.querySelectorAll('.name-wrapper.has--align-right ');

        const media = [...projectBlocks, ...the_bg];
        const allTargets = [...media, ...previewTop, ...previewBottom, ...nameLeftLines, ...nameRightLines];

        if (allTargets.length) {
        gsap.killTweensOf(allTargets);
        gsap.set(allTargets, { transition: 'none' });
    }

        if (previewTop.length)    gsap.set(previewTop,    { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' });
        if (previewBottom.length) gsap.set(previewBottom, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' });

        tl.addLabel('go', 0);

        if (media.length)         tl.to(media,         { clipPath: this._CLIP_BASE, duration, ease, lazy: false, overwrite: 'auto', willChange: 'clip-path' }, 'go');
        if (previewTop.length)    tl.to(previewTop,    { clipPath: this._CLIP_TOP,  duration, ease, lazy: false, overwrite: 'auto', willChange: 'clip-path' }, 'go');
        if (previewBottom.length) tl.to(previewBottom, { clipPath: this._CLIP_BOT,  duration, ease, lazy: false, overwrite: 'auto', willChange: 'clip-path' }, 'go');

        if (nameLeftLines.length)  tl.to(nameLeftLines,  { opacity: 0, duration, ease, lazy: false, overwrite: 'auto', willChange: 'opacity' }, 'go');
        if (nameRightLines.length) tl.to(nameRightLines, { opacity: 0, duration, ease, lazy: false, overwrite: 'auto', willChange: 'opacity' }, 'go');

        tl.add(() => {
        if (allTargets.length) gsap.set(allTargets, { clearProps: 'transition,willChange' });
    }, 'go+=' + duration);
    });

        return new Promise(r => tl.eventCallback('onComplete', r));
    }
    };

        ProjectApp.visibleCleaner = (function () {
        const SELECTORS = [
        '.project-block',
        '.background-video-block',
        '.preview-block.is--top',
        '.preview-block.is--bottom',
        '.name-wrapper.has--align-left ',
        '.name-wrapper.has--align-right '
        ];
        const cleaned = new WeakSet();

        function clearInline(el) {
        if (window.gsap) gsap.set(el, { clearProps: 'clipPath,transform,opacity,filter,willChange,transition' });
        el.style.removeProperty('clip-path');
        el.style.removeProperty('transform');
        el.style.removeProperty('opacity');
        el.style.removeProperty('filter');
        el.style.removeProperty('will-change');
        el.style.removeProperty('transition');
        if ((el.getAttribute('style') || '').trim() === '') el.removeAttribute('style');
    }

        function runFor(swiperEl) {
        if (!swiperEl || cleaned.has(swiperEl)) return;
        const nodes = SELECTORS.flatMap(sel => Array.from(swiperEl.querySelectorAll(sel)));
        nodes.forEach(clearInline);
        cleaned.add(swiperEl);
    }

        function scheduleFor(swiperEl, ms = 50) {
        if (!swiperEl || cleaned.has(swiperEl)) return;
        setTimeout(() => runFor(swiperEl), ms);
    }

        function reset(swiperEl) {
        if (swiperEl && cleaned.has(swiperEl)) cleaned.delete(swiperEl);
    }

        return {runFor, scheduleFor, reset};
    })();

        ProjectApp._revealedActive = ProjectApp._revealedActive || new WeakMap();

        ProjectApp.eventHandlers = {
        setupSharedListeners() {
        const form = document.querySelector('#email-form');
        if (form && !form._catHandlerInstalled) {
        form.addEventListener('change', ProjectApp.eventHandlers.handleRadioChange, true);
        form._catHandlerInstalled = true;
    }
        document.addEventListener('click', ProjectApp.eventHandlers.handleClearClick, true);
        if (!ProjectApp._filterGuardInstalled) {
        document.addEventListener('click', (e) => {
        const el = e.target.closest('.filter-item, .option-item, .mode-block');
        if (!el) return;
        if (ProjectApp.uiLock?.isLocked()) {
        e.preventDefault();
        e.stopPropagation();
        return;
    }
        if (el.matches('.filter-item') && ProjectApp.filterCooldown.isActive()) {
        e.preventDefault();
        e.stopPropagation();
        return;
    }
    }, true);
        ProjectApp._filterGuardInstalled = true;
    }
    },

        cleanupSharedListeners() {
        const form = document.querySelector('#email-form');
        if (form && form._catHandlerInstalled) {
        form.removeEventListener('change', ProjectApp.eventHandlers.handleRadioChange, true);
        delete form._catHandlerInstalled;
    }
        document.removeEventListener('click', ProjectApp.eventHandlers.handleClearClick, true);
    },

        handleRadioChange(e) {
        if (ProjectApp.uiLock?.isLocked() || ProjectApp.filterCooldown.isActive()) return;
        const input = e.target && e.target.matches ? e.target : null;
        if (!input || !input.matches('input[type="radio"][name="radio"]')) return;
        const val = String(input.value || 'all').trim().toLowerCase();
        const labels = Array.from(document.querySelectorAll('.filter-item'));
        labels.forEach(l => {
        const i = l.querySelector('input[type="radio"][name="radio"]');
        l.classList.toggle('is--active', i && i.checked);
    });
        if (ProjectApp.filterModule?.setCategory) {
        ProjectApp.filterModule.setCategory(val);
        ProjectApp.filterCooldown.start(50);
    }
    },

        handleClearClick(e) {
        if (ProjectApp.uiLock?.isLocked() || ProjectApp.filterCooldown.isActive()) return;
        const btn = e.target.closest('[fs-list-element="clear"]');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        const form = document.querySelector('#email-form');
        const all = form ? form.querySelector('input[type="radio"][name="radio"][value="all"]') : null;
        if (all) {
        all.checked = true;
        all.dispatchEvent(new Event('change', {bubbles: true}));
    }
    }
    };

        ProjectApp.swiperFx = {
        getAll() {
        return Array.from(document.querySelectorAll('.swipers-container .swiper'));
    },
        getVisible() {
        return document.querySelector('.swipers-container .swiper.is--visible');
    },
        getActiveSlide(swiperEl) {
        const inst = swiperEl && swiperEl.swiper;
        return inst ? inst.slides[inst.activeIndex] : swiperEl?.querySelector('.swiper-slide-active, .is--active-logical');
    },
        hide(swiperEl) {
        if (!swiperEl) return;
        swiperEl.classList.remove('is--visible');
        ProjectApp.visibleCleaner.reset(swiperEl);
        ProjectApp._revealedActive.delete(swiperEl);
    },
        hideAll() {
        this.getAll().forEach(el => this.hide(el));
    },
        setVisible(swiperEl) {
        if (!swiperEl) return;
        this.hideAll();
        swiperEl.classList.add('is--visible');
    },
        async animateOut(swiperEl) {
        if (!swiperEl || !window.gsap) return;
        const slide = this.getActiveSlide(swiperEl);
        if (!slide) return;
        await ProjectApp.slideHelpers.hideToBaseline(slide, .8, 'headingHoverEase');
    }
    };

        ProjectApp.viewSwitcher = {
        _getListHoverBlock() {
        return document.querySelector('.background-block.list-hover');
    },
        _fade(el, toVisible) {
        if (!el) return;
        if (window.gsap) {
        gsap.killTweensOf(el);
        gsap.to(el, {opacity: toVisible ? 1 : 0, duration: 0.6, ease: 'power2.out'});
    } else {
        el.style.opacity = toVisible ? '1' : '0';
    }
    },

        async _revealVisibleSwiperOnce(swiperEl) {
        const active = ProjectApp.swiperFx.getActiveSlide(swiperEl);
        if (!active) {
        return;
    }
        const last = ProjectApp._revealedActive.get(swiperEl);
        if (last === active) {
        return;
    }
        if (window.gsap) {
        const t = active.querySelectorAll('.project-block, .background-video-block, .preview-block.is--top, .preview-block.is--bottom');
        gsap.killTweensOf(t);
    }
        ProjectApp.slideHelpers.setSlideBaseline(active);
        await ProjectApp.slideHelpers.revealSlide(active, 0.8);
        ProjectApp._revealedActive.set(swiperEl, active);
        ProjectApp.visibleCleaner.runFor(swiperEl);
    },

        async switchView(mode) {
        if (mode === ProjectApp.state?.currentView) return;
        if (ProjectApp.uiLock?.isLocked()) return;
        ProjectApp.uiLock?.lock();
        try {
        const swipersContainer = document.querySelector('.swipers-container');
        const projectCollection = document.querySelector('.project-collection');
        const projectList = document.querySelector('.project-list');
        const LHB = this._getListHoverBlock();

        if (mode === 'list') {
        if (ProjectApp.state?.currentView === 'swiper') {
        const vis = ProjectApp.swiperFx.getVisible();
        if (vis) {
        await ProjectApp.swiperFx.animateOut(vis);
        await new Promise(r => setTimeout(r, HIDE_DELAY_MS));
        ProjectApp.swiperFx.hide(vis);
    }
    }
        if (projectCollection) projectCollection.classList.remove('is--hidden');
        if (swipersContainer) swipersContainer.classList.add('is--hidden');
        if (projectList) {
        projectList.classList.remove('hide');
        projectList.removeAttribute('aria-hidden');
    }
        this._fade(LHB, true);
        ProjectApp.swiperFx.hideAll();
        ProjectApp.eventHandlers.cleanupSharedListeners();
        if (ProjectApp.listModule?.ensureListInit) ProjectApp.listModule.ensureListInit();
        ProjectApp.eventHandlers.setupSharedListeners();
        ProjectApp.state.currentView = 'list';
    } else {
        if (ProjectApp.state?.currentView === 'list') {
        if (ProjectApp.listModule?.animateOutCurrentItems) {
        await ProjectApp.listModule.animateOutCurrentItems(true);
        await new Promise(r => setTimeout(r, 100));
    }
    }
        if (projectCollection) projectCollection.classList.add('is--hidden');
        if (swipersContainer) swipersContainer.classList.remove('is--hidden');
        if (projectList) {
        projectList.classList.add('hide');
        projectList.setAttribute('aria-hidden', 'true');
    }
        if (ProjectApp.listModule?.cleanupInfiniteScroll) ProjectApp.listModule.cleanupInfiniteScroll();

        const category = ProjectApp.state?.currentCategory || 'all';
        if (ProjectApp.swiperModule?.switchToCategory) {
        await ProjectApp.swiperModule.switchToCategory(category);
    }

        const currentSwiper =
        document.querySelector('.swipers-container .swiper.is--visible, .swipers-container .swiper[data-active="1"]')
        || document.querySelector(`.swipers-container .swiper[data-category="${category}"]`)
        || document.querySelector('.swipers-container .swiper');

        if (currentSwiper) {
        ProjectApp.swiperFx.setVisible(currentSwiper);
        ProjectApp.visibleCleaner.scheduleFor(currentSwiper, 0);
    }

        this._fade(LHB, false);
        this.bindRevealOnSwipers();
        ProjectApp.eventHandlers.setupSharedListeners();
        ProjectApp.state.currentView = 'swiper';
    }
    } finally {
        ProjectApp.uiLock?.unlock();
    }
    },

        bindRevealOnSwipers() {
        const containers = Array.from(document.querySelectorAll('.swipers-container .swiper'));
        containers.forEach(swiperEl => {
        const inst = swiperEl && swiperEl.swiper;
        if (!inst || inst._revealBound) return;
        inst._revealBound = true;
        inst.on('init', () => {
    });
        inst.on('slideChangeTransitionStart', () => {
    });
    });
    },

        revealCurrentActive(forceReset = false) {
        const visibleSwiper = document.querySelector('.swiper.is--visible') || document.querySelector('.swipers-container .swiper');
        if (!visibleSwiper) return Promise.resolve();
        const inst = visibleSwiper.swiper;
        const active = inst ? inst.slides[inst.activeIndex] : visibleSwiper.querySelector('.swiper-slide-active, .is--active-logical');
        if (!active) return Promise.resolve();
        if (forceReset) ProjectApp.slideHelpers.setSlideBaseline(active);
        return ProjectApp.slideHelpers.revealSlide(active, 0.8);
    },

        animateOutListBackground() {
        return Promise.resolve();
    },
        animateInListBackground() {
        return Promise.resolve();
    },
        animateOutSwiperToBaseline() {
        const vis = ProjectApp.swiperFx.getVisible();
        return vis ? ProjectApp.swiperFx.animateOut(vis) : Promise.resolve();
    },

        initSwitchAnimation() {
        ProjectApp.viewSwitcher.cleanupSwitchAnimation();
        ProjectApp.state.switchAnim.modeBlock = document.querySelector('.mode-block');
        ProjectApp.state.switchAnim.filterButtons = Array.from(document.querySelectorAll('.filter-item'));
        ProjectApp.state.switchAnim.optionBlocks = Array.from(document.querySelectorAll('.option-item'));

        if (ProjectApp.state.switchAnim.modeBlock) {
        const onModeClick = () => {
        ProjectApp.state.switchAnim.modeBlock.classList.toggle('is--active');
        const isActive = ProjectApp.state.switchAnim.modeBlock.classList.contains('is--active');

        const backgroundVideoBlocks = document.querySelectorAll('.background-video-block');
        const backgroundBlocks = document.querySelectorAll('.background-block');

        if (ProjectApp.state.switchAnim.videoTimeouts) {
        ProjectApp.state.switchAnim.videoTimeouts.forEach(timeout => clearTimeout(timeout));
        ProjectApp.state.switchAnim.videoTimeouts = [];
    } else {
        ProjectApp.state.switchAnim.videoTimeouts = [];
    }

        backgroundVideoBlocks.forEach(videoBlock => {
        videoBlock.classList.toggle('is--on', isActive);

        const video = videoBlock.querySelector('video');
        if (video) {
        if (isActive) {
        video.setAttribute('autoplay', 'autoplay');
        video.play().catch(e => console.log('Video play failed:', e));
    } else {
        const timeout = setTimeout(() => {
        video.removeAttribute('autoplay');
        video.pause();
        video.currentTime = 0;
    }, 1200);

        ProjectApp.state.switchAnim.videoTimeouts.push(timeout);
    }
    }
    });

        backgroundBlocks.forEach(block => {
        block.classList.toggle('is--on', isActive);

        const video = block.querySelector('video');
        if (video) {
        if (isActive) {
        video.setAttribute('autoplay', 'autoplay');
        video.play().catch(e => console.log('Video play failed:', e));
    } else {
        const timeout = setTimeout(() => {
        video.removeAttribute('autoplay');
        video.pause();
        video.currentTime = 0;
    }, 1200);

        ProjectApp.state.switchAnim.videoTimeouts.push(timeout);
    }
    }
    });
    };

        ProjectApp.viewSwitcher.addTrackedListener(ProjectApp.state.switchAnim.modeBlock, 'click', onModeClick);
    }

        ProjectApp.state.switchAnim.filterButtons.forEach((btn) => {
        const onFilterClick = () => {
        if (!btn.classList.contains('is--active')) {
        ProjectApp.state.switchAnim.filterButtons.forEach(b => b.classList.remove('is--active'));
        btn.classList.add('is--active');
    }
    };
        ProjectApp.viewSwitcher.addTrackedListener(btn, 'click', onFilterClick);
    });

        ProjectApp.state.switchAnim.optionBlocks.forEach((opt) => {
        const onOptionClick = () => {
        if (!opt.classList.contains('is--active')) {
        ProjectApp.state.switchAnim.optionBlocks.forEach(b => b.classList.remove('is--active'));
        opt.classList.add('is--active');
        if (opt.hasAttribute('data-list')) {
        ProjectApp.viewSwitcher.switchView('list');
    } else {
        ProjectApp.viewSwitcher.switchView('swiper');
    }
    }
    };
        ProjectApp.viewSwitcher.addTrackedListener(opt, 'click', onOptionClick);
    });

        ProjectApp.viewSwitcher.initializeVideoStates();
    },

        initializeVideoStates() {
        const backgroundVideoBlocks = document.querySelectorAll('.background-video-block');
        const backgroundBlocks = document.querySelectorAll('.background-block');

        [...backgroundVideoBlocks, ...backgroundBlocks].forEach(block => {
        const video = block.querySelector('video');
        if (video) {
        if (!block.classList.contains('is--on')) {
        video.removeAttribute('autoplay');
        video.pause();
        video.currentTime = 0;
    }
    }
    });
    },

        cleanupSwitchAnimation() {
        if (ProjectApp.state.switchAnim.videoTimeouts) {
        ProjectApp.state.switchAnim.videoTimeouts.forEach(timeout => clearTimeout(timeout));
        ProjectApp.state.switchAnim.videoTimeouts = [];
    }

        ProjectApp.state.switchAnim.listeners.forEach(({target, type, handler, options}) => {
        try { target.removeEventListener(type, handler, options); } catch(e) {}
    });
        ProjectApp.state.switchAnim.listeners = [];
        ProjectApp.state.switchAnim.modeBlock = null;
        ProjectApp.state.switchAnim.filterButtons = [];
        ProjectApp.state.switchAnim.optionBlocks = [];
    },

        addTrackedListener(target, type, handler, options) {
        target.addEventListener(type, handler, options || false);
        ProjectApp.state.switchAnim.listeners.push({ target, type, handler, options: options || false });
    }
    };



        window.ProjectApp = window.ProjectApp || {};
        ProjectApp.state = ProjectApp.state || {};
        ProjectApp.filterModule = ProjectApp.filterModule || {};
        ProjectApp.debug = (ProjectApp.debug !== undefined) ? ProjectApp.debug : true;

        (function () {
        const hasGSAP = () => typeof window.gsap !== 'undefined';
        const twoDigit = (n) => { n = Number(n) || 0; return n < 10 ? ('0' + n) : String(n); };

        function countSlides(swiperEl) {
        if (!swiperEl) return 0;
        const wr = swiperEl.querySelector('.swiper-wrapper');
        if (!wr) return 0;
        return Array.from(wr.querySelectorAll('.swiper-slide')).filter(s => !s.classList.contains('swiper-slide-duplicate')).length;
    }

        function readAllCountsFromDOM() {
        return {
        all: countSlides(document.querySelector('.swiper.is--all')),
        editorial: countSlides(document.querySelector('.swiper.is--editorial')),
        'tv-film': countSlides(document.querySelector('.swiper.is--tv-film')),
        commercial: countSlides(document.querySelector('.swiper.is--commercial')),
    };
    }

        function normalizeCatIdentity(v) {
        const s = String(v ?? 'all').trim().toLowerCase();
        return s || 'all';
    }

        ProjectApp.filterModule.initializeTotalCounts = function () {
        if (ProjectApp.state.countsInitialized) return;
        ProjectApp.state.totalCounts = readAllCountsFromDOM();
        ProjectApp.filterModule.updateAllCountDisplays();
        ProjectApp.state.countsInitialized = true;
    };

        ProjectApp.filterModule.updateAllCountDisplays = function () {
        const tc = ProjectApp.state.totalCounts;
        if (!tc) return;
        document.querySelectorAll('[data-total]').forEach(el => el.textContent = twoDigit(tc.all));
        document.querySelectorAll('[data-editorial]').forEach(el => el.textContent = twoDigit(tc.editorial));
        document.querySelectorAll('[data-tv-film]').forEach(el => el.textContent = twoDigit(tc['tv-film']));
        document.querySelectorAll('[data-commercial]').forEach(el => el.textContent = twoDigit(tc.commercial));
        ProjectApp.filterModule.updateCurrentTotalCount();
    };

        ProjectApp.filterModule.updateCurrentTotalCount = function () {
        const tc = ProjectApp.state.totalCounts;
        if (!tc) return;
        const cat = normalizeCatIdentity(ProjectApp.state.currentCategory || 'all');
        const count = (cat === 'all') ? tc.all : (tc[cat] ?? tc.all);
        document.querySelectorAll('[data-current-total]').forEach(el => el.textContent = twoDigit(count));
    };

        ProjectApp.filterModule.setCategory = function (newCat) {
        const next = normalizeCatIdentity(newCat);
        const prev = normalizeCatIdentity(ProjectApp.state.currentCategory || 'all');
        if (prev === next) { ProjectApp.filterModule.updateCurrentTotalCount(); return; }
        ProjectApp.state.currentCategory = next;
        ProjectApp.filterModule.updateCurrentTotalCount();
        const view = ProjectApp.state.currentView || 'list';
        if (view === 'list') {
        if (ProjectApp.listModule?.rebuildListForCurrentFilter) {
        Promise.resolve(ProjectApp.listModule.rebuildListForCurrentFilter());
    }
    } else if (view === 'swiper') {
        if (ProjectApp.swiperModule?.switchToCategory) {
        Promise.resolve(ProjectApp.swiperModule.switchToCategory(next));
    }
    }
    };

        ProjectApp.filterModule.debugValidateSwiperCounts = function () {
        const dom = readAllCountsFromDOM();
        if (!ProjectApp.state.totalCounts) return;
        const mismatch = Object.keys(dom).some(k => dom[k] !== ProjectApp.state.totalCounts[k]);
        if (mismatch) ProjectApp.filterModule.updateAllCountDisplays();
    };

        function getVisibleSwiper() {
        return document.querySelector('.swipers-container .swiper.is--visible');
    }

        function getListRoot() {
        return document.querySelector('.project-list');
    }

        function collapseBlocks(root) {
        if (!root) return;
        const all = root.querySelectorAll('.project-block, .background-video-block, .background-video-block .background-video, .video-spacer, .video-wrapper');
        all.forEach(el => {
        el.style.transition = 'none';
        el.style.clipPath = 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)';
    });
        const pw = root.querySelectorAll('.preview-block .preview-video');
        pw.forEach(p => {
        const isTop = p.closest('.preview-block')?.classList.contains('is--top');
        p.style.transition = 'none';
        p.style.clipPath = isTop
        ? 'polygon(0 0%, 100% 0%, 100% 0%, 0 0%)'
        : 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)';
    });
        const wr = root.querySelector('.preview-wrapper');
        if (wr) wr.style.opacity = '0';
    }

        function expandBlocks(root, opts = {}) {
        if (!root) return Promise.resolve();
        if (!hasGSAP()) {
        const all = root.querySelectorAll('.project-block, .background-video-block, .background-video-block');
        all.forEach(el => { el.style.clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'; });
        const wr = root.querySelector('.preview-wrapper');
        if (wr) wr.style.opacity = '1';
        return Promise.resolve();
    }
        const d = opts.duration || .8;
        const ez = opts.ease || 'headingHoverEase';
        return new Promise(resolve => {
        const tl = gsap.timeline({onComplete: resolve});
        const blocks = root.querySelectorAll('.project-block, .background-video-block, .background-video-block');
        blocks.forEach((b,i)=>tl.to(b,{clipPath:'polygon(0 0, 100% 0, 100% 100%, 0 100%)',duration:d,ease:ez,delay:i*0.02},0));
        const pv = root.querySelectorAll('.preview-block .preview-video');
        pv.forEach(p=>tl.to(p,{clipPath:'polygon(0 0, 100% 0, 100% 100%, 0 100%)',duration:d,ease:ez},0));
    });
    }

        async function animateOutCurrentView(currentView) {
        if (currentView === 'swiper') {
        const swiperEl = getVisibleSwiper();
        if (!swiperEl) return;
        const active = swiperEl.querySelector('.swiper-slide-active, .is--active-logical') || swiperEl;
        collapseBlocks(active);
        await expandBlocks(active, {duration: .01});
        if (ProjectApp.swiperModule?.animateSwiperOut) await ProjectApp.swiperModule.animateSwiperOut(swiperEl);
    } else if (currentView === 'list') {
        const list = getListRoot();
        if (!list) return;
        collapseBlocks(list);
        await expandBlocks(list, {duration: .4});
    }
    }

        function showOnly(view) {
        const container = document.querySelector('.swipers-container');
        const list = getListRoot();
        if (container) container.style.display = (view === 'swiper') ? '' : 'none';
        if (list) list.style.display = (view === 'list') ? '' : 'none';
    }

        async function animateInNextView(nextView) {
        if (nextView === 'swiper') {
        const swiperEl = getVisibleSwiper();
        if (!swiperEl) { if (ProjectApp.swiperModule?.initAll) ProjectApp.swiperModule.initAll(); }
        const targetSwiper = getVisibleSwiper();
        if (targetSwiper) {
        const active = targetSwiper.querySelector('.swiper-slide-active, .is--active-logical') || targetSwiper;
        collapseBlocks(active);
        if (ProjectApp.swiperModule?.animateActiveSlideIn) {
        await ProjectApp.swiperModule.animateActiveSlideIn(targetSwiper);
    } else {
        await expandBlocks(active, {duration: .8});
    }
    }
    } else if (nextView === 'list') {
        const list = getListRoot();
        if (list) {
        collapseBlocks(list);
        await expandBlocks(list, {duration: .6});
    }
    }
    }

        ProjectApp.filterModule.switchView = async function (toView) {
        const next = (toView === 'swiper') ? 'swiper' : 'list';
        const prev = ProjectApp.state.currentView || 'list';
        if (prev === next) return;
        await animateOutCurrentView(prev);
        showOnly(next);
        ProjectApp.state.currentView = next;
        if (next === 'swiper') {
        if (ProjectApp.swiperModule?.initAll && !ProjectApp.swiperModule.swipers?.all) {
        ProjectApp.swiperModule.initAll();
    } else if (ProjectApp.swiperModule?.swipers && ProjectApp.state.currentCategory) {
        const cat = ProjectApp.state.currentCategory;
        if (!ProjectApp.swiperModule.swipers[cat] && ProjectApp.swiperModule.initSwiper) {
        ProjectApp.swiperModule.initSwiper(cat);
    }
    }
    }
        await animateInNextView(next);
    };
    })();