 // ============================================
    // STATE
    // ============================================
    window.ProjectApp = {
    state: {
    cachedItemHeight: null,
    scrollInitialized: false,
    scrollListener: null,
    swiper: null,
    isTransitioning: false,
    currentView: null,
    currentCategory: 'all',
    blockAlignmentState: 'initial',
    listTemplates: [],
    swiperTemplates: [],
    backgroundHoverHandler: null,
    totalCounts: { all: 0, editorial: 0, 'tv-film': 0, commercial: 0 },
    countsInitialized: false,
    linkHoverState: { items: [] },
    timelineState: { timers: [], visibilityHandler: null },
    switchAnim: { modeBlock: null, filterButtons: [], optionBlocks: [], listeners: [] },
    swiperBuildInProgress: false,
    isScrolling: false,
    scrollTimeout: null
},

    utils: {},
    templateManager: {},
    listModule: {},
    swiperModule: {},
    filterModule: {},
    animations: {},
    viewSwitcher: {},
    barbaManager: {},
    timeline: {},
    eventHandlers: {},
    archivePageModule: {},
    pageSpecificModule: {},
    reportageSwiper: {},
    textStyling: {},
    pageAnimations: {}
};

    const ProjectApp = window.ProjectApp;

    if (window.gsap && window.CustomEase) {
     CustomEase.create("mainEase", "0.65, 0, 0, 1");
     CustomEase.create("headingHoverEase", "0.75, 0, 0.25, 1");
     CustomEase.create("transitionEase", "0.75, 0, 0, 1");
    }

    // ============================================
    // UTILITIES
    // ============================================
    ProjectApp.utils = {
    norm(str) {
    return (str || '').trim().toLowerCase();
},

    isElementActuallyHidden(el) {
    if (!el) return true;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return true;
    if (!el.offsetParent && s.position !== 'fixed') return true;
    return false;
},

    withTemporarilyShown(el, fn) {
    if (!el) return;

    const prev = {
    display: el.style.display,
    visibility: el.style.visibility,
    position: el.style.position,
    left: el.style.left,
    top: el.style.top,
    pointerEvents: el.style.pointerEvents
};

    const needsTemp = ProjectApp.utils.isElementActuallyHidden(el);

    if (needsTemp) {
    el.style.visibility = 'hidden';
    el.style.position = 'absolute';
    el.style.left = '-99999px';
    el.style.top = '-99999px';
    el.style.pointerEvents = 'none';
    el.style.display = 'block';
}

    try {
    fn();
} finally {
    if (needsTemp) {
    el.style.display = prev.display;
    el.style.visibility = prev.visibility;
    el.style.position = prev.position;
    el.style.left = prev.left;
    el.style.top = prev.top;
    el.style.pointerEvents = prev.pointerEvents;
}
}
},

    waitForImages(container) {
    const images = Array.from(container.querySelectorAll('img'));
    const imgPromises = images.map(img => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();

    return new Promise(res => {
    const done = () => res();
    img.addEventListener('load', done, {once: true});
    img.addEventListener('error', done, {once: true});
    setTimeout(done, 500);
});
});
    return Promise.all(imgPromises);
},

    measureItemHeight(templates, projectList) {
    if (!templates.length) return 0;

    const probe = templates[0].cloneNode(true);
    probe.style.position = 'absolute';
    probe.style.left = '-99999px';
    probe.style.top = '-99999px';
    probe.style.visibility = 'hidden';
    probe.style.width = '100%';

    projectList.appendChild(probe);
    const h = probe.getBoundingClientRect().height;
    probe.remove();

    return h;
},

    waitFor(testFn, timeoutMs, intervalMs) {
    return new Promise((resolve) => {
    const start = Date.now();
    const iv = setInterval(() => {
    let ok = false;
    try { ok = !!testFn(); } catch (e) { ok = false; }
    if (ok) { clearInterval(iv); resolve(true); return; }
    if (Date.now() - start > (timeoutMs || 3000)) { clearInterval(iv); resolve(false); }
}, intervalMs || 50);
});
},

    prepareVideos(container) {
    const videos = container.querySelectorAll('video');
    videos.forEach(video => {
    video.preload = 'metadata';
    video.setAttribute('loading', 'lazy');

    if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
    if (entry.isIntersecting) {
    video.preload = 'auto';
    observer.unobserve(video);
}
});
}, { rootMargin: '50px' });
    observer.observe(video);
}
});
}
};

 // TIMELINE MODULE
 ProjectApp.timeline = {
     initTimeline() {
         ProjectApp.timeline.cleanupTimeline();

         const blocks = Array.from(document.querySelectorAll('.timeline-block'));
         if (!blocks.length) return;

         function fmt(totalMs) {
             const m = Math.floor(totalMs / 60000);
             const s = Math.floor((totalMs % 60000) / 1000);
             const ms = Math.floor((totalMs % 1000) / 10);
             return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(ms).padStart(2, '0')}`;
         }

         blocks.forEach(block => {
             const el = block.querySelector('.text-mono');
             if (!el) return;

             const timer = {
                 element: el,
                 milliseconds: 0,
                 intervalId: null,
                 start() {
                     if (this.intervalId) return;
                     this.intervalId = setInterval(() => {
                         this.element.textContent = fmt(this.milliseconds);
                         this.milliseconds += 10;
                     }, 10);
                 },
                 stop() {
                     if (this.intervalId) {
                         clearInterval(this.intervalId);
                         this.intervalId = null;
                     }
                 }
             };

             el.textContent = fmt(0);
             timer.start();
             ProjectApp.state.timelineState.timers.push(timer);
         });

         const onVis = () => {
             ProjectApp.state.timelineState.timers.forEach(t => {
                 if (document.hidden) {
                     t.stop();
                 } else {
                     t.start();
                 }
             });
         };

         document.addEventListener('visibilitychange', onVis);
         ProjectApp.state.timelineState.visibilityHandler = onVis;
     },

     cleanupTimeline() {
         ProjectApp.state.timelineState.timers.forEach(t => {
             try { t.stop(); } catch(e) {}
         });
         ProjectApp.state.timelineState.timers = [];

         if (ProjectApp.state.timelineState.visibilityHandler) {
             try {
                 document.removeEventListener('visibilitychange', ProjectApp.state.timelineState.visibilityHandler);
             } catch(e) {}
             ProjectApp.state.timelineState.visibilityHandler = null;
         }
     }
 };

 // CREDITS HOVER
 ProjectApp.pageAnimations = {
     initCreatorHover() {
         const creatorBlock = document.querySelector('.creator-block');
         const creatorLinks = document.querySelectorAll('.creator-link');

         if (!creatorBlock || !creatorLinks.length) return;

         const oldBlock = creatorBlock.cloneNode(true);
         creatorBlock.parentNode.replaceChild(oldBlock, creatorBlock);

         let hoverTimeout;

         oldBlock.addEventListener('mouseenter', () => {
             clearTimeout(hoverTimeout);
             hoverTimeout = setTimeout(() => {
                 const links = oldBlock.querySelectorAll('.creator-link');
                 links.forEach((link, index) => {
                     const reverseIndex = links.length - 1 - index;
                     setTimeout(() => {
                         link.classList.remove('animate-out');
                         link.classList.add('animate-in');
                     }, reverseIndex * 80);
                 });
             }, 150);
         });

         oldBlock.addEventListener('mouseleave', () => {
             clearTimeout(hoverTimeout);
             const links = oldBlock.querySelectorAll('.creator-link');
             links.forEach((link, index) => {
                 setTimeout(() => {
                     link.classList.remove('animate-in');
                     link.classList.add('animate-out');
                 }, index * 80);
             });
         });
     },

     initAll() {
         ProjectApp.pageAnimations.initCreatorHover();
     }
 };

    // ============================================
    // SWIPER ANIMATIONS
    // ============================================
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

    // ProjectApp.state = ProjectApp.state || {};
    // ProjectApp.animations = ProjectApp.animations || {};
    // ProjectApp.utils = ProjectApp.utils || {};

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

    ProjectApp.slidePresets = ProjectApp.slidePresets || {};

    ProjectApp.animations.addHoverAnimationToSwiperSlides =
    ProjectApp.animations.addHoverAnimationToSwiperSlides || function(){};
    })();

    // ============================================
    // SWIPER MODULE
    // ============================================
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

    // ============================================
    // LIST MODULE
    // ============================================
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

    //if(window.ProjectApp && ProjectApp.bootstrap) ProjectApp.bootstrap();


    // ============================================
    // SWITCH PAGE MODULE
    // ============================================
    // window.ProjectApp = window.ProjectApp || {};
    // ProjectApp.state = ProjectApp.state || {};
    // ProjectApp.animations = ProjectApp.animations || {};
    // ProjectApp.utils = ProjectApp.utils || {};

//    const HIDE_DELAY_MS = 100;

//     if (ProjectApp.state.currentView == null) ProjectApp.state.currentView = 'list';
//     if (ProjectApp.state.currentCategory == null) ProjectApp.state.currentCategory = 'all';
//     if (!ProjectApp.state.switchAnim) ProjectApp.state.switchAnim = {listeners: []};
//
//     ProjectApp.utils.norm = ProjectApp.utils.norm || function (s) {
//     return String(s || '').toLowerCase().trim();
// };
//     ProjectApp.utils.withTemporarilyShown = ProjectApp.utils.withTemporarilyShown || function (el, fn) {
//     if (!el) return fn && fn();
//     const wasNone = getComputedStyle(el).display === 'none' || el.classList.contains('is--hidden');
//     const prev = { display: el.style.display, visibility: el.style.visibility, pointerEvents: el.style.pointerEvents };
//     if (wasNone) {
//     el.classList.remove('is--hidden');
//     el.style.display = 'block';
//     el.style.visibility = 'hidden';
//     el.style.pointerEvents = 'none';
// }
//     try { return fn && fn(); } finally {
//     if (wasNone) {
//     el.style.display = prev.display || '';
//     el.style.visibility = prev.visibility || '';
//     el.style.pointerEvents = prev.pointerEvents || '';
//     el.classList.add('is--hidden');
// }
// }
// };
//     ProjectApp.utils.measureItemHeight = ProjectApp.utils.measureItemHeight || function(templates, listEl){
//     const tmp = document.createElement('div');
//     tmp.style.position = 'absolute';
//     tmp.style.left = '-99999px';
//     tmp.style.top = '0';
//     tmp.style.width = (listEl && listEl.clientWidth ? listEl.clientWidth : 1000) + 'px';
//     document.body.appendChild(tmp);
//     const first = templates && templates[0] ? templates[0].cloneNode(true) : null;
//     if (!first){ document.body.removeChild(tmp); return 120; }
//     tmp.appendChild(first);
//     const h = Math.max(1, first.offsetHeight || 0);
//     document.body.removeChild(tmp);
//     return h;
// };

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

// Add this NEW function to apply video states
        applyModeState() {
            const isModeActive = sessionStorage.getItem('modeActive') === 'true';
            const modeBlock = document.querySelector('.mode-block');

            // Update mode block state
            if (modeBlock) {
                if (isModeActive) {
                    modeBlock.classList.add('is--active');
                } else {
                    modeBlock.classList.remove('is--active');
                }
            }

            // Apply to all background blocks on current page
            const backgroundVideoBlocks = document.querySelectorAll('.background-video-block');
            const backgroundBlocks = document.querySelectorAll('.background-block');

            [...backgroundVideoBlocks, ...backgroundBlocks].forEach(block => {
                const video = block.querySelector('video');

                if (isModeActive) {
                    block.classList.add('is--on');
                    if (video) {
                        video.setAttribute('autoplay', 'autoplay');
                        video.play().catch(e => console.log('Video play failed:', e));
                    }
                } else {
                    block.classList.remove('is--on');
                    if (video) {
                        video.removeAttribute('autoplay');
                        video.pause();
                        video.currentTime = 0;
                    }
                }
            });

            console.log('Applied mode state:', isModeActive ? 'active' : 'inactive');
        },

        initSwitchAnimation() {
            ProjectApp.viewSwitcher.cleanupSwitchAnimation();
            ProjectApp.state.switchAnim.modeBlock = document.querySelector('.mode-block');
            ProjectApp.state.switchAnim.filterButtons = Array.from(document.querySelectorAll('.filter-item'));
            ProjectApp.state.switchAnim.optionBlocks = Array.from(document.querySelectorAll('.option-item'));

            if (ProjectApp.state.switchAnim.modeBlock) {
                const onModeClick = () => {
                    const wasActive = ProjectApp.state.switchAnim.modeBlock.classList.contains('is--active');
                    const nowActive = !wasActive;

                    // Toggle mode block state
                    ProjectApp.state.switchAnim.modeBlock.classList.toggle('is--active');

                    // Save state to sessionStorage so it persists across pages
                    sessionStorage.setItem('modeActive', nowActive.toString());

                    const backgroundVideoBlocks = document.querySelectorAll('.background-video-block');
                    const backgroundBlocks = document.querySelectorAll('.background-block');

                    // Clear existing timeouts
                    if (ProjectApp.state.switchAnim.videoTimeouts) {
                        ProjectApp.state.switchAnim.videoTimeouts.forEach(timeout => clearTimeout(timeout));
                        ProjectApp.state.switchAnim.videoTimeouts = [];
                    } else {
                        ProjectApp.state.switchAnim.videoTimeouts = [];
                    }

                    // Apply to all background blocks
                    [...backgroundVideoBlocks, ...backgroundBlocks].forEach(block => {
                        const video = block.querySelector('video');

                        if (nowActive) {
                            block.classList.add('is--on');
                            if (video) {
                                video.setAttribute('autoplay', 'autoplay');
                                video.play().catch(e => console.log('Video play failed:', e));
                            }
                        } else {
                            block.classList.remove('is--on');
                            if (video) {
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

            // Apply saved mode state on init
            ProjectApp.viewSwitcher.applyModeState();
        },

        initializeVideoStates() {
            // This now happens in applyModeState
            ProjectApp.viewSwitcher.applyModeState();
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

    // window.ProjectApp = window.ProjectApp || {};
    // ProjectApp.state = ProjectApp.state || {};
    // ProjectApp.filterModule = ProjectApp.filterModule || {};
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


    // ============================================
    // ARCHIVE PAGE MODULE
    // ============================================
    ProjectApp.archivePageModule = {
        config: {
        VIDEO_LOAD_DELAY: 800,
        VIDEO_FADE_OUT_DELAY: 600,
        BACKGROUND_RESTORE_DELAY: 1200,
        NAME_BLOCK_MAX_CHARS: 30,
        INFINITE_SCROLL_BUFFER: 10,
        MAX_ACTIVE_VIDEOS: 12,
        MARQUEE_DURATION: 65,
        MARQUEE_REPEAT_TIMES: 2,
        SIDE_VIDEO_STAGGER_DELAY: 100,
        TEXT_ANIMATION_DURATION: 0.4,
        TEXT_ANIMATION_STAGGER: 0.01,
        TEXT_ANIMATION_OUT_DURATION: 0.4,
        TEXT_ANIMATION_OUT_STAGGER: 0.01,
        SWIPER_REVEAL_DELAY: 400,
        VIDEO_UPDATE_FREQUENCY: 3,
        DEFAULT_VIDEO_SRC: 'https://18dccfa619686586.cdn.express/jason-bergh/Jason-Bergh-Video.mp4',

        textStyling: {
        leftPaddingLetters: ['B', 'D', 'E', 'F', 'H', 'I', 'K', 'L', 'N', 'P', 'R', 'S'],
        mediumPaddingLetters: ['M', 'J', 'X'],
        largePaddingLetters: ['A'],
        leftPaddingValue: '0.4vw',
        mediumPaddingValue: '0.6vw',
        largePaddingValue: '0.3vw',
            /*
            ProjectApp.textStyling = {
        config: {
            leftPaddingLetters: ['B', 'D', 'E', 'F', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S'],
            mediumPaddingLetters: ['X'],
            largePaddingLetters: ['A'],
            tinyMarginLetters: ['C', 'G'],
            leftMarginLetters: ['T', 'Y'],
            largeMarginLetters: ['W'],

            leftPaddingValue: '0.4vw',
            mediumPaddingValue: '0.6vw',
            largePaddingValue: '0.9vw',
            tinyMarginValue: '-0.25vw',
            leftMarginValue: '-0.4vw',
            largeMarginValue: '-0.9vw'
        },

        italicizeFirstLetters(selectors, opts) {
            var options = Object.assign({ lettersOnly: true }, opts || {});
            var targets = Array.isArray(selectors) ? selectors : [selectors];
            targets.forEach(function (selector) {
                document.querySelectorAll(selector).forEach(function (rootEl) {
                    var alreadySplit = rootEl.querySelector('.word') && rootEl.querySelector('.char');
                    var instance = alreadySplit ? null : new SplitType(rootEl, { types: 'lines, words, chars', tagName: 'span' });
                    var wordEls = Array.from(rootEl.querySelectorAll('.word'));
                    wordEls.forEach(function (word) {
                        var firstCharEl = null;
                        if (options.lettersOnly) {
                            var chars = word.querySelectorAll('.char');
                            for (var i = 0; i < chars.length; i++) {
                                var c = chars[i].textContent || '';
                                if (/[A-Za-zÀ-ÖØ-öø-ÿĀ-žА-Яа-яЇїІіЄєҐґ]/.test(c)) {
                                    firstCharEl = chars[i];
                                    break;
                                }
                            }
                            if (!firstCharEl && chars.length) firstCharEl = chars[0];
                        } else {
                            firstCharEl = word.querySelector('.char');
                        }
                        if (firstCharEl) firstCharEl.classList.add('has--style-italic');
                    });

                    var lines = rootEl.querySelectorAll('.line');
                    lines.forEach(function(line) {
                        if (!line.parentElement.classList.contains('line-wrapper')) {
                            var wrapper = document.createElement('div');
                            wrapper.className = 'line-wrapper';
                            wrapper.style.overflow = 'hidden';
                            line.parentNode.insertBefore(wrapper, line);
                            wrapper.appendChild(line);
                        }
                    });
                });
            });
        },

        applyLetterPadding() {
            const charElements = document.querySelectorAll('.name-xlarge .line-wrapper .line .word .char.has--style-italic');

            const cfg = this.config;

            charElements.forEach(element => {
                const letter = element.textContent.trim();

                element.style.paddingLeft = '';
                element.style.paddingRight = '';
                element.style.marginLeft = '';
                element.style.marginRight = '';

                if (cfg.leftPaddingLetters.includes(letter)) {
                    element.style.paddingLeft = cfg.leftPaddingValue;
                }

                if (cfg.mediumPaddingLetters.includes(letter)) {
                    element.style.paddingLeft = cfg.mediumPaddingValue;
                }

                if (cfg.largePaddingLetters.includes(letter)) {
                    element.style.paddingLeft = cfg.largePaddingValue;
                }

                if (cfg.tinyMarginLetters.includes(letter)) {
                    element.style.marginLeft = cfg.tinyMarginValue;
                }

                if (cfg.leftMarginLetters.includes(letter)) {
                    element.style.marginLeft = cfg.leftMarginValue;
                }

                if (cfg.largeMarginLetters.includes(letter)) {
                    element.style.marginLeft = cfg.largeMarginValue;
                }
            });
        },

        init() {
            this.italicizeFirstLetters(['.name-block .name-medium', '.name-xlarge'], { lettersOnly: true });
            this.applyLetterPadding();
        }
    };
             */
    }
    },

        state: {
        marqueeAnimations: [],
        draggables: [],
        archiveMarqueeInitialized: false,
        textAnimations: [],
        splitInstances: [],
        archiveScrollInitialized: false,
        archiveScrollListener: null,
        currentView: 'swiper',
        switchAnim: { listeners: [], optionBlocks: [] },
        archiveItemIndices: [],
        videoHoverListeners: [],
        archiveVideoHoverListeners: [],
        marqueeScrollListeners: [],
        videoTimeouts: [],

        cachedElements: {
        archiveVideo: null,
        sideVideoWrapper: null,
        sideVideos: [],
        archiveCollection: null,
        archiveList: null,
        scrollContainer: null,
        archiveContainer: null
    }
    },

        helpers: {
        cacheElements() {
        const cache = ProjectApp.archivePageModule.state.cachedElements;
        cache.archiveVideo = document.querySelector('.archive-video');
        cache.sideVideoWrapper = document.querySelector('.side-video-wrapper');
        cache.sideVideos = cache.sideVideoWrapper
        ? Array.from(cache.sideVideoWrapper.querySelectorAll('.side-video'))
        : [];
        cache.archiveCollection = document.querySelector('.archive-collection');
        cache.archiveList = document.querySelector('.archive-list');
        cache.scrollContainer = document.querySelector('.archive-scroll-container');
        cache.archiveContainer = document.querySelector('.archive-container');
    },

        clearElementCache() {
        const cache = ProjectApp.archivePageModule.state.cachedElements;
        Object.keys(cache).forEach(key => {
        cache[key] = Array.isArray(cache[key]) ? [] : null;
    });
    },

        videoHelpers: {
        setVideoSource(videoSrc, options = {}) {
        const {
        delay = 0,
        staggerSideVideos = false,
        clearFirst = false
    } = options;

        const cache = ProjectApp.archivePageModule.state.cachedElements;

        const updateVideos = () => {
        if (cache.archiveVideo) {
        const source = cache.archiveVideo.querySelector('source');
        if (source) {
        cache.archiveVideo.pause();
        source.setAttribute('src', videoSrc);

        if (videoSrc) {
        cache.archiveVideo.muted = true;
        cache.archiveVideo.setAttribute('muted', '');
        cache.archiveVideo.setAttribute('playsinline', '');
        cache.archiveVideo.load();
    }
    }
    }

        if (staggerSideVideos) {
        cache.sideVideos.forEach((video, idx) => {
        const staggerDelay = idx * ProjectApp.archivePageModule.config.SIDE_VIDEO_STAGGER_DELAY;

        const timeoutId = setTimeout(() => {
        const source = video.querySelector('source');
        if (source) {
        video.pause();
        source.setAttribute('src', videoSrc);

        if (videoSrc) {
        video.muted = true;
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.load();
    }
    }
    }, staggerDelay);

        ProjectApp.archivePageModule.state.videoTimeouts.push(timeoutId);
    });
    } else {
        cache.sideVideos.forEach((video) => {
        const source = video.querySelector('source');
        if (source) {
        video.pause();
        source.setAttribute('src', videoSrc);

        if (videoSrc) {
        video.muted = true;
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.load();
    }
    }
    });
    }
    };

        if (clearFirst) {
        this.clearAllVideos();
        setTimeout(updateVideos, 50);
    } else if (delay > 0) {
        setTimeout(updateVideos, delay);
    } else {
        updateVideos();
    }
    },

        clearAllVideos() {
        const cache = ProjectApp.archivePageModule.state.cachedElements;

        if (cache.archiveVideo) {
        const source = cache.archiveVideo.querySelector('source');
        if (source) {
        cache.archiveVideo.pause();
        source.setAttribute('src', '');
        cache.archiveVideo.load();
    }
    }

        cache.sideVideos.forEach(video => {
        const source = video.querySelector('source');
        if (source) {
        video.pause();
        source.setAttribute('src', '');
        video.load();
    }
    });
    },

        initializeAllVideos() {
        const allVideos = document.querySelectorAll('video');
        allVideos.forEach(video => {
        video.muted = true;
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.removeAttribute('autoplay');
        video.pause();
        video.currentTime = 0;
    });
    },

        fadeOutVideosWithCascade(callback) {
        const cache = ProjectApp.archivePageModule.state.cachedElements;
        const config = ProjectApp.archivePageModule.config;

        cache.sideVideos.forEach((sideVideo, idx) => {
        setTimeout(() => {
        gsap.set(sideVideo, { opacity: 0 });
    }, idx * config.SIDE_VIDEO_STAGGER_DELAY);
    });

        if (cache.archiveVideo) {
        gsap.set(cache.archiveVideo, { opacity: 0 });
    }

        const totalDelay = (cache.sideVideos.length - 1) * config.SIDE_VIDEO_STAGGER_DELAY;
        setTimeout(callback, totalDelay + 50);
    }
    },

        wrapTextElement(textEl) {
        if (!textEl.parentElement.classList.contains('text-wrapper')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'text-wrapper';
        wrapper.style.overflow = 'hidden';
        textEl.parentNode.insertBefore(wrapper, textEl);
        wrapper.appendChild(textEl);
    }
    },

        clearTimeouts() {
        if (ProjectApp.archivePageModule.state.videoTimeouts.length) {
        ProjectApp.archivePageModule.state.videoTimeouts.forEach(timeout => clearTimeout(timeout));
        ProjectApp.archivePageModule.state.videoTimeouts = [];
    }
    }
    },

        nameBlockTrimming: {
        init() {
        const cache = ProjectApp.archivePageModule.state.cachedElements;
        if (!cache.archiveCollection) return;

        const nameBlocks = cache.archiveCollection.querySelectorAll('.name-block.has--no-padding');
        const maxChars = ProjectApp.archivePageModule.config.NAME_BLOCK_MAX_CHARS;

        nameBlocks.forEach(block => {
        const nameElements = block.querySelectorAll('.name-medium');

        if (nameElements.length < 2) return;

        let totalChars = 0;
        nameElements.forEach(el => {
        totalChars += el.textContent.trim().length;
    });

        if (totalChars > maxChars && nameElements.length >= 2) {
        if (nameElements[1]) nameElements[1].remove();
        if (nameElements[2]) nameElements[2].remove();
    }
    });
    },

        cleanup() {}
    },

        archiveList: {
        initInfiniteScroll: function() {
        if (ProjectApp.archivePageModule.state.archiveScrollInitialized) return;

        const cache = ProjectApp.archivePageModule.state.cachedElements;
        const { archiveCollection, archiveList } = cache;

        if (!archiveCollection || !archiveList) return;

        const archiveItems = Array.from(archiveCollection.querySelectorAll('.archive-item'));
        const total = archiveItems.length;

        if (total === 0) {
        ProjectApp.archivePageModule.state.archiveScrollInitialized = true;
        return;
    }

        if (!archiveItems[0]) return;

        archiveItems[0].offsetHeight;
        const itemHeight = archiveItems[0].getBoundingClientRect().height;

        if (itemHeight <= 10) {
        return requestAnimationFrame(() => {
        ProjectApp.archivePageModule.archiveList.initInfiniteScroll();
    });
    }

        archiveList.style.height = 'calc(100vh - 7.8vw)';
        archiveList.style.overflowY = 'auto';
        archiveList.style.position = 'relative';
        archiveList.style.webkitOverflowScrolling = 'touch';

        ProjectApp.archivePageModule.archiveList.buildVirtual(itemHeight, archiveItems, archiveList);
    },

        initArchiveVideoHover: function() {
        const state = ProjectApp.archivePageModule.state;

        if (state.archiveVideoHoverListeners.length) {
        state.archiveVideoHoverListeners.forEach(({element, handler}) => {
        try {
        element.removeEventListener('mouseenter', handler);
        element.removeEventListener('mouseleave', handler);
    } catch(e) {}
    });
        state.archiveVideoHoverListeners = [];
    }

        const archiveScrollVideos = document.querySelectorAll('.archive-scroll-video');
        const cache = ProjectApp.archivePageModule.state.cachedElements;

        if (!cache.archiveVideo) return;

        archiveScrollVideos.forEach(scrollVideo => {
        const handleMouseEnter = function() {
        const videoSrc = this.getAttribute('src') || this.querySelector('source')?.getAttribute('src');
        if (videoSrc) {
        ProjectApp.archivePageModule.helpers.videoHelpers.setVideoSource(videoSrc);
    }
    };

        const handleMouseLeave = function() {
        ProjectApp.archivePageModule.helpers.videoHelpers.clearAllVideos();
    };

        scrollVideo.addEventListener('mouseenter', handleMouseEnter);
        scrollVideo.addEventListener('mouseleave', handleMouseLeave);

        state.archiveVideoHoverListeners.push({
        element: scrollVideo,
        handler: handleMouseEnter
    });
        state.archiveVideoHoverListeners.push({
        element: scrollVideo,
        handler: handleMouseLeave
    });
    });
    },

        cleanupInfiniteScroll: function() {
        const cache = ProjectApp.archivePageModule.state.cachedElements;
        const state = ProjectApp.archivePageModule.state;

        if (cache.archiveList && state.archiveScrollListener) {
        cache.archiveList.removeEventListener('scroll', state.archiveScrollListener);
        cache.archiveList.innerHTML = '';
        cache.archiveList.style.height = '';
        cache.archiveList.style.overflowY = '';
        cache.archiveList.style.position = '';
    }

        if (state.videoHoverListeners.length) {
        state.videoHoverListeners.forEach(({element, handler}) => {
        try {
        element.removeEventListener('mouseenter', handler);
        element.removeEventListener('mouseleave', handler);
    } catch(e) {}
    });
        state.videoHoverListeners = [];
    }

        state.archiveScrollInitialized = false;
        state.archiveScrollListener = null;
    },

        buildVirtual: function(itemHeight, archiveItems, archiveList) {
        try {
        archiveList.innerHTML = '';

        archiveList.style.height = 'calc(100vh - 7.8vw)';
        archiveList.style.overflowY = 'scroll';
        archiveList.style.position = 'relative';

        const sentinelTop = document.createElement('div');
        sentinelTop.className = 'virtual-sentinel';
        sentinelTop.style.height = (archiveItems.length * itemHeight * 100) + 'px';
        sentinelTop.style.position = 'absolute';
        sentinelTop.style.top = '0';
        sentinelTop.style.left = '0';
        sentinelTop.style.right = '0';
        sentinelTop.style.pointerEvents = 'none';
        archiveList.appendChild(sentinelTop);

        const config = ProjectApp.archivePageModule.config;
        const state = ProjectApp.archivePageModule.state;
        const cache = state.cachedElements;
        const bufferSize = config.INFINITE_SCROLL_BUFFER;
        let offset = 0;
        const itemPool = new Map();

        function getItem(index) {
        const N = archiveItems.length;
        const sourceIndex = ((index % N) + N) % N;
        if (itemPool.has(index)) return itemPool.get(index);

        const clone = archiveItems[sourceIndex].cloneNode(true);
        clone.style.position = 'absolute';
        clone.style.width = '100%';
        clone.style.left = '0';
        clone.dataset.index = String(index);

        const textElements = clone.querySelectorAll('.text-mono, .name-medium');
        textElements.forEach(textEl => {
        ProjectApp.archivePageModule.helpers.wrapTextElement(textEl);
        gsap.set(textEl, { y: '0%' });
    });

        const indexElement = clone.querySelector('[archive-index]');
        if (indexElement) {
        const displayIndex = sourceIndex + 1;
        indexElement.textContent = displayIndex < 10 ? `0${displayIndex}.` : `${displayIndex}.`;
    }

        const videoLink = clone.querySelector('.video-link');
        if (videoLink) {
        const handleMouseEnter = function() {
        const videoSrc = videoLink.getAttribute('href');
        if (videoSrc) {
        const cache = ProjectApp.archivePageModule.state.cachedElements;

        if (cache.archiveVideo) {
        const archiveSource = cache.archiveVideo.querySelector('source');
        if (archiveSource) {
        cache.archiveVideo.pause();
        archiveSource.setAttribute('src', videoSrc);
        cache.archiveVideo.load();

        cache.archiveVideo.addEventListener('canplay', function playHandler() {
        cache.archiveVideo.play().catch(() => {});
        cache.archiveVideo.removeEventListener('canplay', playHandler);
    }, { once: true });
    }
    }

        cache.sideVideos.forEach((sideVideo, vidIdx) => {
        const timeoutId = setTimeout(() => {
        const sourceEl = sideVideo.querySelector('source');
        if (sourceEl) {
        sideVideo.pause();
        sourceEl.setAttribute('src', videoSrc);
        sideVideo.load();

        sideVideo.addEventListener('canplay', function playHandler() {
        sideVideo.play().catch(() => {});
        sideVideo.removeEventListener('canplay', playHandler);
    }, { once: true });
    }
    }, vidIdx * config.SIDE_VIDEO_STAGGER_DELAY);

        state.videoTimeouts.push(timeoutId);
    });
    }
    };

        const handleMouseLeave = function() {
        const cache = ProjectApp.archivePageModule.state.cachedElements;

        if (cache.archiveVideo) {
        const archiveSource = cache.archiveVideo.querySelector('source');
        if (archiveSource) {
        cache.archiveVideo.pause();
        archiveSource.setAttribute('src', config.DEFAULT_VIDEO_SRC);
        cache.archiveVideo.load();

        cache.archiveVideo.addEventListener('canplay', function playHandler() {
        cache.archiveVideo.play().catch(() => {});
        cache.archiveVideo.removeEventListener('canplay', playHandler);
    }, { once: true });
    }
    }

        cache.sideVideos.forEach((sideVideo, vidIdx) => {
        const timeoutId = setTimeout(() => {
        const sourceEl = sideVideo.querySelector('source');
        if (sourceEl) {
        sideVideo.pause();
        sourceEl.setAttribute('src', config.DEFAULT_VIDEO_SRC);
        sideVideo.load();

        sideVideo.addEventListener('canplay', function playHandler() {
        sideVideo.play().catch(() => {});
        sideVideo.removeEventListener('canplay', playHandler);
    }, { once: true });
    }
    }, vidIdx * config.SIDE_VIDEO_STAGGER_DELAY);

        state.videoTimeouts.push(timeoutId);
    });
    };

        clone.addEventListener('mouseenter', handleMouseEnter);
        clone.addEventListener('mouseleave', handleMouseLeave);

        state.videoHoverListeners.push(
    { element: clone, handler: handleMouseEnter },
    { element: clone, handler: handleMouseLeave }
        );
    }

        itemPool.set(index, clone);
        return clone;
    }

        function updateVisible() {
        const containerH = archiveList.clientHeight || window.innerHeight;
        const scrollTop = archiveList.scrollTop;
        const adjusted = scrollTop + (offset * itemHeight);
        const startIndex = Math.floor(adjusted / itemHeight) - bufferSize;
        const endIndex = Math.ceil((adjusted + containerH) / itemHeight) + bufferSize;
        const active = new Set();

        for (let i = startIndex; i <= endIndex; i++) {
        active.add(i);
        const node = getItem(i);
        const wasNew = !node.parentElement;
        if (wasNew) {
        archiveList.appendChild(node);
        const textElements = node.querySelectorAll('.text-mono, .name-medium');
        textElements.forEach((textEl, idx) => {
        gsap.fromTo(textEl,
    { y: '110%' },
    {
        y: '0%',
        duration: config.TEXT_ANIMATION_DURATION,
        ease: 'power3.out',
        delay: idx * 0.02
    }
        );
    });
    }
        node.style.top = ((i - offset) * itemHeight) + 'px';
    }

        Array.from(archiveList.children).forEach(child => {
        if (child.classList.contains('virtual-sentinel')) return;
        const idx = parseInt(child.dataset?.index, 10);
        if (!isNaN(idx) && !active.has(idx)) {
        child.remove();
    }
    });
    }

        archiveList.scrollTop = 0;
        state.archiveScrollListener = updateVisible;
        archiveList.addEventListener('scroll', state.archiveScrollListener);
        updateVisible();
        state.archiveScrollInitialized = true;
    } catch (error) {
        console.error('Error building virtual scroll:', error);
    }
    }
    },

        viewSwitcher: {
        async switchView(mode) {
        const state = ProjectApp.archivePageModule.state;
        const cache = state.cachedElements;
        const config = ProjectApp.archivePageModule.config;

        if (mode === state.currentView) return;

        const backgroundBlock = document.querySelector('.background-block.is--under');
        const hadIsOn = backgroundBlock?.classList.contains('is--on');

        if (hadIsOn && backgroundBlock) {
        backgroundBlock.classList.remove('is--on');
    }

        if (mode === 'list') {
        await this.switchToList(cache, config, backgroundBlock, hadIsOn);
    } else {
        await this.switchToSwiper(cache, config, backgroundBlock, hadIsOn);
    }
    },

        async switchToList(cache, config, backgroundBlock, hadIsOn) {
        const marqueePart1 = document.querySelector('.archive-scroll-container .archive-marquee-part:first-child');
        const marqueePart2 = document.querySelector('.archive-scroll-container .archive-marquee-part:last-child');
        const archiveItems = document.querySelectorAll('.archive-item');

        archiveItems.forEach(item => {
        const textElements = item.querySelectorAll('.text-mono, .name-medium');
        textElements.forEach(textEl => {
        ProjectApp.archivePageModule.helpers.wrapTextElement(textEl);
        gsap.set(textEl, { y: '110%' });
    });
    });

        if (marqueePart1 || marqueePart2) {
        const tl = gsap.timeline({
        onStart: () => {
        ProjectApp.archivePageModule.helpers.videoHelpers.clearAllVideos();
    },
        onComplete: () => {
        this.completeListSwitch(cache, config, backgroundBlock, hadIsOn, archiveItems);
    }
    });

        const scroll2Videos = document.querySelectorAll('.archive-scroll-wrapper.scroll-2 .archive-scroll-video');
        scroll2Videos.forEach(video => {
        tl.to(video, { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.2, ease: 'power2.inOut' }, 0);
    });

        const scroll1Videos = document.querySelectorAll('.archive-scroll-wrapper.scroll-1 .archive-scroll-video');
        scroll1Videos.forEach(video => {
        tl.to(video, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.2, ease: 'power2.inOut' }, 0);
    });
    } else {
        this.completeListSwitch(cache, config, backgroundBlock, hadIsOn, archiveItems);
    }
    },

        completeListSwitch(cache, config, backgroundBlock, hadIsOn, archiveItems) {
        if (cache.scrollContainer) cache.scrollContainer.classList.add('is--hidden');
        if (cache.archiveContainer) cache.archiveContainer.classList.remove('is--hidden');

        if (!ProjectApp.archivePageModule.state.archiveScrollInitialized) {
        setTimeout(() => {
        ProjectApp.archivePageModule.archiveList.initInfiniteScroll();
    }, 50);
    }

        ProjectApp.archivePageModule.state.currentView = 'list';

        setTimeout(() => {
        if (cache.archiveVideo) {
        const archiveSource = cache.archiveVideo.querySelector('source');
        if (archiveSource) {
        cache.archiveVideo.pause();
        archiveSource.setAttribute('src', config.DEFAULT_VIDEO_SRC);
        cache.archiveVideo.load();

        cache.archiveVideo.addEventListener('canplay', function playHandler() {
        cache.archiveVideo.play().catch(() => {});
        cache.archiveVideo.removeEventListener('canplay', playHandler);
    }, { once: true });
    }
    }

        cache.sideVideos.forEach((sideVideo, idx) => {
        const timeoutId = setTimeout(() => {
        const sourceEl = sideVideo.querySelector('source');
        if (sourceEl) {
        sideVideo.pause();
        sourceEl.setAttribute('src', config.DEFAULT_VIDEO_SRC);
        sideVideo.load();

        sideVideo.addEventListener('canplay', function playHandler() {
        sideVideo.play().catch(() => {});
        sideVideo.removeEventListener('canplay', playHandler);
    }, { once: true });
    }
    }, idx * config.SIDE_VIDEO_STAGGER_DELAY);

        ProjectApp.archivePageModule.state.videoTimeouts.push(timeoutId);
    });
    }, config.VIDEO_LOAD_DELAY);

        if (hadIsOn && backgroundBlock) {
        backgroundBlock.classList.add('is--on');
    }

        const listTl = gsap.timeline();
        archiveItems.forEach((item, itemIdx) => {
        const textElements = item.querySelectorAll('.text-mono, .name-medium');
        textElements.forEach((textEl) => {
        listTl.to(textEl, {
        y: '0%',
        duration: config.TEXT_ANIMATION_DURATION,
        ease: 'power3.out'
    }, itemIdx * config.TEXT_ANIMATION_STAGGER);
    });
    });
    },

        async switchToSwiper(cache, config, backgroundBlock, hadIsOn) {
        const archiveItems = document.querySelectorAll('.archive-item');

        if (archiveItems.length > 0) {
        const tl = gsap.timeline({
        onComplete: () => {
        ProjectApp.archivePageModule.helpers.videoHelpers.fadeOutVideosWithCascade(() => {
        setTimeout(() => {
        this.completeSwiperSwitch(cache, config, backgroundBlock, hadIsOn);
    }, config.SWIPER_REVEAL_DELAY);
    });
    }
    });

        archiveItems.forEach((item, itemIdx) => {
        const textElements = item.querySelectorAll('.text-mono, .name-medium');
        textElements.forEach((textEl) => {
        tl.to(textEl, {
        y: '110%',
        duration: config.TEXT_ANIMATION_OUT_DURATION,
        ease: 'power3.in'
    }, itemIdx * config.TEXT_ANIMATION_OUT_STAGGER);
    });
    });
    } else {
        this.completeSwiperSwitch(cache, config, backgroundBlock, hadIsOn);
    }
    },

        completeSwiperSwitch(cache, config, backgroundBlock, hadIsOn) {
        if (cache.archiveContainer) cache.archiveContainer.classList.add('is--hidden');
        if (cache.scrollContainer) cache.scrollContainer.classList.remove('is--hidden');

        ProjectApp.archivePageModule.state.currentView = 'swiper';

        ProjectApp.archivePageModule.helpers.videoHelpers.clearAllVideos();

        if (hadIsOn && backgroundBlock) {
        setTimeout(() => {
        backgroundBlock.classList.add('is--on');
    }, config.BACKGROUND_RESTORE_DELAY);
    }

        const swiperTl = gsap.timeline();

        const scroll1Videos = document.querySelectorAll('.archive-scroll-wrapper.scroll-1 .archive-scroll-video');
        scroll1Videos.forEach(video => {
        swiperTl.to(video, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power2.inOut' }, 0);
    });

        const scroll2Videos = document.querySelectorAll('.archive-scroll-wrapper.scroll-2 .archive-scroll-video');
        scroll2Videos.forEach(video => {
        swiperTl.to(video, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power2.inOut' }, 0);
    });

        const allVideos = [...cache.sideVideos];
        if (cache.archiveVideo) allVideos.push(cache.archiveVideo);

        allVideos.forEach(video => {
        gsap.set(video, { opacity: 1 });
    });
    },

        initSwitchAnimation() {
        ProjectApp.archivePageModule.viewSwitcher.cleanupSwitchAnimation();

        const archiveItems = document.querySelectorAll('.archive-item');
        archiveItems.forEach((item) => {
        const textElements = item.querySelectorAll('.text-mono, .name-medium');
        textElements.forEach((textEl) => {
        ProjectApp.archivePageModule.helpers.wrapTextElement(textEl);
        gsap.set(textEl, { y: '110%' });
    });
    });

        const allVideos = document.querySelectorAll('.archive-scroll-video');
        allVideos.forEach(video => {
        gsap.set(video, { clipPath: 'inset(0% 0% 0% 0%)' });
    });

        const state = ProjectApp.archivePageModule.state;
        state.switchAnim = {
        listeners: [],
        optionBlocks: Array.from(document.querySelectorAll('.option-item-archive'))
    };

        state.switchAnim.optionBlocks.forEach((opt) => {
        const onOptionClick = () => {
        if (!opt.classList.contains('is--active')) {
        state.switchAnim.optionBlocks.forEach(b => b.classList.remove('is--active'));
        opt.classList.add('is--active');

        if (opt.hasAttribute('data-list')) {
        ProjectApp.archivePageModule.viewSwitcher.switchView('list');
    } else if (opt.hasAttribute('data-swiper')) {
        ProjectApp.archivePageModule.viewSwitcher.switchView('swiper');
    }
    }
    };
        this.addTrackedListener(opt, 'click', onOptionClick);
    });
    },

        cleanupSwitchAnimation() {
        const state = ProjectApp.archivePageModule.state;
        if (state.switchAnim?.listeners) {
        state.switchAnim.listeners.forEach(({target, type, handler, options}) => {
        try { target.removeEventListener(type, handler, options); } catch(e) {}
    });
        state.switchAnim.listeners = [];
    }
    },

        addTrackedListener(target, type, handler, options) {
        const state = ProjectApp.archivePageModule.state;
        if (!state.switchAnim) {
        state.switchAnim = { listeners: [] };
    }
        target.addEventListener(type, handler, options || false);
        state.switchAnim.listeners.push({ target, type, handler, options: options || false });
    }
    },

        marquee: {
        videoManager: {
        activeVideos: new Set(),
        maxActiveVideos: 12,
        videoStates: new WeakMap(),
    },

        initInfinite(wrapper, direction = 1) {
        const originalBlock = wrapper.querySelector('.archive-scroll-part');
        if (!originalBlock) return;

        const config = ProjectApp.archivePageModule.config;
        let totalHeight;
        let marqueeTween;
        let isHovered = false;
        let scrollTimeout = null;

        const marqueeObj = this;

        for (let i = 0; i < config.MARQUEE_REPEAT_TIMES; i++) {
        const clone = originalBlock.cloneNode(true);
        wrapper.appendChild(clone);
    }

        const allMarqueeVideos = wrapper.querySelectorAll('video');
        allMarqueeVideos.forEach(video => {
        video.muted = true;
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.removeAttribute('autoplay');
        video.pause();
        video.currentTime = 0;
    });

        const updateVideoPlayback = () => {
        const viewportHeight = window.innerHeight;
        const allVideos = wrapper.querySelectorAll('.archive-scroll-video');

        const topBoundary = -200;
        const bottomBoundary = viewportHeight + 200;

        allVideos.forEach(video => {
        const videoRect = video.getBoundingClientRect();

        const isInView = (
        videoRect.bottom > topBoundary &&
        videoRect.top < bottomBoundary &&
        videoRect.left > -100 &&
        videoRect.right < window.innerWidth + 100
        );

        const videoState = marqueeObj.videoManager.videoStates.get(video) || { playing: false };

        if (!isInView && videoState.playing) {
        video.pause();
        videoState.playing = false;
        marqueeObj.videoManager.activeVideos.delete(video);
    }

        marqueeObj.videoManager.videoStates.set(video, videoState);
    });

        if (marqueeObj.videoManager.activeVideos.size > config.MAX_ACTIVE_VIDEOS) {
        const videosArray = Array.from(marqueeObj.videoManager.activeVideos);

        videosArray.sort((a, b) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        const viewportCenter = viewportHeight / 2;

        const aCenter = aRect.top + (aRect.height / 2);
        const bCenter = bRect.top + (bRect.height / 2);

        const aDistance = Math.abs(aCenter - viewportCenter);
        const bDistance = Math.abs(bCenter - viewportCenter);

        return bDistance - aDistance;
    });

        while (marqueeObj.videoManager.activeVideos.size > config.MAX_ACTIVE_VIDEOS) {
        const video = videosArray.pop();
        if (video) {
        video.pause();
        const videoState = marqueeObj.videoManager.videoStates.get(video);
        if (videoState) {
        videoState.playing = false;
        marqueeObj.videoManager.videoStates.set(video, videoState);
    }
        marqueeObj.videoManager.activeVideos.delete(video);
    }
    }
    }
    };

        const createAnimation = (startY) => {
        let frameCount = 0;
        const tween = direction === 1
        ? gsap.to(wrapper, {
        y: startY - totalHeight,
        duration: config.MARQUEE_DURATION,
        ease: 'none',
        repeat: -1,
        onUpdate: function() {
        frameCount++;
        if (frameCount % config.VIDEO_UPDATE_FREQUENCY === 0) {
        updateVideoPlayback();
    }
    },
        modifiers: {
        y: gsap.utils.unitize(y => gsap.utils.wrap(-totalHeight, 0, parseFloat(y)))
    }
    })
        : gsap.to(wrapper, {
        y: startY + totalHeight,
        duration: config.MARQUEE_DURATION,
        ease: 'none',
        repeat: -1,
        onUpdate: function() {
        frameCount++;
        if (frameCount % config.VIDEO_UPDATE_FREQUENCY === 0) {
        updateVideoPlayback();
    }
    },
        modifiers: {
        y: gsap.utils.unitize(y => gsap.utils.wrap(-totalHeight, 0, parseFloat(y)))
    }
    });

        return tween;
    };

        const setup = () => {
        wrapper.offsetHeight;
        totalHeight = originalBlock.offsetHeight;

        if (direction === 1) {
        gsap.set(wrapper, { y: 0 });
        marqueeTween = createAnimation(0);
    } else {
        gsap.set(wrapper, { y: -totalHeight });
        marqueeTween = createAnimation(-totalHeight);
    }

        updateVideoPlayback();

        const draggable = Draggable.create(wrapper, {
        type: 'y',
        inertia: true,
        trigger: wrapper,
        throwProps: true,
        maxDuration: 1,
        minDuration: 0.5,
        overshootTolerance: 0,
        onPress: function() {
        if (marqueeTween) marqueeTween.kill();
    },
        onDrag: function() {
        this.y = gsap.utils.wrap(-totalHeight, 0, this.y);
        gsap.set(wrapper, { y: this.y });
        updateVideoPlayback();
    },
        onThrowUpdate: function() {
        this.y = gsap.utils.wrap(-totalHeight, 0, this.y);
        gsap.set(wrapper, { y: this.y });
        updateVideoPlayback();
    },
        onThrowComplete: function() {
        if (!isHovered) {
        const currentY = gsap.getProperty(wrapper, 'y');
        marqueeTween = createAnimation(currentY);
    }
        updateVideoPlayback();
    }
    });

        const handleMouseEnter = () => {
        isHovered = true;
        if (marqueeTween) marqueeTween.pause();
    };

        const handleMouseLeave = () => {
        isHovered = false;
        if (marqueeTween && !marqueeTween.isActive()) {
        marqueeTween.play();
    }
    };

        const handleScroll = (e) => {
        e.preventDefault();

        if (scrollTimeout) clearTimeout(scrollTimeout);
        if (marqueeTween) marqueeTween.kill();

        const currentY = gsap.getProperty(wrapper, 'y');
        const scrollDelta = e.deltaY || e.detail || (e.wheelDelta * -1);

        const scrollMultiplier = 0.5;
        let newY = direction === 1
        ? currentY - (scrollDelta * scrollMultiplier)
        : currentY + (scrollDelta * scrollMultiplier);

        newY = gsap.utils.wrap(-totalHeight, 0, newY);

        gsap.to(wrapper, {
        y: newY,
        duration: 0.3,
        ease: 'power2.out',
        onUpdate: updateVideoPlayback
    });

        scrollTimeout = setTimeout(() => {
        if (!isHovered) {
        const currentY = gsap.getProperty(wrapper, 'y');
        marqueeTween = createAnimation(currentY);
    }
    }, 250);
    };

        wrapper.addEventListener('mouseenter', handleMouseEnter);
        wrapper.addEventListener('mouseleave', handleMouseLeave);

        const cache = ProjectApp.archivePageModule.state.cachedElements;

        if (cache.scrollContainer) {
        cache.scrollContainer.addEventListener('wheel', handleScroll, { passive: false });
        cache.scrollContainer.addEventListener('mousewheel', handleScroll, { passive: false });
        cache.scrollContainer.addEventListener('DOMMouseScroll', handleScroll, { passive: false });
    }

        let resizeTimeout;
        window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateVideoPlayback, 100);
    });

        const state = ProjectApp.archivePageModule.state;
        state.draggables.push(...draggable);
        state.marqueeAnimations.push(marqueeTween);

        state.marqueeScrollListeners.push({
        handleScroll,
        handleMouseEnter,
        handleMouseLeave,
        wrapper,
        scrollContainer: cache.scrollContainer,
        updateVideoPlayback
    });
    };

        setTimeout(setup, 100);
    },

        init() {
        if (typeof gsap === 'undefined' || typeof Draggable === 'undefined') return;

        const wrapper1 = document.querySelector('.archive-scroll-wrapper.scroll-1');
        const wrapper2 = document.querySelector('.archive-scroll-wrapper.scroll-2');

        if (wrapper1) this.initInfinite(wrapper1, 1);
        if (wrapper2) this.initInfinite(wrapper2, -1);
    },

        cleanup() {
        this.videoManager.activeVideos.forEach(video => {
        video.pause();
        video.currentTime = 0;
    });
        this.videoManager.activeVideos.clear();
        this.videoManager.videoStates = new WeakMap();

        const state = ProjectApp.archivePageModule.state;

        state.marqueeAnimations.forEach(tween => {
        if (tween?.kill) tween.kill();
    });
        state.marqueeAnimations = [];

        state.draggables.forEach(draggable => {
        if (draggable?.[0]?.kill) draggable[0].kill();
    });
        state.draggables = [];

        if (state.marqueeScrollListeners.length) {
        state.marqueeScrollListeners.forEach(({handleScroll, handleMouseEnter, handleMouseLeave, wrapper, scrollContainer}) => {
        try {
        if (scrollContainer) {
        scrollContainer.removeEventListener('wheel', handleScroll);
        scrollContainer.removeEventListener('mousewheel', handleScroll);
        scrollContainer.removeEventListener('DOMMouseScroll', handleScroll);
    }
        wrapper.removeEventListener('mouseenter', handleMouseEnter);
        wrapper.removeEventListener('mouseleave', handleMouseLeave);
    } catch(e) {}
    });
        state.marqueeScrollListeners = [];
    }

        const wrappers = document.querySelectorAll('.archive-scroll-wrapper.scroll-1, .archive-scroll-wrapper.scroll-2');
        wrappers.forEach(wrapper => {
        const blocks = wrapper.querySelectorAll('.archive-scroll-part');
        for (let i = blocks.length - 1; i > 0; i--) {
        blocks[i].remove();
    }
        gsap.set(wrapper, { y: 0, clearProps: 'all' });
    });
    }
    },

        textStyling: {
        italicizeFirstLetters(selectors, opts) {
        const options = Object.assign({ lettersOnly: true }, opts || {});
        const targets = Array.isArray(selectors) ? selectors : [selectors];

        targets.forEach(function (selector) {
        document.querySelectorAll(selector).forEach(function (rootEl) {
        const alreadySplit = rootEl.querySelector('.word') && rootEl.querySelector('.char');
        const instance = alreadySplit ? null : new SplitType(rootEl, { types: 'lines, words, chars', tagName: 'span' });
        const wordEls = Array.from(rootEl.querySelectorAll('.word'));

        wordEls.forEach(function (word) {
        let firstCharEl = null;
        if (options.lettersOnly) {
        const chars = word.querySelectorAll('.char');
        for (let i = 0; i < chars.length; i++) {
        const c = chars[i].textContent || '';
        if (/[A-Za-zÀ-ÖØ-öø-ÿĀ-žА-Яа-яЇїІіЄєҐґ]/.test(c)) {
        firstCharEl = chars[i];
        break;
    }
    }
        if (!firstCharEl && chars.length) firstCharEl = chars[0];
    } else {
        firstCharEl = word.querySelector('.char');
    }
        if (firstCharEl) firstCharEl.classList.add('has--style-italic');
    });

        const lines = rootEl.querySelectorAll('.line');
        lines.forEach(function(line) {
        ProjectApp.archivePageModule.helpers.wrapTextElement(line);
    });
    });
    });
    },

        applyLetterPadding() {
        const charElements = document.querySelectorAll('.name-large .line-wrapper .line .word .char.has--style-italic, .name-medium .line-wrapper .line .word .char.has--style-italic');
        const cfg = ProjectApp.archivePageModule.config.textStyling;

        charElements.forEach(element => {
        const letter = element.textContent.trim();

        element.style.paddingLeft = '';
        element.style.paddingRight = '';
        element.style.marginLeft = '';
        element.style.marginRight = '';

        if (cfg.leftPaddingLetters.includes(letter)) {
        element.style.paddingLeft = cfg.leftPaddingValue;
    }

        if (cfg.mediumPaddingLetters.includes(letter)) {
        element.style.paddingLeft = cfg.mediumPaddingValue;
    }

        if (cfg.largePaddingLetters.includes(letter)) {
        element.style.paddingLeft = cfg.largePaddingValue;
    }
    });
    },

        init() {
        if (typeof SplitType === 'undefined') return;
        this.italicizeFirstLetters(['.name-large', '.name-medium'], { lettersOnly: true });
        this.applyLetterPadding();
    },

        cleanup() {
        const charElements = document.querySelectorAll('.name-large .char.has--style-italic, .name-medium .char.has--style-italic');
        charElements.forEach(element => {
        element.style.paddingLeft = '';
        element.style.paddingRight = '';
        element.style.marginLeft = '';
        element.style.marginRight = '';
        element.classList.remove('has--style-italic');
    });
    }
    },

        indexing: {
        init() {
        const scrollParts = document.querySelectorAll('.archive-scroll-part');
        scrollParts.forEach(part => {
        let indexCounter = 1;
        const archiveBlocks = part.querySelectorAll('.archive-scroll-block');

        archiveBlocks.forEach(block => {
        const indexElement = block.querySelector('[archive-index]');
        if (indexElement) {
        const formattedIndex = indexCounter < 10 ? '0' + indexCounter : '' + indexCounter;
        indexElement.textContent = formattedIndex + '.';
        indexCounter++;
    }
    });
    });
    },

        cleanup() {
        const indexElements = document.querySelectorAll('[archive-index]');
        indexElements.forEach(el => {
        el.textContent = '00.';
    });
    }
    },

        textAnimation: {
        init() {
        if (typeof SplitType === 'undefined' || typeof gsap === 'undefined') return;

        const textBlocks = document.querySelectorAll('.archive-text-block');
        const config = ProjectApp.archivePageModule.config;

        textBlocks.forEach(textBlock => {
        let firstH2InBlock = false;

        const scroll2Wrapper = textBlock.closest('.archive-scroll-wrapper.scroll-2');
        const isScroll2 = !!scroll2Wrapper;
        const initialY = isScroll2 ? '110%' : '-110%';
        const animateToY = '0%';
        const animateBackY = isScroll2 ? '110%' : '-110%';

        const elementsToSplit = textBlock.querySelectorAll('[class*="text-"]:not(.name-block):not(.text-small), h2.name-large, .text-abs');
        const textSmallElements = textBlock.querySelectorAll('.text-small');

        textSmallElements.forEach(el => {
        gsap.set(el, { y: initialY });
    });

        if (!elementsToSplit.length && !textSmallElements.length) return;

        elementsToSplit.forEach(el => {
        if (el.tagName === 'H2' && el.classList.contains('name-large')) {
        if (!firstH2InBlock) {
        const lines = el.querySelectorAll('.line');
        if (lines.length > 0) {
        const lastLine = lines[lines.length - 1];
        lastLine.appendChild(document.createTextNode(': '));
    }
        firstH2InBlock = true;
    }

        const lines = el.querySelectorAll('.line');
        lines.forEach(line => {
        ProjectApp.archivePageModule.helpers.wrapTextElement(line);
        gsap.set(line, { y: initialY });
    });

        return;
    }

        const split = new SplitType(el, {
        types: 'lines',
        tagName: 'span',
        lineClass: 'line'
    });

        const lines = el.querySelectorAll('.line');
        lines.forEach(line => {
        ProjectApp.archivePageModule.helpers.wrapTextElement(line);
        gsap.set(line, { y: initialY });
    });

        ProjectApp.archivePageModule.state.splitInstances.push(split);
    });

        const videoElement = textBlock.closest('.archive-scroll-block')?.querySelector('.archive-scroll-video');
        if (!videoElement) return;

        const allLines = textBlock.querySelectorAll('.line');
        const allTextSmall = Array.from(textSmallElements);
        const allAnimatableElements = [...allLines, ...allTextSmall];

        if (allAnimatableElements.length === 0) return;

        let animationTimeline = null;

        const handleVideoEnter = () => {
        if (animationTimeline) animationTimeline.kill();

        if (videoElement) {
        videoElement.muted = true;
        videoElement.play().catch(() => {});
    }

        animationTimeline = gsap.timeline();

        allAnimatableElements.forEach((element, index) => {
        animationTimeline.to(element, {
        y: animateToY,
        duration: config.TEXT_ANIMATION_DURATION,
        ease: 'power3.out'
    }, index * config.TEXT_ANIMATION_STAGGER);
    });
    };

        const handleVideoLeave = () => {
        if (animationTimeline) animationTimeline.kill();

        if (videoElement) {
        videoElement.pause();
    }

        animationTimeline = gsap.timeline();

        allAnimatableElements.forEach((element, index) => {
        animationTimeline.to(element, {
        y: animateBackY,
        duration: config.TEXT_ANIMATION_DURATION,
        ease: 'power3.out'
    }, index * config.TEXT_ANIMATION_STAGGER);
    });
    };

        const scrollBlock = textBlock.closest('.archive-scroll-block');
        if (scrollBlock) {
        scrollBlock.addEventListener('mouseenter', handleVideoEnter);
        scrollBlock.addEventListener('mouseleave', handleVideoLeave);

        ProjectApp.archivePageModule.state.textAnimations.push({
        textBlock,
        videoElement,
        scrollBlock,
        handleVideoEnter,
        handleVideoLeave,
        animationTimeline
    });
    }
    });
    },

        cleanup() {
        ProjectApp.archivePageModule.state.textAnimations.forEach(animation => {
        try {
        animation.scrollBlock.removeEventListener('mouseenter', animation.handleVideoEnter);
        animation.scrollBlock.removeEventListener('mouseleave', animation.handleVideoLeave);
    } catch (e) {}

        if (animation.animationTimeline) {
        animation.animationTimeline.kill();
    }
    });
        ProjectApp.archivePageModule.state.textAnimations = [];

        ProjectApp.archivePageModule.state.splitInstances.forEach(split => {
        try {
        split.revert?.();
    } catch (e) {}
    });
        ProjectApp.archivePageModule.state.splitInstances = [];
    }
    },

        init() {
        const wrapper1 = document.querySelector('.archive-scroll-wrapper.scroll-1');
        const wrapper2 = document.querySelector('.archive-scroll-wrapper.scroll-2');
        const textBlocks = document.querySelectorAll('.archive-text-block');
        const archiveCollection = document.querySelector('.archive-collection');

        if (!wrapper1 && !wrapper2 && !textBlocks.length && !archiveCollection) {
        return;
    }

        this.cleanup();

        this.helpers.cacheElements();

        this.helpers.videoHelpers.initializeAllVideos();

        this.nameBlockTrimming.init();
        this.marquee.init();
        this.textStyling.init();
        this.textAnimation.init();
        this.indexing.init();
        this.viewSwitcher.initSwitchAnimation();
        this.archiveList.initArchiveVideoHover();

        this.state.archiveMarqueeInitialized = true;
    },

        cleanup() {
        if (this.state.marqueeAnimations.length || this.state.draggables.length) {
        this.marquee.cleanup();
    }

        this.textStyling.cleanup();
        this.textAnimation.cleanup();
        this.archiveList.cleanupInfiniteScroll();
        this.indexing.cleanup();
        this.viewSwitcher.cleanupSwitchAnimation();

        if (this.state.archiveVideoHoverListeners.length) {
        this.state.archiveVideoHoverListeners.forEach(({element, handler}) => {
        try {
        element.removeEventListener('mouseenter', handler);
        element.removeEventListener('mouseleave', handler);
    } catch(e) {}
    });
        this.state.archiveVideoHoverListeners = [];
    }

        this.helpers.clearTimeouts();
        this.helpers.clearElementCache();

        this.state.archiveMarqueeInitialized = false;
    }
    };

    // ============================================
    // SPECIFIC PAGE MODULE
    // ============================================
    ProjectApp.pageSpecificModule = {
        state: {
            truncateResizeHandler: null,
            marqueeAnimations: [],
            draggables: [],
            lenisInstance: null,
            lenisRafId: null,
            scrollTriggers: [],

            awardsScrollHandler: null,
            awardsBoundToLenis: false,

            navbarBoundToLenis: false,
            navbarScrollHandler: null,
            lastScrollY: 0,
            navbarHidden: false,

            visualsBoundToLenis: false,
            visualsScrollHandler: null,

            destinationsScrollTriggers: [],

            horizontalSwiperInstance: null,
            fadeSwiperInstance: null,

            partnersInitialized: false,
            partnersScrollHandler: null,
            partnersBoundToLenis: false,
            partnersAutoplayInterval: null,
            partnersIsHovering: false,
            partnersCurrentImageIndex: -1,
            partnersImages: [],
            partnersWordItems: [],
            partnersEventListeners: [],

            audioInstance: null,
            audioRafId: null,
            audioEventListeners: [],
            audioAllLines: [],
            audioLastUpdateTime: 0,
            audioCachedElements: {
                wrapper: null,
                timeNow: null,
                timeDur: null,
                activeLine: null,
                playPauseBtn: null,
                closeBtn: null,
                bioTrigger: null,
                lineWrap: null
            }
        },

        config: {
            ANIMATION: {
                TEXT_REVEAL_DURATION: 0.8,
                TEXT_REVEAL_STAGGER: 0.08,
                FADE_DURATION: 0.3,
                CLIP_REVEAL_DURATION: 1.5,
                EASE_TEXT: 'power2.out',
                EASE_CLIP: 'power3.out'
            },
            SCROLL: {
                TRIGGER_START: 'top 85%',
                TRIGGER_START_EARLY: 'top 75%',
                VIEWPORT_FADE_IN_THRESHOLD: 0.75,
                VIEWPORT_FADE_OUT_THRESHOLD: 0.5,
                MIN_VISIBLE_PERCENTAGE: 0.15
            },
            PARTNERS: {
                AUTOPLAY_DELAY: 3000,
                SKIP_PHRASES: ['and', '. His fashion editorial films have featured']
            },
            AUDIO: {
                SRC: 'https://18dccfa619686586.cdn.express/jason-bergh/Callum.mp3',
                RAF_UPDATE_THROTTLE: 16
            }
        },

        helpers: {
            formatTime(seconds) {
                if (!isFinite(seconds) || seconds < 0) seconds = 0;
                const m = Math.floor(seconds / 60);
                const s = Math.floor(seconds % 60);
                return `${m}:${s.toString().padStart(2, '0')}`;
            },

            splitAndWrapLines(element, options = {}) {
                const {
                    initialY = '110%',
                    skipIfAlreadySplit = true
                } = options;

                if (skipIfAlreadySplit && element.querySelector('.line')) {
                    return element.querySelectorAll('.line');
                }

                if (typeof SplitType === 'undefined') {
                    console.warn('SplitType not loaded');
                    return [];
                }

                new SplitType(element, {
                    types: 'lines',
                    tagName: 'span',
                    lineClass: 'line'
                });

                const lines = element.querySelectorAll('.line');
                lines.forEach(line => {
                    if (!line.parentElement.classList.contains('overflow-hidden')) {
                        const wrapper = document.createElement('div');
                        wrapper.className = 'overflow-hidden';
                        wrapper.style.overflow = 'hidden';
                        line.parentNode.insertBefore(wrapper, line);
                        wrapper.appendChild(line);
                    }
                });

                if (window.gsap && initialY) {
                    gsap.set(lines, { y: initialY });
                }

                return lines;
            },

            createScrollReveal(element, options = {}) {
                if (typeof ScrollTrigger === 'undefined') return null;

                const config = ProjectApp.pageSpecificModule.config;
                const {
                    start = config.SCROLL.TRIGGER_START,
                    duration = config.ANIMATION.TEXT_REVEAL_DURATION,
                    ease = config.ANIMATION.EASE_TEXT,
                    stagger = config.ANIMATION.TEXT_REVEAL_STAGGER,
                    fromY = '110%',
                    onEnter = null
                } = options;

                return ScrollTrigger.create({
                    trigger: element,
                    start: start,
                    once: true,
                    onEnter: () => {
                        gsap.to(element, {
                            y: '0%',
                            duration: duration,
                            ease: ease,
                            stagger: stagger
                        });
                        if (onEnter) onEnter();
                    }
                });
            },

            throttle(func, delay) {
                let ticking = false;
                return function(...args) {
                    if (!ticking) {
                        requestAnimationFrame(() => {
                            func.apply(this, args);
                            ticking = false;
                        });
                        ticking = true;
                    }
                };
            },

            getViewportVisibility(element) {
                const rect = element.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const visibleTop = Math.max(0, Math.min(rect.bottom, viewportHeight));
                const visibleBottom = Math.max(0, Math.min(viewportHeight - rect.top, viewportHeight));
                const percentInView = rect.height > 0 ? (Math.min(visibleTop, visibleBottom) / rect.height) : 0;

                return {
                    rect,
                    viewportHeight,
                    percentInView,
                    isVisible: percentInView > 0
                };
            }
        },

        navbar: {
            init() {
                const nav = document.querySelector('.navbar');
                if (!nav) return;

                const state = ProjectApp.pageSpecificModule.state;
                const lenis = state.lenisInstance;

                const reveal = () => {
                    if (!state.navbarHidden) return;
                    state.navbarHidden = false;
                    gsap.to(nav, { opacity: 1, duration: 0.35 });
                    nav.style.pointerEvents = '';
                };

                const hide = () => {
                    if (state.navbarHidden) return;
                    state.navbarHidden = true;
                    gsap.to(nav, { opacity: 0, duration: 0.35 });
                    nav.style.pointerEvents = 'none';
                };

                const handler = () => {
                    const y = window.scrollY || document.documentElement.scrollTop || 0;
                    const dy = y - state.lastScrollY;
                    state.lastScrollY = y;
                    const nearTop = y < 40;

                    if (nearTop) {
                        reveal();
                        return;
                    }

                    if (dy > 2) hide();
                    else if (dy < -2) reveal();
                };

                if (lenis) {
                    state.navbarScrollHandler = handler;
                    state.navbarBoundToLenis = true;
                    lenis.on('scroll', handler);
                } else {
                    state.navbarScrollHandler = handler;
                    state.navbarBoundToLenis = false;
                    window.addEventListener('scroll', handler, { passive: true });
                }

                gsap.set(nav, { opacity: 1 });
                state.lastScrollY = window.scrollY || 0;
            },

            cleanup() {
                const state = ProjectApp.pageSpecificModule.state;

                if (state.navbarScrollHandler) {
                    if (state.navbarBoundToLenis && state.lenisInstance && typeof state.lenisInstance.off === 'function') {
                        state.lenisInstance.off('scroll', state.navbarScrollHandler);
                    } else {
                        window.removeEventListener('scroll', state.navbarScrollHandler);
                    }
                }

                state.navbarScrollHandler = null;
                state.navbarBoundToLenis = false;
                state.navbarHidden = false;
            }
        },


// HERO SCROLLING
        scrollingWrapper: {
            state: {
                positions: [46.6, 0, -47.1],
                currentIndex: 0,
                textElements: [],
                scrollTicking: false,
                isSnapping: false,
                lastScrollY: 0,
                snapThreshold: 0.5,
                videoElement: null,
                heroSection: null,
                scrollRanges: [
                    { start: 0, end: 5, position: 46.6, index: 0 },
                    { start: 5, end: 10, position: 0, index: 1 },
                    { start: 10, end: 15, position: -47.1, index: 2 }
                ]
            },

            initSplitText() {
                if (typeof SplitType === 'undefined') return;

                const textChange = document.querySelector('.text-change');
                if (!textChange) return;

                const textMonos = textChange.querySelectorAll('.text-mono');

                textMonos.forEach(el => {
                    if (!el.querySelector('.line')) {
                        new SplitType(el, { types: 'lines', tagName: 'span', lineClass: 'line' });

                        const lines = el.querySelectorAll('.line');
                        lines.forEach(line => {
                            const wrapper = document.createElement('div');
                            wrapper.className = 'overflow-hidden';
                            wrapper.style.overflow = 'hidden';
                            line.parentNode.insertBefore(wrapper, line);
                            wrapper.appendChild(line);
                        });
                    }
                });

                this.state.textElements = Array.from(textMonos);

                textMonos.forEach(el => {
                    el.querySelectorAll('.line').forEach(line => {
                        gsap.set(line, { y: '110%' });
                    });
                });
            },

            animateText(toIndex, fromIndex, direction = 1) {
                if (this.state.textElements.length < 3) return;

                const texts = this.state.textElements;
                const textMap = [1, 0, 2];

                const targetTextIndex = textMap[toIndex];
                const currentTextIndex = fromIndex >= 0 ? textMap[fromIndex] : -1;

                const scrollingWrapper = document.querySelector('.scrolling-wrapper');
                const textMediumElements = scrollingWrapper ? scrollingWrapper.querySelectorAll('.text-medium') : [];
                const secondTextMedium = textMediumElements.length >= 2 ? textMediumElements[1] : null;

                if (secondTextMedium) {
                    if (toIndex === 0) {
                        gsap.to(secondTextMedium, {
                            x: '6%',
                            duration: 0.6,
                            ease: 'power2.out'
                        });
                    } else if (toIndex === 1) {
                        gsap.to(secondTextMedium, {
                            x: '0%',
                            duration: 0.6,
                            ease: 'power2.out'
                        });
                    } else if (toIndex === 2) {
                        gsap.to(secondTextMedium, {
                            x: '6%',
                            duration: 0.6,
                            ease: 'power2.out'
                        });
                    }
                }

                if (targetTextIndex === currentTextIndex) return;

                const targetText = texts[targetTextIndex];
                const targetLines = targetText.querySelectorAll('.line');

                if (currentTextIndex >= 0) {
                    const currentText = texts[currentTextIndex];
                    const currentLines = currentText.querySelectorAll('.line');

                    currentLines.forEach((line, i) => {
                        gsap.to(line, {
                            y: direction > 0 ? '-110%' : '110%',
                            duration: 0.6,
                            ease: 'power2.inOut',
                            delay: i * 0.03
                        });
                    });
                }

                targetLines.forEach((line, i) => {
                    gsap.fromTo(line,
                        { y: direction > 0 ? '110%' : '-110%' },
                        {
                            y: '0%',
                            duration: 0.6,
                            ease: 'power2.inOut',
                            delay: i * 0.03
                        }
                    );
                });
            },

            getScrollPercentage() {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                return (scrollTop / docHeight) * 100;
            },

            getTargetPosition(scrollPercent) {
                if (scrollPercent <= 5) {
                    return { position: 46.6, index: 0, progress: 0 };
                } else if (scrollPercent <= 10) {
                    const rangeProgress = (scrollPercent - 5) / 5;
                    const position = 46.6 - (46.6 * rangeProgress);

                    if (scrollPercent < 7.4) {
                        return { position: 46.6, index: 0, progress: 0, snap: true };
                    } else if (scrollPercent >= 7.5) {
                        return { position: 0, index: 1, progress: 1, snap: true };
                    } else {
                        const snapProgress = (scrollPercent - 7.4) / 0.1;
                        const snapPosition = 46.6 - (46.6 * snapProgress);
                        return { position: snapPosition, index: scrollPercent < 7.45 ? 0 : 1, progress: snapProgress };
                    }
                } else if (scrollPercent <= 15) {
                    const rangeProgress = (scrollPercent - 10) / 5;
                    const position = 0 - (47.1 * rangeProgress);

                    if (scrollPercent < 12.4) {
                        return { position: 0, index: 1, progress: 0, snap: true };
                    } else if (scrollPercent >= 12.5) {
                        return { position: -47.1, index: 2, progress: 1, snap: true };
                    } else {
                        const snapProgress = (scrollPercent - 12.4) / 0.1;
                        const snapPosition = 0 - (47.1 * snapProgress);
                        return { position: snapPosition, index: scrollPercent < 12.45 ? 1 : 2, progress: snapProgress };
                    }
                } else {
                    return { position: -47.1, index: 2, progress: 1 };
                }
            },

            handleScroll() {
                if (this.state.scrollTicking || this.state.isSnapping) return;

                this.state.scrollTicking = true;

                requestAnimationFrame(() => {
                    const wrapper = document.querySelector('.scrolling-wrapper');
                    if (!wrapper) {
                        this.state.scrollTicking = false;
                        return;
                    }

                    const scrollPercent = this.getScrollPercentage();
                    const currentScrollY = window.pageYOffset;
                    const direction = currentScrollY > this.state.lastScrollY ? 1 : -1;
                    this.state.lastScrollY = currentScrollY;

                    if (this.state.videoElement && this.state.videoElement.duration && !isNaN(this.state.videoElement.duration)) {
                        if (scrollPercent >= 1 && scrollPercent <= 35) {
                            const videoProgress = (scrollPercent - 1) / 34;
                            const targetTime = this.state.videoElement.duration * videoProgress;

                            const currentTime = this.state.videoElement.currentTime;
                            if (Math.abs(targetTime - currentTime) > 0.1) {
                                try {
                                    this.state.videoElement.currentTime = targetTime;
                                } catch (e) {
                                }
                            }
                        } else if (scrollPercent < 1) {
                            if (this.state.videoElement.currentTime !== 0) {
                                this.state.videoElement.currentTime = 0;
                            }
                        } else if (scrollPercent > 35) {
                            const endTime = this.state.videoElement.duration;
                            if (Math.abs(this.state.videoElement.currentTime - endTime) > 0.1) {
                                this.state.videoElement.currentTime = endTime;
                            }
                        }
                    }

                    const targetData = this.getTargetPosition(scrollPercent);
                    const oldIndex = this.state.currentIndex;

                    gsap.to(wrapper, {
                        x: `${targetData.position}%`,
                        duration: 0.4,
                        ease: 'power2.out',
                        overwrite: true
                    });

                    if (targetData.index !== oldIndex) {
                        this.state.currentIndex = targetData.index;
                        this.animateText(targetData.index, oldIndex, direction);
                    }

                    this.state.scrollTicking = false;
                });
            },

            init() {
                const wrapper = document.querySelector('.scrolling-wrapper');
                if (!wrapper || !window.gsap) return;

                this.state.videoElement = document.querySelector('.video-background');
                if (this.state.videoElement) {
                    this.state.videoElement.preload = 'auto';

                    const initVideo = () => {
                        this.state.videoElement.pause();
                        this.state.videoElement.currentTime = 0;

                        if (this.state.videoElement.duration && !isNaN(this.state.videoElement.duration)) {
                            const midPoint = this.state.videoElement.duration / 2;
                            this.state.videoElement.currentTime = midPoint;
                            setTimeout(() => {
                                this.state.videoElement.currentTime = 0;
                            }, 100);
                        }
                    };

                    if (this.state.videoElement.readyState >= 2) {
                        initVideo();
                    } else {
                        this.state.videoElement.addEventListener('loadedmetadata', initVideo, { once: true });
                        this.state.videoElement.addEventListener('canplay', () => {
                            if (!isNaN(this.state.videoElement.duration)) {
                                this.state.videoElement.currentTime = 0;
                            }
                        }, { once: true });
                    }
                }

                this.state.heroSection = document.querySelector('.hero-section');

                this.initSplitText();

                gsap.set(wrapper, { x: '46.6%' });

                setTimeout(() => {
                    this.animateText(0, -1, 1);
                }, 100);

                this.boundHandleScroll = this.handleScroll.bind(this);
                window.addEventListener('scroll', this.boundHandleScroll, { passive: true });

                this.state.lastScrollY = window.pageYOffset;

                setTimeout(() => {
                    this.handleScroll();
                }, 200);
            },

            cleanup() {
                const wrapper = document.querySelector('.scrolling-wrapper');
                const textChange = document.querySelector('.text-change');

                if (this.boundHandleScroll) {
                    window.removeEventListener('scroll', this.boundHandleScroll);
                }

                if (this.state.videoElement) {
                    this.state.videoElement.currentTime = 0;
                    this.state.videoElement.pause();
                }

                if (textChange) {
                    const textElements = textChange.querySelectorAll('.text-mono');
                    textElements.forEach(el => {
                        gsap.set(el, { x: '0%' });

                        const wrappers = el.querySelectorAll('.overflow-hidden');
                        wrappers.forEach(wrapper => {
                            const line = wrapper.querySelector('.line');
                            if (line && wrapper.parentNode) {
                                wrapper.parentNode.insertBefore(line, wrapper);
                                wrapper.remove();
                            }
                        });

                        if (el.splitType && typeof el.splitType.revert === 'function') {
                            el.splitType.revert();
                        }
                    });
                }

                const scrollingWrapper = document.querySelector('.scrolling-wrapper');
                const textMediumElements = scrollingWrapper ? scrollingWrapper.querySelectorAll('.text-medium') : [];
                const secondTextMedium = textMediumElements.length >= 2 ? textMediumElements[1] : null;

                if (secondTextMedium) {
                    gsap.set(secondTextMedium, { x: '-6%' });
                }

                if (wrapper) {
                    gsap.set(wrapper, { x: '0%' });
                }

                this.state = {
                    positions: [46.6, 0, -47.1],
                    currentIndex: 0,
                    textElements: [],
                    scrollTicking: false,
                    isSnapping: false,
                    lastScrollY: 0,
                    snapThreshold: 0.5,
                    videoElement: null,
                    heroSection: null,
                    scrollRanges: [
                        { start: 0, end: 5, position: 46.6, index: 0 },
                        { start: 5, end: 10, position: 0, index: 1 },
                        { start: 10, end: 15, position: -47.1, index: 2 }
                    ]
                };
            }
        },


// IMAGE ANIMATION
        visuals: {
            init() {
                const state = ProjectApp.pageSpecificModule.state;
                const imageEls = Array.from(document.querySelectorAll('.large-image'));

                imageEls.forEach(el => {
                    gsap.set(el, {
                        clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
                        scale: 1.25,
                        y: "6%",
                        willChange: 'clip-path, transform'
                    });

                    const stReveal = ScrollTrigger.create({
                        trigger: el,
                        start: "top 90%",
                        once: true,
                        onEnter: () => {
                            gsap.to(el, {
                                clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                                scale: 1.1,
                                duration: 0.8,
                                ease: 'power2.out'
                            });
                        }
                    });

                    state.scrollTriggers.push(stReveal);

                    const stScale = gsap.to(el, {
                        y: "-6%",
                        ease: "none",
                        scrollTrigger: {
                            trigger: ".bio-section",
                            start: "top 75%",
                            end: "bottom top",
                            scrub: true
                        }
                    }).scrollTrigger;

                    state.scrollTriggers.push(stScale);
                });
            },

            cleanup() {}
        },


// TEXT APPEARANCE
        textScrollAnimation: {
            init() {
                if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

                const h2Elements = document.querySelectorAll('.h2');
                if (h2Elements.length > 0) {
                    h2Elements.forEach(el => {
                        gsap.set(el, { y: '110%' });
                        ScrollTrigger.create({
                            trigger: el,
                            start: 'top 85%',
                            once: true,
                            onEnter: () => {
                                gsap.to(el, {
                                    y: '0%',
                                    duration: 0.8,
                                    ease: 'power2.out'
                                });
                            }
                        });
                    });
                }

                const bioTextBlocks = document.querySelectorAll('.bio-text-block');
                if (bioTextBlocks.length > 0) {
                    bioTextBlocks.forEach(block => {
                        const textDot = block.querySelector('.text-dot');
                        const textMedium = block.querySelector('.text-medium');

                        if (textDot) {
                            gsap.set(textDot, { scale: 0 });
                        }
                        if (textMedium) {
                            gsap.set(textMedium, { y: '110%' });
                        }

                        if (textDot || textMedium) {
                            ScrollTrigger.create({
                                trigger: block,
                                start: 'top 85%',
                                once: true,
                                onEnter: () => {
                                    const tl = gsap.timeline();
                                    if (textDot) {
                                        tl.to(textDot, {
                                            scale: 1,
                                            duration: 0.6,
                                            ease: 'back.out(1.7)'
                                        }, 0);
                                    }
                                    if (textMedium) {
                                        tl.to(textMedium, {
                                            y: '0%',
                                            duration: 0.8,
                                            ease: 'power2.out'
                                        }, 0.15);
                                    }
                                }
                            });
                        }
                    });
                }

                const splitAllBlocks = document.querySelectorAll('[split-all]');
                if (splitAllBlocks.length > 0 && typeof SplitType !== 'undefined') {
                    splitAllBlocks.forEach(block => {
                        const textElements = block.querySelectorAll('.text-abs, .text-mono, .text-regular');

                        textElements.forEach(el => {
                            if (el.querySelector('.line')) return;

                            new SplitType(el, {
                                types: 'lines',
                                tagName: 'span',
                                lineClass: 'line'
                            });

                            const lines = el.querySelectorAll('.line');
                            if (lines.length === 0) return;

                            lines.forEach(line => {
                                if (!line.parentElement.classList.contains('overflow-hidden')) {
                                    const wrapper = document.createElement('div');
                                    wrapper.className = 'overflow-hidden';
                                    wrapper.style.overflow = 'hidden';
                                    line.parentNode.insertBefore(wrapper, line);
                                    wrapper.appendChild(line);
                                }
                            });

                            gsap.set(lines, { y: '110%' });
                            ScrollTrigger.create({
                                trigger: el,
                                start: 'top 85%',
                                once: true,
                                onEnter: () => {
                                    gsap.to(lines, {
                                        y: '0%',
                                        duration: 0.8,
                                        ease: 'power2.out',
                                        stagger: 0.08
                                    });
                                }
                            });
                        });
                    });
                }
            },
            cleanup() {
                ScrollTrigger.getAll().forEach(st => {
                    if (st.vars && (st.vars.trigger?.classList?.contains('h2') ||
                        st.vars.trigger?.classList?.contains('bio-text-block') ||
                        st.vars.trigger?.classList?.contains('text-medium') ||
                        st.vars.trigger?.closest('[split-all]'))) {
                        st.kill();
                    }
                });
            }
        },


// AUDIO PLAYER
        audioPlayer: {
            addTrackedListener(element, event, handler, options) {
                const state = ProjectApp.pageSpecificModule.state;
                element.addEventListener(event, handler, options);
                state.audioEventListeners.push({ element, event, handler, options });
            },

            cacheElements() {
                const state = ProjectApp.pageSpecificModule.state;
                const wrapper = document.querySelector('.audio-player-container');
                const timeWrapper = wrapper?.querySelector('.time-block');
                const center = wrapper?.querySelector('.audio-player-inner');
                const lineWrap = center?.querySelector('.audio-line-wrapper');

                state.audioCachedElements = {
                    wrapper: wrapper,
                    timeNow: timeWrapper?.querySelectorAll('.text-small')?.[0] || null,
                    timeDur: timeWrapper?.querySelectorAll('.text-small')?.[1] || null,
                    activeLine: center?.querySelector('.active-audio_line-block'),
                    lineWrap: lineWrap,
                    closeBtn: this.getElementByText(center, 'close'),
                    playPauseBtn: this.getElementByText(wrapper, 'pause') || this.getElementByText(wrapper, 'play'),
                    bioTrigger: document.querySelector('.bio-text-block')
                };

                return Object.values(state.audioCachedElements).every(el => el !== null);
            },

            getElementByText(root, text) {
                if (!root) return null;
                const all = root.querySelectorAll('.text-small');
                for (const el of all) {
                    const t = (el.textContent || '').trim().toLowerCase();
                    if (t.startsWith(text)) return el;
                }
                return null;
            },

            initializeAudio() {
                const state = ProjectApp.pageSpecificModule.state;
                const config = ProjectApp.pageSpecificModule.config;

                const audio = new Audio(config.AUDIO.SRC);
                audio.preload = 'metadata';
                state.audioInstance = audio;

                this.addTrackedListener(audio, 'loadedmetadata', () => this.setDuration());
                this.addTrackedListener(audio, 'durationchange', () => this.setDuration());
                this.addTrackedListener(audio, 'play', () => this.handlePlay());
                this.addTrackedListener(audio, 'pause', () => this.handlePause());
                this.addTrackedListener(audio, 'ended', () => this.handleEnded());

                return audio;
            },

            setDuration() {
                const state = ProjectApp.pageSpecificModule.state;
                const audio = state.audioInstance;
                const elements = state.audioCachedElements;

                if (isFinite(audio.duration) && audio.duration > 0) {
                    elements.timeDur.textContent = ProjectApp.pageSpecificModule.helpers.formatTime(audio.duration);
                }
            },

            prepareSplitText() {
                const state = ProjectApp.pageSpecificModule.state;
                const bioTextRoot = document.querySelector('.bio-text-wrapper');
                if (!bioTextRoot) return;

                const splitTargetsSelectors = [
                    '.name-xsmall',
                    '.text-regular',
                    '.has--color-grey',
                    '.has--color-light'
                ];

                const elementsToAnimate = new Set();
                const elementsWithWordSplit = new Set();

                splitTargetsSelectors.forEach(sel => {
                    bioTextRoot.querySelectorAll(sel).forEach(el => {
                        if (el.hasAttribute('word-split')) {
                            elementsWithWordSplit.add(el);
                        } else {
                            elementsToAnimate.add(el);
                        }
                    });
                });

                Array.from(elementsToAnimate).forEach(el => {
                    const lines = ProjectApp.pageSpecificModule.helpers.splitAndWrapLines(el);

                    if (lines.length > 0 && typeof ScrollTrigger !== 'undefined') {
                        const st = ProjectApp.pageSpecificModule.helpers.createScrollReveal(lines, {
                            stagger: ProjectApp.pageSpecificModule.config.ANIMATION.TEXT_REVEAL_STAGGER
                        });

                        if (st) {
                            state.scrollTriggers.push(st);
                        }
                    }
                });

                Array.from(elementsWithWordSplit).forEach(el => {
                    ProjectApp.pageSpecificModule.helpers.splitAndWrapLines(el, { initialY: null });
                });

                state.audioAllLines = Array.from(bioTextRoot.querySelectorAll('.line'));
                state.audioAllLines.forEach(el => el.style.setProperty('--fill', '100%'));
            },

            updateLines() {
                const state = ProjectApp.pageSpecificModule.state;
                const audio = state.audioInstance;
                const allLines = state.audioAllLines;

                if (!allLines.length || !isFinite(audio.duration) || audio.duration <= 0) return;

                const progress = Math.max(0, Math.min(1, audio.currentTime / audio.duration));
                const totalLines = allLines.length;
                const boundary = progress * (totalLines - 1);
                const currentLine = Math.floor(boundary);
                const lineFillPercent = boundary - currentLine;

                for (let i = 0; i < totalLines; i++) {
                    if (i < currentLine) {
                        allLines[i].style.setProperty('--fill', '100%');
                    } else if (i > currentLine) {
                        allLines[i].style.setProperty('--fill', '0%');
                    } else {
                        allLines[i].style.setProperty('--fill', `${(lineFillPercent * 100).toFixed(2)}%`);
                    }
                }
            },

            updateUI(timestamp = 0) {
                const state = ProjectApp.pageSpecificModule.state;
                const config = ProjectApp.pageSpecificModule.config;
                const audio = state.audioInstance;
                const elements = state.audioCachedElements;

                if (timestamp - state.audioLastUpdateTime < config.AUDIO.RAF_UPDATE_THROTTLE) {
                    if (!audio.paused && !audio.ended) {
                        state.audioRafId = requestAnimationFrame((ts) => this.updateUI(ts));
                    }
                    return;
                }

                state.audioLastUpdateTime = timestamp;

                elements.timeNow.textContent = ProjectApp.pageSpecificModule.helpers.formatTime(audio.currentTime);

                const duration = (audio.duration && isFinite(audio.duration)) ? audio.duration : 0;
                const progress = duration > 0 ? (audio.currentTime / duration) : 0;
                elements.activeLine.style.width = `${Math.max(0, Math.min(1, progress)) * 100}%`;

                this.updateLines();

                if (!audio.paused && !audio.ended) {
                    state.audioRafId = requestAnimationFrame((ts) => this.updateUI(ts));
                } else {
                    state.audioRafId = null;
                }
            },

            cancelRaf() {
                const state = ProjectApp.pageSpecificModule.state;

                if (state.audioRafId) {
                    cancelAnimationFrame(state.audioRafId);
                    state.audioRafId = null;
                }
            },

            setPlayPauseLabel(mode) {
                const state = ProjectApp.pageSpecificModule.state;
                state.audioCachedElements.playPauseBtn.textContent = mode === 'play' ? 'play' : 'pause';
            },

            hidePlayer() {
                const state = ProjectApp.pageSpecificModule.state;
                const wrapper = state.audioCachedElements.wrapper;

                wrapper.style.opacity = '0';
                wrapper.style.transform = 'translateY(-110%)';

                const onTransitionEnd = () => {
                    wrapper.style.display = 'none';
                    wrapper.removeEventListener('transitionend', onTransitionEnd);
                };

                this.addTrackedListener(wrapper, 'transitionend', onTransitionEnd);
                state.audioAllLines.forEach(el => el.style.setProperty('--fill', '100%'));
            },

            showAndPlay() {
                const state = ProjectApp.pageSpecificModule.state;
                const wrapper = state.audioCachedElements.wrapper;
                const audio = state.audioInstance;

                wrapper.style.display = '';
                void wrapper.offsetWidth;
                wrapper.style.opacity = '1';
                wrapper.style.transform = 'translateY(0)';

                state.audioAllLines.forEach(el => el.style.setProperty('--fill', '0%'));

                audio.play()
                    .then(() => {
                        this.setPlayPauseLabel('pause');
                        this.cancelRaf();
                        this.updateUI();
                    })
                    .catch(() => {
                        this.setPlayPauseLabel('play');
                    });
            },

            handlePlay() {
                this.setPlayPauseLabel('pause');
                this.cancelRaf();
                this.updateUI();
            },

            handlePause() {
                const state = ProjectApp.pageSpecificModule.state;
                const audio = state.audioInstance;
                const elements = state.audioCachedElements;

                this.cancelRaf();

                elements.timeNow.textContent = ProjectApp.pageSpecificModule.helpers.formatTime(audio.currentTime);

                const duration = (audio.duration && isFinite(audio.duration)) ? audio.duration : 0;
                const progress = duration > 0 ? (audio.currentTime / duration) : 0;
                elements.activeLine.style.width = `${Math.max(0, Math.min(1, progress)) * 100}%`;

                this.updateLines();
            },

            handleEnded() {
                const state = ProjectApp.pageSpecificModule.state;
                const audio = state.audioInstance;
                const elements = state.audioCachedElements;

                this.cancelRaf();

                elements.activeLine.style.width = '100%';
                elements.timeNow.textContent = ProjectApp.pageSpecificModule.helpers.formatTime(
                    audio.duration || audio.currentTime
                );
                this.setPlayPauseLabel('play');
                this.hidePlayer();
            },

            bindEventHandlers() {
                const state = ProjectApp.pageSpecificModule.state;
                const elements = state.audioCachedElements;
                const audio = state.audioInstance;

                const handleLineClick = (e) => {
                    const rect = elements.lineWrap.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const ratio = Math.max(0, Math.min(1, x / rect.width));

                    if (isFinite(audio.duration) && audio.duration > 0) {
                        audio.currentTime = audio.duration * ratio;
                        elements.timeNow.textContent = ProjectApp.pageSpecificModule.helpers.formatTime(audio.currentTime);
                        elements.activeLine.style.width = `${ratio * 100}%`;
                        this.updateLines();
                    }
                };

                const handlePlayPauseClick = () => {
                    const label = (elements.playPauseBtn.textContent || '').trim().toLowerCase();

                    if (label === 'pause') {
                        audio.pause();
                        this.setPlayPauseLabel('play');
                    } else {
                        audio.play()
                            .then(() => {
                                this.setPlayPauseLabel('pause');
                                this.cancelRaf();
                                this.updateUI();
                            })
                            .catch(() => {});
                    }
                };

                const handleCloseClick = () => {
                    audio.pause();
                    this.setPlayPauseLabel('play');
                    this.hidePlayer();
                };

                const handleBioTriggerClick = () => {
                    this.showAndPlay();
                };

                elements.lineWrap.style.cursor = 'pointer';
                elements.playPauseBtn.style.cursor = 'pointer';
                elements.closeBtn.style.cursor = 'pointer';
                elements.bioTrigger.style.cursor = 'pointer';

                this.addTrackedListener(elements.lineWrap, 'click', handleLineClick);
                this.addTrackedListener(elements.playPauseBtn, 'click', handlePlayPauseClick);
                this.addTrackedListener(elements.closeBtn, 'click', handleCloseClick);
                this.addTrackedListener(elements.bioTrigger, 'click', handleBioTriggerClick, { passive: true });
            },

            initializePlayerUI() {
                const state = ProjectApp.pageSpecificModule.state;
                const wrapper = state.audioCachedElements.wrapper;

                wrapper.style.display = 'none';
                wrapper.style.opacity = '0';
                wrapper.style.transform = 'translateY(-110%)';
            },

            init() {
                if (!this.cacheElements()) return;

                this.initializeAudio();
                this.initializePlayerUI();
                this.bindEventHandlers();

                const readyFonts = () => {
                    this.prepareSplitText();
                };

                if (document.fonts && document.fonts.ready) {
                    document.fonts.ready.then(readyFonts);
                } else {
                    window.addEventListener('load', readyFonts, { once: true });
                }
            },

            cleanup() {
                const state = ProjectApp.pageSpecificModule.state;

                this.cancelRaf();

                if (state.audioInstance) {
                    state.audioInstance.pause();
                    state.audioInstance.src = '';
                    state.audioInstance = null;
                }

                state.audioEventListeners.forEach(({ element, event, handler, options }) => {
                    try {
                        element.removeEventListener(event, handler, options);
                    } catch (e) {}
                });

                state.audioEventListeners = [];
                state.audioAllLines = [];
                state.audioLastUpdateTime = 0;
                state.audioCachedElements = {
                    wrapper: null,
                    timeNow: null,
                    timeDur: null,
                    activeLine: null,
                    playPauseBtn: null,
                    closeBtn: null,
                    bioTrigger: null,
                    lineWrap: null
                };
            }
        },


// PARTNERS HOVER
        partners: {
            addTrackedListener(element, event, handler, options) {
                const state = ProjectApp.pageSpecificModule.state;
                element.addEventListener(event, handler, options);
                state.partnersEventListeners.push({ element, event, handler, options });
            },

            parsePartnersText(textContainer) {
                const config = ProjectApp.pageSpecificModule.config;
                let originalText = textContainer.textContent;

                config.PARTNERS.SKIP_PHRASES.forEach(phrase => {
                    originalText = originalText.replace(
                        new RegExp(phrase, 'g'),
                        '|SKIP|' + phrase + '|SKIP|'
                    );
                });

                return originalText
                    .split(/,|\|SKIP\|/)
                    .map(part => part.trim())
                    .filter(part => part.length > 0);
            },

            buildTextWithSpans(textContainer, parts) {
                const config = ProjectApp.pageSpecificModule.config;
                const state = ProjectApp.pageSpecificModule.state;

                textContainer.innerHTML = '';
                let imageIndex = 0;
                const wordItems = [];

                parts.forEach((part, index) => {
                    const isSkipPhrase = config.PARTNERS.SKIP_PHRASES.includes(part);

                    if (isSkipPhrase) {
                        textContainer.appendChild(document.createTextNode(part));
                    } else {
                        const span = document.createElement('span');
                        span.className = 'word-item';
                        span.style.cursor = 'pointer';
                        span.setAttribute('data-image-index', imageIndex);
                        span.textContent = part;
                        wordItems.push(span);
                        textContainer.appendChild(span);
                        imageIndex++;
                    }

                    if (index < parts.length - 1) {
                        const nextPart = parts[index + 1];
                        const currentIsSkip = config.PARTNERS.SKIP_PHRASES.includes(part);
                        const nextIsSkip = config.PARTNERS.SKIP_PHRASES.includes(nextPart);

                        if (!currentIsSkip && !nextIsSkip) {
                            textContainer.appendChild(document.createTextNode(', '));
                        } else if (!currentIsSkip && nextPart === 'and') {
                            textContainer.appendChild(document.createTextNode(', '));
                        } else if (currentIsSkip) {
                            textContainer.appendChild(document.createTextNode(' '));
                        }
                    }
                });

                return wordItems;
            },

            initializeImages(logoWrapper) {
                const images = logoWrapper.querySelectorAll('.partners-logo-image');

                gsap.set(logoWrapper, { opacity: 0, visibility: 'visible' });

                images.forEach((img) => {
                    gsap.set(img, {
                        display: 'block',
                        clipPath: 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)',
                        opacity: 0,
                        zIndex: 0
                    });
                });

                return Array.from(images);
            },

            showImage(imgIndex, skipAutoplayRestart = false) {
                const state = ProjectApp.pageSpecificModule.state;
                const config = ProjectApp.pageSpecificModule.config;

                if (
                    imgIndex === state.partnersCurrentImageIndex ||
                    imgIndex < 0 ||
                    imgIndex >= state.partnersImages.length
                ) {
                    return;
                }

                const oldIndex = state.partnersCurrentImageIndex;
                state.partnersCurrentImageIndex = imgIndex;

                state.partnersImages.forEach((img, i) => {
                    gsap.killTweensOf(img);

                    if (i === imgIndex) {
                        gsap.set(img, {
                            zIndex: oldIndex >= 0 ? oldIndex + 1 : 1,
                            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
                        });
                        gsap.to(img, {
                            opacity: 1,
                            duration: config.ANIMATION.FADE_DURATION,
                            ease: config.ANIMATION.EASE_TEXT,
                            overwrite: true
                        });
                    }
                });

                if (!skipAutoplayRestart && !state.partnersIsHovering) {
                    this.stopAutoplay();
                    this.startAutoplay();
                }
            },

            startAutoplay() {
                const state = ProjectApp.pageSpecificModule.state;
                const config = ProjectApp.pageSpecificModule.config;

                this.stopAutoplay();

                const playNext = () => {
                    if (!state.partnersIsHovering) {
                        let next = (state.partnersCurrentImageIndex + 1) % state.partnersImages.length;

                        if (next === 0 && state.partnersCurrentImageIndex === state.partnersImages.length - 1) {
                            state.partnersImages.forEach((img) => {
                                gsap.set(img, {
                                    clipPath: 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)',
                                    opacity: 0,
                                    zIndex: 0
                                });
                            });
                            state.partnersCurrentImageIndex = -1;
                            next = 0;
                        }

                        this.showImage(next, true);
                    }

                    state.partnersAutoplayInterval = setTimeout(playNext, config.PARTNERS.AUTOPLAY_DELAY);
                };

                state.partnersAutoplayInterval = setTimeout(playNext, config.PARTNERS.AUTOPLAY_DELAY);
            },

            stopAutoplay() {
                const state = ProjectApp.pageSpecificModule.state;

                if (state.partnersAutoplayInterval) {
                    clearTimeout(state.partnersAutoplayInterval);
                    state.partnersAutoplayInterval = null;
                }
            },

            createScrollHandler(bioSection, logoWrapper) {
                const config = ProjectApp.pageSpecificModule.config;
                const state = ProjectApp.pageSpecificModule.state;

                return () => {
                    const visibility = ProjectApp.pageSpecificModule.helpers.getViewportVisibility(bioSection);
                    const fadeInThreshold = visibility.viewportHeight * config.SCROLL.VIEWPORT_FADE_IN_THRESHOLD;
                    const fadeOutBottomThreshold = visibility.viewportHeight * config.SCROLL.VIEWPORT_FADE_OUT_THRESHOLD;

                    if (
                        visibility.rect.top <= fadeInThreshold &&
                        visibility.rect.bottom > fadeOutBottomThreshold &&
                        visibility.percentInView >= config.SCROLL.MIN_VISIBLE_PERCENTAGE
                    ) {
                        gsap.to(logoWrapper, {
                            opacity: 1,
                            duration: config.ANIMATION.FADE_DURATION,
                            ease: config.ANIMATION.EASE_TEXT,
                            onComplete: () => {
                                if (!state.partnersAutoplayInterval && state.partnersCurrentImageIndex < 0) {
                                    this.showImage(0, true);
                                    this.startAutoplay();
                                }
                            }
                        });
                    } else {
                        gsap.to(logoWrapper, {
                            opacity: 0,
                            duration: config.ANIMATION.FADE_DURATION,
                            ease: config.ANIMATION.EASE_TEXT
                        });
                        this.stopAutoplay();
                    }
                };
            },

            bindScrollListener(handleScroll) {
                const state = ProjectApp.pageSpecificModule.state;
                const throttledHandler = ProjectApp.pageSpecificModule.helpers.throttle(handleScroll, 16);

                if (state.lenisInstance) {
                    state.partnersScrollHandler = throttledHandler;
                    state.partnersBoundToLenis = true;
                    state.lenisInstance.on('scroll', throttledHandler);
                } else {
                    window.addEventListener('scroll', throttledHandler, { passive: true });
                    state.partnersScrollHandler = throttledHandler;
                    state.partnersBoundToLenis = false;
                }
            },

            applySplitAndAnimation(textContainer) {
                const state = ProjectApp.pageSpecificModule.state;

                if (typeof SplitType === 'undefined') return;

                const lines = ProjectApp.pageSpecificModule.helpers.splitAndWrapLines(textContainer);

                if (lines.length > 0 && typeof ScrollTrigger !== 'undefined') {
                    const st = ProjectApp.pageSpecificModule.helpers.createScrollReveal(lines, {
                        stagger: ProjectApp.pageSpecificModule.config.ANIMATION.TEXT_REVEAL_STAGGER
                    });

                    if (st) {
                        state.scrollTriggers.push(st);
                    }
                }

                this.bindWordHoverEvents();
            },

            bindWordHoverEvents() {
                const state = ProjectApp.pageSpecificModule.state;

                state.partnersWordItems.forEach(span => {
                    const handleMouseEnter = () => {
                        const imgIndex = parseInt(span.getAttribute('data-image-index'));
                        state.partnersIsHovering = true;
                        this.stopAutoplay();
                        this.showImage(imgIndex, true);
                    };

                    const handleMouseLeave = () => {
                        state.partnersIsHovering = false;
                        setTimeout(() => {
                            if (!state.partnersIsHovering) {
                                this.startAutoplay();
                            }
                        }, 50);
                    };

                    this.addTrackedListener(span, 'mouseenter', handleMouseEnter);
                    this.addTrackedListener(span, 'mouseleave', handleMouseLeave);
                });
            },

            init() {
                const state = ProjectApp.pageSpecificModule.state;

                if (state.partnersInitialized) return;

                const textContainer = document.querySelector('[word-split]');
                const logoWrapper = document.querySelector('.partners-logo-wrapper');
                const bioSection = document.querySelector('.bio-section');

                if (!textContainer || !logoWrapper || !bioSection) return;

                state.partnersImages = this.initializeImages(logoWrapper);
                const parts = this.parsePartnersText(textContainer);
                state.partnersWordItems = this.buildTextWithSpans(textContainer, parts);

                const handleScroll = this.createScrollHandler(bioSection, logoWrapper);
                this.bindScrollListener(handleScroll);
                handleScroll();

                const applyWhenReady = () => {
                    this.applySplitAndAnimation(textContainer);
                };

                if (document.fonts && document.fonts.ready) {
                    document.fonts.ready.then(applyWhenReady);
                } else {
                    window.addEventListener('load', applyWhenReady, { once: true });
                }

                state.partnersInitialized = true;
            },

            cleanup() {
                const state = ProjectApp.pageSpecificModule.state;

                this.stopAutoplay();

                state.partnersEventListeners.forEach(({ element, event, handler, options }) => {
                    try {
                        element.removeEventListener(event, handler, options);
                    } catch (e) {}
                });

                if (state.partnersScrollHandler) {
                    if (state.partnersBoundToLenis && state.lenisInstance && typeof state.lenisInstance.off === 'function') {
                        state.lenisInstance.off('scroll', state.partnersScrollHandler);
                    } else {
                        window.removeEventListener('scroll', state.partnersScrollHandler);
                    }
                }

                state.partnersScrollHandler = null;
                state.partnersBoundToLenis = false;
                state.partnersInitialized = false;
                state.partnersAutoplayInterval = null;
                state.partnersIsHovering = false;
                state.partnersCurrentImageIndex = -1;
                state.partnersImages = [];
                state.partnersWordItems = [];
                state.partnersEventListeners = [];
            }
        },



        destinations: {
            init() {
                if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

                gsap.registerPlugin(ScrollTrigger);

                const state = ProjectApp.pageSpecificModule.state;
                const config = ProjectApp.pageSpecificModule.config;
                const DURATION_TEXT = 0.6;
                const EASE_TEXT = 'power3.out';
                const ITEM_DELAY = 0.1;

                document.querySelectorAll('.destinations-section .destination-text-block').forEach(block => {
                    const items = [...block.querySelectorAll('.destination-text-item')];
                    const texts = items.flatMap(it => [...it.querySelectorAll('.text-mono, .text-regular')]);

                    gsap.set(texts, { y: '110%' });

                    const tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: block,
                            start: 'top 75%',
                            toggleActions: 'play none none none'
                        }
                    });

                    items.forEach((it, i) => {
                        const inItem = [...it.querySelectorAll('.text-mono, .text-regular')];
                        tl.to(inItem, { y: '0%', duration: DURATION_TEXT, ease: EASE_TEXT }, i * ITEM_DELAY);
                    });

                    state.destinationsScrollTriggers.push(tl.scrollTrigger);
                });

                document.querySelectorAll('.destinations-section .destinations-images-container').forEach(el => {
                    const startPoly = 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)';
                    const endPoly = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
                    const center = el.querySelector('.central-image-block');
                    const left = el.querySelector('.left-image-block');
                    const right = el.querySelector('.right-image-block');

                    gsap.set(el, { clipPath: startPoly, WebkitClipPath: startPoly, willChange: 'clip-path' });
                    if (center) gsap.set(center, { scale: 1.15, willChange: 'transform' });
                    if (left) gsap.set(left, { xPercent: 50, willChange: 'transform' });
                    if (right) gsap.set(right, { xPercent: -50, willChange: 'transform' });

                    const tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: el,
                            start: 'top 75%',
                            toggleActions: 'play none none none'
                        }
                    });

                    tl.to(el, {
                        clipPath: endPoly,
                        WebkitClipPath: endPoly,
                        duration: 1.5,
                        ease: 'power3.out',
                        onComplete() {
                            el.style.willChange = '';
                        }
                    }, 0);

                    if (center) {
                        tl.to(center, {
                            scale: 1,
                            duration: 1.5,
                            ease: 'power3.out',
                            onComplete() {
                                center.style.willChange = '';
                            }
                        }, 0);
                    }

                    if (left || right) {
                        tl.addLabel('sides', '+=0');
                        tl.add('afterReveal', '+=0');
                        tl.to([left, right].filter(Boolean), {
                            xPercent: 0,
                            duration: 0.9,
                            ease: 'power3.out',
                            onComplete() {
                                if (left) left.style.willChange = '';
                                if (right) right.style.willChange = '';
                            }
                        }, '>-0.01');
                    }

                    state.destinationsScrollTriggers.push(tl.scrollTrigger);
                });
            },

            cleanup() {
                const state = ProjectApp.pageSpecificModule.state;

                (state.destinationsScrollTriggers || []).forEach(st => {
                    try {
                        if (st && st.kill) st.kill();
                    } catch (e) {}
                });

                state.destinationsScrollTriggers = [];
            }
        },


        // DESTINATIONS HOVER
        destinationsHover: {
            state: {
                eventListeners: []
            },

            addTrackedListener(element, event, handler, options) {
                element.addEventListener(event, handler, options);
                this.state.eventListeners.push({ element, event, handler, options });
            },

            init() {
                if (typeof gsap === 'undefined') return;

                document.querySelectorAll('.destinations-container').forEach(container => {
                    const wrappers = [...container.querySelectorAll('.destinations-images-wrapper')];
                    const items = [...container.querySelectorAll('.destination-text-item')];

                    if (!wrappers.length || !items.length) return;

                    wrappers.forEach(wrapper => {
                        const left = wrapper.querySelector('.left-image-block');
                        const center = wrapper.querySelector('.central-image-block');
                        const right = wrapper.querySelector('.right-image-block');

                        gsap.set(wrapper, { zIndex: 0 });

                        if (left) {
                            gsap.set(left, {
                                clipPath: 'inset(0% 0% 100% 0%)',
                                WebkitClipPath: 'inset(0% 0% 100% 0%)'
                            });
                        }

                        if (center) {
                            gsap.set(center, {
                                clipPath: 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)',
                                WebkitClipPath: 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)'
                            });
                        }

                        if (right) {
                            gsap.set(right, {
                                clipPath: 'inset(100% 0% 0% 0%)',
                                WebkitClipPath: 'inset(100% 0% 0% 0%)'
                            });
                        }
                    });

                    if (wrappers[0]) {
                        const left = wrappers[0].querySelector('.left-image-block');
                        const center = wrappers[0].querySelector('.central-image-block');
                        const right = wrappers[0].querySelector('.right-image-block');

                        gsap.set(wrappers[0], { zIndex: 1 });

                        if (left) {
                            gsap.set(left, {
                                clipPath: 'inset(0% 0% 0% 0%)',
                                WebkitClipPath: 'inset(0% 0% 0% 0%)'
                            });
                        }

                        if (center) {
                            gsap.set(center, {
                                clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                                WebkitClipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
                            });
                        }

                        if (right) {
                            gsap.set(right, {
                                clipPath: 'inset(0% 0% 0% 0%)',
                                WebkitClipPath: 'inset(0% 0% 0% 0%)'
                            });
                        }
                    }

                    let zCursor = 1;
                    let activeIndex = 0;

                    const revealWrapper = (wrapper, idx) => {
                        if (idx === activeIndex) return;

                        activeIndex = idx;
                        zCursor += 1;

                        const left = wrapper.querySelector('.left-image-block');
                        const center = wrapper.querySelector('.central-image-block');
                        const right = wrapper.querySelector('.right-image-block');

                        gsap.set(wrapper, { zIndex: zCursor });

                        const tl = gsap.timeline();

                        if (left) {
                            gsap.set(left, {
                                clipPath: 'inset(0% 0% 100% 0%)',
                                WebkitClipPath: 'inset(0% 0% 100% 0%)',
                                willChange: 'clip-path'
                            });
                            tl.to(left, {
                                clipPath: 'inset(0% 0% 0% 0%)',
                                WebkitClipPath: 'inset(0% 0% 0% 0%)',
                                duration: 1.25,
                                ease: 'power4.out',
                                onComplete() {
                                    left.style.willChange = '';
                                }
                            }, 0);
                        }

                        if (center) {
                            gsap.set(center, {
                                clipPath: 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)',
                                WebkitClipPath: 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)',
                                willChange: 'clip-path'
                            });
                            tl.to(center, {
                                clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                                WebkitClipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                                duration: 1.25,
                                ease: 'power4.out',
                                onComplete() {
                                    center.style.willChange = '';
                                }
                            }, 0);
                        }

                        if (right) {
                            gsap.set(right, {
                                clipPath: 'inset(100% 0% 0% 0%)',
                                WebkitClipPath: 'inset(100% 0% 0% 0%)',
                                willChange: 'clip-path'
                            });
                            tl.to(right, {
                                clipPath: 'inset(0% 0% 0% 0%)',
                                WebkitClipPath: 'inset(0% 0% 0% 0%)',
                                duration: 1.25,
                                ease: 'power4.out',
                                onComplete() {
                                    right.style.willChange = '';
                                }
                            }, 0);
                        }
                    };

                    items.forEach((it, i) => {
                        const handleInteraction = () => {
                            const target = wrappers[i];
                            if (target) revealWrapper(target, i);
                        };

                        this.addTrackedListener(it, 'mouseenter', handleInteraction, { passive: true });
                        this.addTrackedListener(it, 'focus', handleInteraction);
                    });
                });
            },

            cleanup() {
                this.state.eventListeners.forEach(({ element, event, handler, options }) => {
                    try {
                        element.removeEventListener(event, handler, options);
                    } catch (e) {}
                });
                this.state.eventListeners = [];
            }
        },


        // AWARDS ANIMATION
        awards: {
            init() {
                const awardsSection = document.querySelector('.awards-section');
                if (!awardsSection) return;

                const imageBlocks = awardsSection.querySelectorAll('.award-image-block');
                if (!imageBlocks.length) return;

                const blockImages = Array.from(imageBlocks).map(block =>
                    Array.from(block.querySelectorAll('.award-image'))
                );

                let currentIndex = 0;
                const imagesPerBlock = blockImages[0] ? blockImages[0].length : 0;
                if (!imagesPerBlock) return;

                const opacityElements = {
                    one: awardsSection.querySelectorAll('[data-opacity-one]'),
                    two: awardsSection.querySelectorAll('[data-opacity-two]'),
                    three: awardsSection.querySelectorAll('[data-opacity-three]'),
                    four: awardsSection.querySelectorAll('[data-opacity-four]')
                };

                blockImages.forEach(images => {
                    images.forEach((img) => {
                        gsap.set(img, { opacity: 0, display: 'block' });
                    });
                });

                gsap.set(opacityElements.one, { opacity: 0.5 });
                gsap.set(opacityElements.two, { opacity: 0.5 });
                gsap.set(opacityElements.three, { opacity: 0.5 });
                gsap.set(opacityElements.four, { opacity: 0.5 });

                const showImagesAtIndex = (index) => {
                    blockImages.forEach(images => {
                        images.forEach((img, i) => {
                            if (i <= index) {
                                gsap.to(img, { opacity: 1, duration: 0.4, ease: 'power3.out' });
                            } else {
                                gsap.to(img, { opacity: 0, duration: 0.4, ease: 'power3.out' });
                            }
                        });
                    });

                    const opacityKeys = ['one', 'two', 'three', 'four'];
                    opacityKeys.forEach((key, i) => {
                        if (opacityElements[key].length) {
                            if (i === index) {
                                gsap.to(opacityElements[key], { opacity: 1, duration: 0.4, ease: 'power3.out' });
                            } else {
                                gsap.to(opacityElements[key], { opacity: 0.5, duration: 0.4, ease: 'power3.out' });
                            }
                        }
                    });
                };

                showImagesAtIndex(0);

                const handleScroll = () => {
                    const sectionRect = awardsSection.getBoundingClientRect();
                    const viewportHeight = window.innerHeight;
                    const scrollStart = sectionRect.top - (viewportHeight * 0.5);
                    const scrollEnd = sectionRect.bottom - (viewportHeight * 0.5);
                    const scrollRange = scrollEnd - scrollStart;
                    const progressRaw = scrollRange ? (-scrollStart / scrollRange) : 0;
                    const scrollProgress = Math.max(0, Math.min(1, progressRaw));
                    const newIndex = Math.floor(scrollProgress * imagesPerBlock);
                    const clampedIndex = Math.max(0, Math.min(imagesPerBlock - 1, newIndex));

                    if (clampedIndex !== currentIndex) {
                        currentIndex = clampedIndex;
                        showImagesAtIndex(currentIndex);
                    }
                };

                const state = ProjectApp.pageSpecificModule.state;
                const lenis = state.lenisInstance;

                if (lenis) {
                    const throttledHandler = ProjectApp.pageSpecificModule.helpers.throttle(handleScroll, 16);
                    state.awardsScrollHandler = throttledHandler;
                    state.awardsBoundToLenis = true;
                    lenis.on('scroll', throttledHandler);
                } else {
                    const throttledHandler = ProjectApp.pageSpecificModule.helpers.throttle(handleScroll, 16);
                    window.addEventListener('scroll', throttledHandler, { passive: true });
                    state.awardsScrollHandler = throttledHandler;
                    state.awardsBoundToLenis = false;
                }

                handleScroll();
            },

            cleanup() {
                const state = ProjectApp.pageSpecificModule.state;

                if (state.awardsScrollHandler) {
                    if (state.awardsBoundToLenis && state.lenisInstance && typeof state.lenisInstance.off === 'function') {
                        state.lenisInstance.off('scroll', state.awardsScrollHandler);
                    } else {
                        window.removeEventListener('scroll', state.awardsScrollHandler);
                    }
                }

                state.awardsScrollHandler = null;
                state.awardsBoundToLenis = false;
            }
        },


        // PRESS ANIMATION
        press: {
            state: {
                marqueeAnimations: [],
                draggables: [],
                truncateResizeHandler: null
            },

            debounce(func, wait) {
                let timeout;
                return function(...args) {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(this, args), wait);
                };
            },

            truncateText() {
                const minW = 992, maxW = 1919;
                const inRange = window.innerWidth >= minW && window.innerWidth <= maxW;
                const els = document.querySelectorAll('.press-bottom .text-abs');
                if (!els.length) return;

                els.forEach(el => {
                    if (!el.dataset.originalText) {
                        el.dataset.originalText = (el.textContent || '').trim();
                    }

                    const original = el.dataset.originalText;

                    if (!inRange) {
                        el.textContent = original;
                        return;
                    }

                    const prevWS = el.style.whiteSpace;
                    el.style.whiteSpace = 'nowrap';
                    el.textContent = original;

                    const available = el.clientWidth || el.getBoundingClientRect().width || 0;

                    if (el.scrollWidth <= available) {
                        el.style.whiteSpace = prevWS;
                        return;
                    }

                    const words = original.split(/\s+/).filter(Boolean);

                    if (words.length === 0) {
                        el.textContent = '...';
                        el.style.whiteSpace = prevWS;
                        return;
                    }

                    const setCandidate = (count) => {
                        if (count <= 0) return '...';
                        return words.slice(0, count).join(' ') + '...';
                    };

                    let left = words.length - 1;
                    el.textContent = setCandidate(left);

                    while (el.scrollWidth > available && left > 0) {
                        left--;
                        el.textContent = setCandidate(left);
                    }

                    if (el.scrollWidth > available) {
                        el.textContent = '...';
                    }

                    el.style.whiteSpace = prevWS;
                });
            },

            indexBlocks() {
                const allMarqueeLists = document.querySelectorAll('.marquee-list');
                if (!allMarqueeLists.length) return;

                const firstList = allMarqueeLists[0];
                const firstListBlocks = firstList.querySelectorAll('.press-block');
                const totalCount = firstListBlocks.length;

                const formatNumber = (num) => (num < 10 ? '0' + num : '' + num);
                const formattedTotal = formatNumber(totalCount);

                const pressCountElement = document.querySelector('[press-count]');
                if (pressCountElement) {
                    pressCountElement.textContent = formattedTotal;
                }

                allMarqueeLists.forEach((list) => {
                    const blocks = list.querySelectorAll('.press-block');
                    blocks.forEach((block, index) => {
                        const indexElement = block.querySelector('[article-index]');
                        if (indexElement) {
                            indexElement.textContent = formatNumber(index + 1);
                        }
                    });
                });
            },

            initHover() {
                const pressHovers = document.querySelectorAll('.press-hover');

                pressHovers.forEach(pressHover => {
                    if (pressHover.dataset.hoverInitialized === 'true') return;

                    const inner = pressHover.querySelector('.article-hover-inner');
                    if (!inner) return;

                    if (getComputedStyle(pressHover).position === 'static') {
                        pressHover.style.position = 'relative';
                    }

                    pressHover.style.pointerEvents = 'auto';
                    inner.style.position = 'absolute';
                    inner.style.left = '50%';
                    inner.style.top = '50%';
                    inner.style.transform = 'translate(-50%, -50%)';
                    inner.style.pointerEvents = 'none';

                    let isHovering = false;

                    const handleMouseEnter = (e) => {
                        isHovering = true;
                        const r = pressHover.getBoundingClientRect();
                        const x = e.clientX - r.left;
                        const y = e.clientY - r.top;
                        inner.style.transform = `translate(calc(-50% + ${x - r.width/2}px), calc(-50% + ${y - r.height/2}px))`;
                    };

                    const handleMouseMove = (e) => {
                        if (!isHovering) return;
                        const r = pressHover.getBoundingClientRect();
                        const x = e.clientX - r.left;
                        const y = e.clientY - r.top;
                        inner.style.transform = `translate(calc(-50% + ${x - r.width/2}px), calc(-50% + ${y - r.height/2}px))`;
                    };

                    const handleMouseLeave = () => {
                        isHovering = false;
                        inner.style.transform = 'translate(-50%, -50%)';
                    };

                    pressHover.addEventListener('mouseenter', handleMouseEnter);
                    pressHover.addEventListener('mousemove', handleMouseMove);
                    pressHover.addEventListener('mouseleave', handleMouseLeave);

                    const shuffleElements = pressHover.querySelectorAll('[data-shuffle]');
                    shuffleElements.forEach(shuffleEl => {
                        ProjectApp.animations.initAlternatingShuffleForElement(shuffleEl);
                    });

                    pressHover.dataset.hoverInitialized = 'true';
                });
            },

            initMarqueeInfinite(wrapper, direction = 1) {
                const originalBlock = wrapper.querySelector('.marquee-block');
                if (!originalBlock) return;

                let totalWidth;
                let marqueeTween;
                const repeatTimes = 3;

                for (let i = 0; i < repeatTimes; i++) {
                    const clone = originalBlock.cloneNode(true);
                    wrapper.appendChild(clone);
                }

                const DURATION = 40;

                const createAnimation = (startX) => {
                    if (direction === 1) {
                        return gsap.to(wrapper, {
                            x: startX - totalWidth,
                            duration: DURATION,
                            ease: 'none',
                            repeat: -1,
                            modifiers: {
                                x: gsap.utils.unitize(x => gsap.utils.wrap(-totalWidth, 0, parseFloat(x)))
                            }
                        });
                    } else {
                        return gsap.to(wrapper, {
                            x: startX + totalWidth,
                            duration: DURATION,
                            ease: 'none',
                            repeat: -1,
                            modifiers: {
                                x: gsap.utils.unitize(x => gsap.utils.wrap(-totalWidth, 0, parseFloat(x)))
                            }
                        });
                    }
                };

                const setup = () => {
                    wrapper.offsetHeight;
                    totalWidth = originalBlock.offsetWidth;

                    if (direction === 1) {
                        gsap.set(wrapper, { x: 0 });
                        marqueeTween = createAnimation(0);
                    } else {
                        gsap.set(wrapper, { x: -totalWidth });
                        marqueeTween = createAnimation(-totalWidth);
                    }

                    const draggable = Draggable.create(wrapper, {
                        type: 'x',
                        inertia: true,
                        trigger: wrapper,
                        throwProps: true,
                        maxDuration: 1,
                        minDuration: 0.5,
                        overshootTolerance: 0,
                        onPress: function() {
                            marqueeTween.kill();
                        },
                        onDrag: function() {
                            this.x = gsap.utils.wrap(-totalWidth, 0, this.x);
                            gsap.set(wrapper, { x: this.x });
                        },
                        onThrowUpdate: function() {
                            this.x = gsap.utils.wrap(-totalWidth, 0, this.x);
                            gsap.set(wrapper, { x: this.x });
                        },
                        onThrowComplete: function() {
                            const currentX = gsap.getProperty(wrapper, 'x');
                            marqueeTween = createAnimation(currentX);
                        }
                    });

                    this.state.draggables.push(...draggable);
                    this.state.marqueeAnimations.push(marqueeTween);
                };

                setTimeout(setup, 100);
            },

            initMarquee() {
                if (typeof gsap === 'undefined' || typeof Draggable === 'undefined') return;

                const wrapper1 = document.querySelector('.marquee-wrapper-1');
                const wrapper2 = document.querySelector('.marquee-wrapper-2');

                if (wrapper1) this.initMarqueeInfinite(wrapper1, 1);
                if (wrapper2) this.initMarqueeInfinite(wrapper2, -1);
            },

            init() {
                this.truncateText();

                const debouncedTruncate = this.debounce(() => this.truncateText(), 150);
                this.state.truncateResizeHandler = debouncedTruncate;
                window.addEventListener('resize', debouncedTruncate, { passive: true });

                this.initMarquee();

                setTimeout(() => {
                    this.indexBlocks();

                    setTimeout(() => {
                        this.initHover();
                    }, 50);
                }, 150);
            },

            cleanup() {
                if (this.state.truncateResizeHandler) {
                    window.removeEventListener('resize', this.state.truncateResizeHandler);
                    this.state.truncateResizeHandler = null;
                }

                this.state.marqueeAnimations.forEach(tween => {
                    if (tween && tween.kill) tween.kill();
                });
                this.state.marqueeAnimations = [];

                this.state.draggables.forEach(draggable => {
                    if (draggable && draggable[0] && draggable[0].kill) {
                        draggable[0].kill();
                    }
                });
                this.state.draggables = [];

                const wrappers = document.querySelectorAll('.marquee-wrapper-1, .marquee-wrapper-2');
                wrappers.forEach(wrapper => {
                    const blocks = wrapper.querySelectorAll('.marquee-block');
                    for (let i = blocks.length - 1; i > 0; i--) {
                        blocks[i].remove();
                    }
                });

                document.querySelectorAll('.press-hover').forEach(el => {
                    delete el.dataset.hoverInitialized;
                });

                document.querySelectorAll('[data-shuffle]').forEach(el => {
                    delete el.dataset.shuffleInitialized;
                });
            }
        },


        // SCROLL BACK TO TOP
        topButton: {
            state: {
                boundClickHandler: null
            },

            async clickHandler(e) {
                const topButton = e.target.closest('[data-top]');
                if (!topButton) return;
                e.preventDefault();

                const fakeHero = document.querySelector('#fake-hero');
                const lenis = ProjectApp.pageSpecificModule.state.lenisInstance;

                if (!fakeHero) return;

                fakeHero.style.transition = 'height 0.1s ease-out';
                fakeHero.style.height = '100vh';

                await new Promise((resolve) => {
                    const onTransitionEnd = () => {
                        fakeHero.removeEventListener('transitionend', onTransitionEnd);
                        if (lenis) {
                            lenis.resize();
                        }
                        resolve();
                    };
                    fakeHero.addEventListener('transitionend', onTransitionEnd);
                });

                await new Promise(resolve => setTimeout(resolve, 100));

                if (lenis) {
                    await new Promise((resolve) => {
                        lenis.scrollTo('#fake-hero', {
                            offset: 0,
                            duration: 2,
                            immediate: false,
                            lock: false,
                            force: true,
                            onComplete: resolve
                        });
                    });
                } else {
                    const fakeHeroPosition = fakeHero.offsetTop;
                    await new Promise((resolve) => {
                        window.scrollTo({ top: fakeHeroPosition, behavior: 'smooth' });
                        setTimeout(resolve, 100);
                    });
                }

                await new Promise(resolve => setTimeout(resolve, 100));

                if (lenis) {
                    lenis.scrollTo(0, { offset: 0, immediate: true, lock: false, force: true });
                } else {
                    window.scrollTo({ top: 0, behavior: 'auto' });
                }

                fakeHero.style.transition = 'none';
                fakeHero.style.height = '0vh';

                if (lenis) {
                    setTimeout(() => {
                        lenis.resize();
                    }, 100);
                }
            },

            init() {
                this.state.boundClickHandler = this.clickHandler.bind(this);
                document.addEventListener('click', this.state.boundClickHandler);
            },

            cleanup() {
                if (this.state.boundClickHandler) {
                    document.removeEventListener('click', this.state.boundClickHandler);
                    this.state.boundClickHandler = null;
                }
            }
        },


        // LENIS
        lenis: {
            state: {
                boundAnchorHandler: null
            },

            anchorHandler(e) {
                const a = e.target.closest('a[href^="#"]');
                if (!a) return;

                const href = a.getAttribute('href');
                if (href === '#') return;

                const target = document.querySelector(href);
                if (!target) return;

                const lenis = ProjectApp.pageSpecificModule.state.lenisInstance;
                if (!lenis) return;

                e.preventDefault();
                lenis.scrollTo(target, { offset: 0, immediate: false, lock: false, force: true });
            },

            init() {
                const state = ProjectApp.pageSpecificModule.state;

                if (state.lenisInstance) return;
                if (typeof Lenis === 'undefined') return;

                const lenis = new Lenis({
                    lerp: 0.1,
                    normalizeWheel: true,
                    wheelMultiplier: 1.1,
                    smoothWheel: true,
                    syncTouchLerp: 0.1,
                    gestureOrientation: 'vertical',
                });

                state.lenisInstance = lenis;

                const raf = (time) => {
                    lenis.raf(time);
                    state.lenisRafId = requestAnimationFrame(raf);
                };

                state.lenisRafId = requestAnimationFrame(raf);

                this.state.boundAnchorHandler = this.anchorHandler.bind(this);
                document.addEventListener('click', this.state.boundAnchorHandler, true);
            },

            cleanup() {
                const state = ProjectApp.pageSpecificModule.state;

                if (this.state.boundAnchorHandler) {
                    document.removeEventListener('click', this.state.boundAnchorHandler, true);
                    this.state.boundAnchorHandler = null;
                }

                if (state.lenisRafId) {
                    cancelAnimationFrame(state.lenisRafId);
                    state.lenisRafId = null;
                }

                const lenis = state.lenisInstance;
                if (lenis && typeof lenis.destroy === 'function') {
                    lenis.destroy();
                }

                state.lenisInstance = null;
            }
        },



        init: function() {
            this.cleanup();
            this.lenis.init();
            this.scrollingWrapper.init();
            this.audioPlayer.init();
            this.destinations.init();
            this.destinationsHover.init();
            this.press.init();
            this.awards.init();
            this.partners.init();
            this.topButton.init();
            this.navbar.init();
            this.visuals.init();
            this.textScrollAnimation.init();
        },



        cleanup: function() {
            this.audioPlayer.cleanup();
            this.scrollingWrapper.cleanup();
            this.destinations.cleanup();
            this.destinationsHover.cleanup();
            this.press.cleanup();
            this.awards.cleanup();
            this.partners.cleanup();
            this.topButton.cleanup();
            this.navbar.cleanup();
            this.visuals.cleanup();
            this.lenis.cleanup();
            this.textScrollAnimation.cleanup();
        }
    };

    // ============================================
    // REPORTAGE
    // ============================================
    ProjectApp.reportageSwiper = {
        swiperMove: null,
        swiperFade: null,

        get swiper() {
            return this.swiperFade;
        },

        _two(n){ n = Number(n)||0; return n<10 ? ('0'+n) : String(n); },

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
            Array.from(swiper.slides).forEach(slide => {
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
            originals.forEach((slide, i) => {
                slide.setAttribute('data-swiper-slide-index', String(i));
                slide.setAttribute('data-source-index', String(i));
            });
        },

        _duplicateSlidesIfNeeded(wrapper) {
            const slides = Array.from(wrapper.querySelectorAll('.swiper-slide'));
            const slideCount = slides.length;

            if (slideCount > 1 && slideCount < 6) {
                slides.forEach((slide, index) => {
                    const clone = slide.cloneNode(true);
                    clone.classList.add('manual-duplicate');
                    clone.setAttribute('data-swiper-slide-index', index);
                    clone.setAttribute('data-source-index', index);
                    wrapper.appendChild(clone);
                });

                console.log(`Duplicated ${slideCount} slides for better loop functionality`);
            }
        },

        _splitTextIntoLines(element) {
            if (!element || !window.SplitType) return;

            if (element.dataset.splitDone) return;

            new SplitType(element, {
                types: 'lines',
                tagName: 'span'
            });

            element.querySelectorAll('.line').forEach(line => {
                const wrapper = document.createElement('div');
                wrapper.style.overflow = 'hidden';
                line.parentNode.insertBefore(wrapper, line);
                wrapper.appendChild(line);
            });

            element.dataset.splitDone = 'true';
        },

        _prepareTextAnimations(swiper) {
            if (!swiper || !swiper.slides) return;

            Array.from(swiper.slides).forEach(slide => {
                const textAbs = slide.querySelector('.reportage-bottom .text-abs');
                const textMono = slide.querySelector('.reportage-bottom .text-mono');

                if (textAbs) this._splitTextIntoLines(textAbs);
                if (textMono) this._splitTextIntoLines(textMono);
            });
        },

        animateSlideTextLines(swiper) {
            if (!swiper || !swiper.slides || !window.gsap) return;

            Array.from(swiper.slides).forEach(slide => {
                const isPrev = slide.classList.contains('is--prev-logical');
                const isNext = slide.classList.contains('is--next-logical');
                const isActive = slide.classList.contains('is--active-logical');

                const textAbsLines = slide.querySelectorAll('.reportage-bottom .text-abs .line');
                const textMonoLines = slide.querySelectorAll('.reportage-bottom .text-mono .line');
                const allLines = [...textAbsLines, ...textMonoLines];

                if (isPrev) {
                    allLines.forEach((line, i) => {
                        gsap.to(line, {
                            y: '-110%',
                            duration: 0.8,
                            ease: 'power1.out',
                            delay: i * 0.08
                        });
                    });
                }

                if (isNext) {
                    allLines.forEach((line, i) => {
                        gsap.to(line, {
                            y: '110%',
                            duration: 0.8,
                            ease: 'power1.out',
                            delay: i * 0.08
                        });
                    });
                }

                if (isActive) {
                    allLines.forEach((line, i) => {
                        gsap.to(line, {
                            y: '0%',
                            duration: 0.8,
                            ease: 'power1.out',
                            delay: i * 0.08
                        });
                    });
                }
            });
        },

        _assignPermanentNumbers(swiper){
            if (!swiper || !swiper.slides) return;

            const originals = this._getOriginalSlides(swiper);

            originals.forEach((slide, i) => {
                const target = slide.querySelector('[data-slide-index]');
                if (target && !target.dataset.permanentNumber) {
                    const displayNumber = this._two(i + 1);
                    target.textContent = displayNumber;
                    target.dataset.permanentNumber = displayNumber;
                }
            });

            Array.from(swiper.slides).forEach(slide => {
                if (slide.classList.contains('swiper-slide-duplicate')) {
                    const dataIdx = slide.getAttribute('data-swiper-slide-index');
                    if (dataIdx != null) {
                        const original = originals.find(s => s.getAttribute('data-swiper-slide-index') === dataIdx);
                        if (original) {
                            const originalTarget = original.querySelector('[data-slide-index]');
                            const duplicateTarget = slide.querySelector('[data-slide-index]');
                            if (originalTarget && duplicateTarget) {
                                duplicateTarget.textContent = originalTarget.textContent;
                                duplicateTarget.dataset.permanentNumber = originalTarget.dataset.permanentNumber;
                            }
                        }
                    }
                }
            });
        },

        popup: {
            popupInstances: [],
            activePopupIndex: null,

            init() {
                const openButtons = document.querySelectorAll('[data-open-popup]');
                const closeButtons = document.querySelectorAll('[data-close-popup]');
                const originalPopupWrapper = document.querySelector('.popup-wrapper_reportage');

                if (!originalPopupWrapper) return;

                const fadeSwiper = ProjectApp.reportageSwiper.swiperFade;
                if (!fadeSwiper) return;

                const originalSlides = ProjectApp.reportageSwiper._getOriginalSlides(fadeSwiper);
                const slideCount = originalSlides.length;

                this.popupInstances.forEach(instance => {
                    if (instance.wrapper && instance.wrapper !== originalPopupWrapper) {
                        instance.wrapper.remove();
                    }
                });
                this.popupInstances = [];

                originalSlides.forEach((slide, index) => {
                    const isFirst = index === 0;
                    const popupWrapper = isFirst ? originalPopupWrapper : originalPopupWrapper.cloneNode(true);

                    if (!isFirst) {
                        popupWrapper.classList.add(`popup-wrapper_reportage-${index}`);
                        originalPopupWrapper.parentNode.appendChild(popupWrapper);
                    }

                    popupWrapper.style.display = 'none';
                    popupWrapper.dataset.slideIndex = index;

                    const popupBackground = popupWrapper.querySelector('.popup-background');
                    const popupBlock = popupWrapper.querySelector('.popup-block_reportage');
                    const cursorBlock = popupWrapper.querySelector('.cursor-block_reportage');

                    if (popupBackground) popupBackground.style.opacity = '0';
                    if (popupBlock) popupBlock.style.right = '-100%';

                    this.updatePopupContent(popupWrapper, slide);

                    this.initializeTextAnimations(popupWrapper, index);

                    this.popupInstances.push({
                        wrapper: popupWrapper,
                        background: popupBackground,
                        block: popupBlock,
                        cursor: cursorBlock,
                        slideIndex: index
                    });

                    if (cursorBlock) {
                        cursorBlock.style.position = 'fixed';
                        cursorBlock.style.pointerEvents = 'none';
                        cursorBlock.style.left = '0';
                        cursorBlock.style.top = '0';
                        cursorBlock.style.willChange = 'transform';

                        popupWrapper.addEventListener('mousemove', function(e) {
                            const x = e.clientX;
                            const y = e.clientY;

                            cursorBlock.style.transform = `translate(${x}px, ${y}px)`;
                        });
                    }

                    if (popupBackground) {
                        popupBackground.addEventListener('click', (e) => {
                            if (e.target === popupBackground) {
                                this.closePopup(index);
                            }
                        });
                    }

                    if (popupBlock) {
                        popupBlock.addEventListener('click', function(e) {
                            e.stopPropagation();
                        });
                    }
                });

                openButtons.forEach(button => {
                    if (button.dataset.popupListenerAdded) return;
                    button.dataset.popupListenerAdded = 'true';
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.openActivePopup();
                    });
                });

                closeButtons.forEach(button => {
                    if (button.dataset.popupListenerAdded) return;
                    button.dataset.popupListenerAdded = 'true';
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.closeActivePopup();
                    });
                });
            },

            updatePopupContent(popupWrapper, slide) {
                const nameElement = slide.querySelector('.name-large');
                const textAbsElement = slide.querySelector('.text-abs');
                const textRegularElement = slide.querySelector('.text-regular');

                const headingTarget = popupWrapper.querySelector('[data-info-heading]');
                const subheadingTarget = popupWrapper.querySelector('[data-info-subheading]');
                const paragraphTarget = popupWrapper.querySelector('[data-info-paragraph]');

                if (headingTarget && nameElement) {
                    headingTarget.innerHTML = nameElement.innerHTML;
                }

                if (subheadingTarget && textAbsElement) {
                    subheadingTarget.innerHTML = textAbsElement.innerHTML;
                }

                if (paragraphTarget && textRegularElement) {
                    paragraphTarget.innerHTML = textRegularElement.innerHTML;
                }
            },

            initializeTextAnimations(popupWrapper, index) {
                const shuffleElements = popupWrapper.querySelectorAll('[data-shuffle]');

                shuffleElements.forEach(element => {
                    if (element.dataset.popupShuffleInitialized === 'true') {
                        const targetEl = element.querySelector('[data-inner]') || element;
                        targetEl.innerHTML = targetEl.textContent;
                        delete element.dataset.popupShuffleInitialized;
                        delete element.dataset.charElements;
                    }

                    const innerEl = element.querySelector('[data-inner]');
                    const targetEl = innerEl || element;

                    const text = targetEl.textContent;
                    if (!text || text.trim() === '') return;

                    element.dataset.popupShuffleInitialized = 'true';
                    targetEl.textContent = '';
                    targetEl.style.position = 'relative';
                    targetEl.style.display = 'inline-block';
                    targetEl.style.overflow = 'hidden';

                    const chars = text.split('');
                    const charElements = [];

                    chars.forEach((char, charIndex) => {
                        const charWrap = document.createElement('span');
                        charWrap.style.position = 'relative';
                        charWrap.style.display = 'inline-block';
                        charWrap.style.overflow = 'hidden';
                        charWrap.style.verticalAlign = 'top';

                        const charInner = document.createElement('span');
                        charInner.style.display = 'block';
                        charInner.textContent = char;

                        const fromTop = charIndex % 2 === 0;
                        charInner.style.transform = fromTop ? 'translateY(-100%)' : 'translateY(100%)';
                        charInner.style.transition = 'transform 0.5s cubic-bezier(0.65, 0, 0.35, 1)';

                        charWrap.appendChild(charInner);
                        targetEl.appendChild(charWrap);
                        charElements.push({inner: charInner, fromTop});
                    });

                    element.dataset.charElements = JSON.stringify(charElements.map((el, i) => ({
                        index: i,
                        fromTop: el.fromTop
                    })));
                });

                const simpleAnimElements = [
                    ...popupWrapper.querySelectorAll('.popup-top_reportage .text-mono'),
                    ...popupWrapper.querySelectorAll('.popup-heading-top_reportage .text-mono')
                ];

                simpleAnimElements.forEach(element => {
                    if (!element.dataset.simpleAnimInitialized) {
                        element.dataset.simpleAnimInitialized = 'true';
                        element.style.transform = 'translateY(110%)';
                    }
                });

                const lineSplitElements = [
                    ...popupWrapper.querySelectorAll('.popup-heading-wrapper_reportage .name-large'),
                    ...popupWrapper.querySelectorAll('.popup-content .text-regular')
                ];

                const textAbsElements = popupWrapper.querySelectorAll('.popup-heading-wrapper_reportage .text-abs');
                textAbsElements.forEach(element => {
                    if (!element.querySelector('.line')) {
                        lineSplitElements.push(element);
                    } else {
                        this._ensureLinesWrappedAndPositioned(element);
                    }
                });

                lineSplitElements.forEach(element => {
                    if (!element.dataset.lineSplitInitialized) {
                        this._splitTextIntoLinesForPopup(element);
                        element.dataset.lineSplitInitialized = 'true';
                    }
                });
            },

            _splitTextIntoLinesForPopup(element) {
                if (!element || !window.SplitType) return;

                const hasParagraphs = element.querySelector('p');

                if (hasParagraphs) {
                    const paragraphs = element.querySelectorAll('p');

                    paragraphs.forEach(p => {
                        const textContent = p.textContent.replace(/\u200D/g, '').trim(); // Remove ZWJ and trim
                        if (!textContent || textContent === '') {
                            p.style.display = 'none';
                            return;
                        }

                        const originalHTML = p.innerHTML;

                        const originalWidth = p.style.width;
                        const originalMaxWidth = p.style.maxWidth;
                        const computedStyle = window.getComputedStyle(element);
                        const containerWidth = element.offsetWidth || parseInt(computedStyle.width) || 800;

                        p.style.maxWidth = containerWidth + 'px';
                        p.style.width = '100%';

                        const splitInstance = new SplitType(p, {
                            types: 'lines',
                            tagName: 'span',
                            lineClass: 'text-line'
                        });

                        p.style.width = originalWidth || '';
                        p.style.maxWidth = originalMaxWidth || '';

                        const lines = p.querySelectorAll('.text-line');

                        if (lines.length === 1 && textContent.length > 100) {
                            splitInstance.revert();

                            const sentences = originalHTML.split(/(?<=[.!?])\s+/);
                            p.innerHTML = '';

                            sentences.forEach(sentence => {
                                if (sentence.trim()) {
                                    const lineSpan = document.createElement('span');
                                    lineSpan.className = 'text-line';
                                    lineSpan.innerHTML = sentence + ' ';
                                    lineSpan.style.display = 'block';
                                    p.appendChild(lineSpan);
                                }
                            });
                        }
                    });

                    const allLines = element.querySelectorAll('.text-line');
                    allLines.forEach(line => {
                        if (line.parentElement.classList.contains('overflow-hidden')) return;

                        const wrapper = document.createElement('div');
                        wrapper.className = 'overflow-hidden';
                        wrapper.style.overflow = 'hidden';
                        line.parentNode.insertBefore(wrapper, line);
                        wrapper.appendChild(line);

                        line.style.transform = 'translateY(110%)';
                        line.style.display = 'block';
                    });
                } else {
                    new SplitType(element, {
                        types: 'lines',
                        tagName: 'span'
                    });

                    element.querySelectorAll('.line').forEach(line => {
                        const wrapper = document.createElement('div');
                        wrapper.className = 'overflow-hidden';
                        wrapper.style.overflow = 'hidden';
                        line.parentNode.insertBefore(wrapper, line);
                        wrapper.appendChild(line);

                        line.style.transform = 'translateY(110%)';
                        line.style.display = 'block';
                    });
                }
            },

            _ensureLinesWrappedAndPositioned(element) {
                element.querySelectorAll('.line').forEach(line => {
                    if (!line.parentElement.classList.contains('overflow-hidden')) {
                        const wrapper = document.createElement('div');
                        wrapper.className = 'overflow-hidden';
                        wrapper.style.overflow = 'hidden';
                        line.parentNode.insertBefore(wrapper, line);
                        wrapper.appendChild(line);
                    }

                    line.style.transform = 'translateY(110%)';
                    line.style.display = 'block';
                });
            },

            getActiveSlideIndex() {
                const fadeSwiper = ProjectApp.reportageSwiper.swiperFade;
                if (!fadeSwiper) return 0;

                const activeDataIndex = ProjectApp.reportageSwiper._getActiveDataIndex(fadeSwiper);
                return activeDataIndex;
            },

            openActivePopup() {
                const activeIndex = this.getActiveSlideIndex();
                this.openPopup(activeIndex);
            },

            closeActivePopup() {
                if (this.activePopupIndex !== null) {
                    this.closePopup(this.activePopupIndex);
                }
            },

            openPopup(index) {
                const instance = this.popupInstances[index];
                if (!instance) return;

                const barbaContainer = document.querySelector('.barba-container');

                this.activePopupIndex = index;
                instance.wrapper.style.display = 'block';

                if (barbaContainer) {
                    barbaContainer.style.zIndex = '10050';
                }

                requestAnimationFrame(() => {
                    if (instance.background) {
                        instance.background.style.transition = 'opacity 0.6s ease';
                        instance.background.style.opacity = '1';
                    }

                    if (instance.block) {
                        instance.block.style.transition = 'right 0.6s ease';
                        instance.block.style.right = '0%';
                    }

                    const shuffleElements = instance.wrapper.querySelectorAll('[data-shuffle]');
                    shuffleElements.forEach(element => {
                        const targetEl = element.querySelector('[data-inner]') || element;
                        const charWraps = targetEl.querySelectorAll('span > span');

                        charWraps.forEach((charInner, charIndex) => {
                            setTimeout(() => {
                                charInner.style.transform = 'translateY(0%)';
                            }, charIndex * 20);
                        });
                    });

                    const simpleAnimElements = [
                        ...instance.wrapper.querySelectorAll('.popup-top_reportage .text-mono'),
                        ...instance.wrapper.querySelectorAll('.popup-heading-top_reportage .text-mono')
                    ];

                    simpleAnimElements.forEach((element, index) => {
                        if (window.gsap) {
                            gsap.to(element, {
                                y: '0%',
                                duration: 0.8,
                                ease: 'power1.out',
                                delay: index * 0.08
                            });
                        } else {
                            setTimeout(() => {
                                element.style.transition = 'transform 0.8s ease-out';
                                element.style.transform = 'translateY(0%)';
                            }, index * 80);
                        }
                    });

                    const lineSplitSelectors = [
                        '.popup-heading-wrapper_reportage .name-large .line',
                        '.popup-heading-wrapper_reportage .text-abs .line',
                        '.popup-content .text-regular .line',
                        '.popup-content .text-regular .text-line'
                    ];

                    const allLines = [];
                    lineSplitSelectors.forEach(selector => {
                        const lines = instance.wrapper.querySelectorAll(selector);
                        allLines.push(...lines);
                    });

                    allLines.forEach((line, lineIndex) => {
                        if (window.gsap) {
                            gsap.to(line, {
                                y: '0%',
                                duration: 0.8,
                                ease: 'power1.out',
                                delay: lineIndex * 0.08
                            });
                        } else {
                            setTimeout(() => {
                                line.style.transition = 'transform 0.8s ease-out';
                                line.style.transform = 'translateY(0%)';
                            }, lineIndex * 80);
                        }
                    });
                });
            },

            closePopup(index) {
                const instance = this.popupInstances[index];
                if (!instance) return;

                const barbaContainer = document.querySelector('.barba-container');

                const shuffleElements = instance.wrapper.querySelectorAll('[data-shuffle]');
                shuffleElements.forEach(element => {
                    const targetEl = element.querySelector('[data-inner]') || element;
                    const charWraps = targetEl.querySelectorAll('span > span');
                    const charData = JSON.parse(element.dataset.charElements || '[]');

                    charWraps.forEach((charInner, charIndex) => {
                        const fromTop = charData[charIndex]?.fromTop;
                        setTimeout(() => {
                            charInner.style.transform = fromTop ? 'translateY(-100%)' : 'translateY(100%)';
                        }, charIndex * 20);
                    });
                });

                const simpleAnimElements = [
                    ...instance.wrapper.querySelectorAll('.popup-top_reportage .text-mono'),
                    ...instance.wrapper.querySelectorAll('.popup-heading-top_reportage .text-mono')
                ];

                simpleAnimElements.forEach((element, index) => {
                    if (window.gsap) {
                        gsap.to(element, {
                            y: '110%',
                            duration: 0.8,
                            ease: 'power1.out',
                            delay: index * 0.08
                        });
                    } else {
                        setTimeout(() => {
                            element.style.transform = 'translateY(110%)';
                        }, index * 80);
                    }
                });

                const lineSplitSelectors = [
                    '.popup-heading-wrapper_reportage .name-large .line',
                    '.popup-heading-wrapper_reportage .text-abs .line',
                    '.popup-content .text-regular .line',
                    '.popup-content .text-regular .text-line'
                ];

                const allLines = [];
                lineSplitSelectors.forEach(selector => {
                    const lines = instance.wrapper.querySelectorAll(selector);
                    allLines.push(...lines);
                });

                allLines.forEach((line, lineIndex) => {
                    if (window.gsap) {
                        gsap.to(line, {
                            y: '110%',
                            duration: 0.8,
                            ease: 'power1.out',
                            delay: lineIndex * 0.08
                        });
                    } else {
                        setTimeout(() => {
                            line.style.transform = 'translateY(110%)';
                        }, lineIndex * 80);
                    }
                });

                if (instance.background) {
                    instance.background.style.opacity = '0';
                }

                if (instance.block) {
                    instance.block.style.right = '-100%';
                }

                setTimeout(() => {
                    instance.wrapper.style.display = 'none';
                    this.activePopupIndex = null;

                    if (barbaContainer) {
                        barbaContainer.style.zIndex = '1';
                    }
                }, 600);
            },

            cleanup() {
                this.popupInstances.forEach((instance, index) => {
                    if (index > 0 && instance.wrapper) {
                        instance.wrapper.remove();
                    }
                });
                this.popupInstances = [];
                this.activePopupIndex = null;

                const openButtons = document.querySelectorAll('[data-open-popup]');
                const closeButtons = document.querySelectorAll('[data-close-popup]');

                openButtons.forEach(button => {
                    delete button.dataset.popupListenerAdded;
                });

                closeButtons.forEach(button => {
                    delete button.dataset.popupListenerAdded;
                });
            }
        },

        _getActiveDataIndex(swiper){
            const activeEl = (swiper && swiper.slides) ? swiper.slides[swiper.activeIndex] : null;
            let idx = this._getDataIndex(activeEl);
            if (idx == null && swiper) {
                const set = this._getUniqueDataIndices(swiper);
                if (set.length) {
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
            const i = pos === -1 ? 0 : pos;
            const prev = set[(i - 1 + N) % N];
            const next = set[(i + 1) % N];
            return { prev, next, active: activeIdxVal, N, indices:set };
        },

        applyLogicalPrevNextClasses(swiper){
            if (!swiper || !swiper.wrapperEl) return;
            Array.from(swiper.slides).forEach(el=>el.classList.remove('is--prev-logical','is--next-logical','is--active-logical'));
            this._mirrorSourceIndexToDuplicates(swiper);

            const { prev, active, next, N } = this.getLogicalNeighbors(swiper);
            if (!N) return;

            this._forEachByDataIndex(swiper, prev,   el => el.classList.add('is--prev-logical'));
            this._forEachByDataIndex(swiper, active, el => el.classList.add('is--active-logical'));
            this._forEachByDataIndex(swiper, next,   el => el.classList.add('is--next-logical'));
        },

        _attachGuards(swiper){
            if (!swiper || !swiper.on) return;
            const refresh = () => {
                if (!swiper || !swiper.slides) return;
                try { swiper.updateSlides(); swiper.updateProgress(); swiper.updateSlidesClasses(); } catch(e){}
                this._mirrorSourceIndexToDuplicates(swiper);
                this.applyLogicalPrevNextClasses(swiper);
                this.animateSlideTextLines(swiper);
            };
            swiper.on('init', refresh);
            swiper.on('slideChange', refresh);
            swiper.on('slideChangeTransitionStart', refresh);
            setTimeout(refresh, 0);
            setTimeout(refresh, 60);
        },

        _syncSwipers(moveSwiper, fadeSwiper) {
            if (!moveSwiper || !fadeSwiper) return;

            const module = this;

            const syncFadeToMove = () => {
                const moveIndex = moveSwiper.realIndex;

                if (fadeSwiper.params.loop) {
                    fadeSwiper.slideToLoop(moveIndex, 0, false);
                } else {
                    fadeSwiper.slideTo(moveIndex, 0, false);
                }

                module._mirrorSourceIndexToDuplicates(fadeSwiper);
                module.applyLogicalPrevNextClasses(fadeSwiper);
                module.animateSlideTextLines(fadeSwiper);
            };

            moveSwiper.on('slideChange', syncFadeToMove);
            moveSwiper.on('slideChangeTransitionStart', syncFadeToMove);
            moveSwiper.on('slideChangeTransitionEnd', syncFadeToMove);

            setTimeout(syncFadeToMove, 0);
        },

        cleanup() {
            if (this.swiperMove) {
                try {
                    this.swiperMove.destroy(true, true);
                } catch(e) {
                }
                this.swiperMove = null;
            }

            if (this.swiperFade) {
                try {
                    this.swiperFade.destroy(true, true);
                } catch(e) {
                }
                this.swiperFade = null;
            }

            const openButtons = document.querySelectorAll('[data-open-popup]');
            const closeButtons = document.querySelectorAll('[data-close-popup]');
            const popupBackground = document.querySelector('.popup-wrapper_reportage .popup-background');

            openButtons.forEach(button => {
                delete button.dataset.popupListenerAdded;
            });

            closeButtons.forEach(button => {
                delete button.dataset.popupListenerAdded;
            });

            if (popupBackground) {
                const newBg = popupBackground.cloneNode(true);
                popupBackground.parentNode.replaceChild(newBg, popupBackground);
            }

            if (this.popup && this.popup.cleanup) {
                this.popup.cleanup();
            }

            const shuffleElements = document.querySelectorAll('[data-shuffle]');
            shuffleElements.forEach(element => {
                delete element.dataset.popupShuffleInitialized;
                delete element.dataset.charElements;
            });
        },

        init() {
            const swiperMoveEl = document.querySelector('.swiper.reportage-move');
            const swiperFadeEl = document.querySelector('.swiper.reportage-fade');

            if (!swiperMoveEl || !swiperFadeEl) {
                return null;
            }

            if (this.swiperMove || this.swiperFade) {
                this.cleanup();
            }

            const wrapperMove = swiperMoveEl.querySelector('.swiper-wrapper');
            const wrapperFade = swiperFadeEl.querySelector('.swiper-wrapper');

            if (!wrapperMove || !wrapperFade) return null;

            this._duplicateSlidesIfNeeded(wrapperMove);
            this._duplicateSlidesIfNeeded(wrapperFade);

            this._assignSourceIndices(wrapperMove);
            this._assignSourceIndices(wrapperFade);

            const slidesMove = Array.from(wrapperMove.querySelectorAll('.swiper-slide'));
            const slidesFade = Array.from(wrapperFade.querySelectorAll('.swiper-slide'));
            const enableLoop = slidesMove.length > 1;

            const module = this;

            const swiperFadeInstance = new Swiper('.swiper.reportage-fade', {
                loop: enableLoop,
                loopPreventsSliding: true,
                loopAdditionalSlides: 0,
                speed: 0,
                slidesPerView: 1,
                centeredSlides: false,
                allowTouchMove: false,
                simulateTouch: false,
                touchRatio: 0,
                watchSlidesProgress: true,
                normalizeSlideIndex: true,
                effect: 'fade',
                fadeEffect: { crossFade: true },
                mousewheel: false,
                keyboard: false,
                initialSlide: 1,
                on: {
                    init: function () {
                        const s = this;
                        requestAnimationFrame(() => {
                            if (s.params && s.params.loop) { s.slideToLoop(0, 0, false); } else { s.slideTo(0, 0, false); }
                            try { s.updateSlides(); s.updateProgress(); s.updateSlidesClasses(); } catch(e){}
                            module._mirrorSourceIndexToDuplicates(s);
                            module.applyLogicalPrevNextClasses(s);
                            module._assignPermanentNumbers(s);
                            module._prepareTextAnimations(s);
                            module.animateSlideTextLines(s);

                            if (ProjectApp.animations && ProjectApp.animations.initPosterBlockAnimations) {
                                ProjectApp.animations.initPosterBlockAnimations();
                            }
                        });
                        module._attachGuards(s);
                    }
                }
            });

            const swiperMoveInstance = new Swiper('.swiper.reportage-move', {
                loop: enableLoop,
                loopPreventsSliding: true,
                loopAdditionalSlides: 3,
                speed: 400,
                slidesPerView: 3,
                slideToClickedSlide: true,
                centeredSlides: true,
                allowTouchMove: true,
                simulateTouch: false,
                touchRatio: 0,
                watchSlidesProgress: true,
                normalizeSlideIndex: true,
                mousewheel: {
                    enabled: true,
                    sensitivity: 1,
                    releaseOnEdges: false,
                    thresholdDelta: 6,
                    thresholdTime: 1000,
                    eventsTarget: 'container'
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: false,
                    type: 'custom',
                    renderCustom: function (swiper, current, total) {
                        const module = ProjectApp.reportageSwiper;
                        const originalSlides = module._getOriginalSlides(swiper);
                        const originalCount = originalSlides.length;
                        const actualCurrent = (swiper.realIndex % originalCount) + 1;

                        return actualCurrent + ' / ' + originalCount;
                    }
                },
                initialSlide: 1,
                on: {
                    init: function () {
                        const s = this;
                        requestAnimationFrame(() => {
                            if (s.params && s.params.loop) { s.slideToLoop(0, 0, false); } else { s.slideTo(0, 0, false); }
                            try { s.updateSlides(); s.updateProgress(); s.updateSlidesClasses(); } catch(e){}

                            module._mirrorSourceIndexToDuplicates(s);

                            module._syncSwipers(s, swiperFadeInstance);
                        });
                    }
                }
            });

            this._syncSwipers(swiperMoveInstance, swiperFadeInstance);

            this.swiperMove = swiperMoveInstance;
            this.swiperFade = swiperFadeInstance;

            setTimeout(() => {
                this.popup.init();
            }, 100);

            return { move: swiperMoveInstance, fade: swiperFadeInstance };
        }
    };


    // ============================================
    // ANIMATIONS
    // ============================================
    ProjectApp.animations = {
        initLinkHover() {
            ProjectApp.animations.cleanupLinkHover();
            const navLinks = Array.from(document.querySelectorAll('[data-shuffle]'))
                .filter(el =>
                    !el.closest('.swiper-slide') &&
                    !el.closest('.project-item') &&
                    !el.closest('.press-hover')
                );
            navLinks.forEach((link) => {
                ProjectApp.animations.initShuffleHover(link);
            });
        },

        initShuffleHover(element) {
            if (element.closest('.swiper-slide') || element.closest('.project-item') || element.closest('.guilds-image-wrapper') || element.closest('.press-hover')) return;

            const innerEl = element.querySelector('[data-inner]');
            const targetEl = innerEl || element;
            const originalText = targetEl.textContent;

            if (getComputedStyle(targetEl).position === 'static') {
                targetEl.style.position = 'relative';
            }

            const split = new SplitType(targetEl, {types: 'chars'});
            const originalChars = split.chars;
            const duplicateChars = [];

            originalChars.forEach((char, index) => {
                char.style.position = 'relative';
                const dup = char.cloneNode(true);
                dup.style.position = 'absolute';

                const cr = char.getBoundingClientRect();
                const lr = targetEl.getBoundingClientRect();

                dup.style.left = (cr.left - lr.left) + 'px';
                dup.style.top = (cr.top - lr.top) + 'px';

                const cs = getComputedStyle(char);
                dup.style.width = cr.width + 'px';
                dup.style.height = cr.height + 'px';
                dup.style.fontSize = cs.fontSize;
                dup.style.fontWeight = cs.fontWeight;
                dup.style.lineHeight = cs.lineHeight;
                dup.style.letterSpacing = cs.letterSpacing;
                dup.style.textTransform = cs.textTransform;
                dup.style.fontFamily = cs.fontFamily;
                dup.style.margin = '0';
                dup.style.padding = '0';
                dup.style.zIndex = '1';
                char.style.zIndex = '2';

                const fromBottom = index % 2 === 0;
                gsap.set(dup, {yPercent: fromBottom ? 100 : -100});

                targetEl.appendChild(dup);
                duplicateChars.push(dup);
            });

            let resizeTO;
            const onResize = () => {
                clearTimeout(resizeTO);
                resizeTO = setTimeout(() => {
                    const lr = targetEl.getBoundingClientRect();
                    originalChars.forEach((char, i) => {
                        const cr = char.getBoundingClientRect();
                        const dup = duplicateChars[i];
                        dup.style.left = (cr.left - lr.left) + 'px';
                        dup.style.top = (cr.top - lr.top) + 'px';
                        dup.style.width = cr.width + 'px';
                        dup.style.height = cr.height + 'px';
                    });
                }, 100);
            };
            window.addEventListener('resize', onResize);

            let tl = null;
            const onEnter = () => {
                if (tl) tl.kill();

                const lr = targetEl.getBoundingClientRect();
                originalChars.forEach((char, i) => {
                    const cr = char.getBoundingClientRect();
                    const dup = duplicateChars[i];
                    dup.style.left = (cr.left - lr.left) + 'px';
                    dup.style.top = (cr.top - lr.top) + 'px';
                });

                tl = gsap.timeline();
                originalChars.forEach((char, i) => {
                    const fromBottom = i % 2 === 0;
                    tl.to(char, {
                        yPercent: fromBottom ? -100 : 100,
                        duration: 0.5,
                        ease: 'power3.inOut'
                    }, 0);
                    tl.to(duplicateChars[i], {
                        yPercent: 0,
                        duration: 0.5,
                        ease: 'power3.inOut'
                    }, 0);
                });
            };

            const onLeave = () => {
                if (tl) tl.kill();

                tl = gsap.timeline();
                originalChars.forEach((char, i) => {
                    const fromBottom = i % 2 === 0;
                    tl.to(char, {
                        yPercent: 0,
                        duration: 0.5,
                        ease: 'power3.inOut'
                    }, 0);
                    tl.to(duplicateChars[i], {
                        yPercent: fromBottom ? 100 : -100,
                        duration: 0.5,
                        ease: 'power3.inOut'
                    }, 0);
                });
            };

            element.addEventListener('mouseenter', onEnter);
            element.addEventListener('mouseleave', onLeave);

            ProjectApp.state.linkHoverState.items.push({
                link: element,
                split,
                originalText,
                originalChars,
                duplicateChars,
                onEnter,
                onLeave,
                onResize
            });
        },

        initAlternatingShuffleForElement(element) {
            const isInSwiper = element.closest('.swiper-slide');
            const isInProject = element.closest('.project-item');
            const isInGuilds = element.closest('.guilds-image-wrapper');
            const isInPress = element.closest('.press-hover');

            if (!isInSwiper && !isInProject && !isInGuilds && !isInPress) return;

            if (element.dataset.shuffleInitialized === 'true') return;

            const innerEl = element.querySelector('[data-inner]');
            const targetEl = innerEl || element;

            const existingSpans = targetEl.querySelectorAll('span > span');
            if (existingSpans.length > 0) {
                element.dataset.shuffleInitialized = 'true';
                return;
            }

            const text = targetEl.textContent;
            if (!text || text.trim() === '') return;

            element.dataset.shuffleInitialized = 'true';
            targetEl.textContent = '';
            targetEl.style.position = 'relative';
            targetEl.style.display = 'inline-block';
            targetEl.style.overflow = 'hidden';

            const chars = text.split('');
            const charElements = [];

            chars.forEach((char, index) => {
                const charWrap = document.createElement('span');
                charWrap.style.position = 'relative';
                charWrap.style.display = 'inline-block';
                charWrap.style.overflow = 'hidden';
                charWrap.style.verticalAlign = 'top';

                const charInner = document.createElement('span');
                charInner.style.display = 'block';
                charInner.textContent = char;

                const fromTop = index % 2 === 0;
                charInner.style.transform = fromTop ? 'translateY(-100%)' : 'translateY(100%)';

                charWrap.appendChild(charInner);
                targetEl.appendChild(charWrap);
                charElements.push({inner: charInner, fromTop});
            });

            let isInside = false;

            element.addEventListener('mouseenter', function() {
                if (isInside) return;
                isInside = true;
                charElements.forEach(({inner}) => {
                    inner.style.transition = 'transform 0.5s cubic-bezier(0.65, 0, 0.35, 1)';
                    requestAnimationFrame(() => {
                        inner.style.transform = 'translateY(0)';
                    });
                });
            }, true);

            element.addEventListener('mouseleave', function() {
                if (!isInside) return;
                isInside = false;
                charElements.forEach(({inner, fromTop}) => {
                    inner.style.transition = 'transform 0.5s cubic-bezier(0.65, 0, 0.35, 1)';
                    inner.style.transform = fromTop ? 'translateY(-100%)' : 'translateY(100%)';
                });
            }, true);
        },

        addHoverAnimationToSwiperSlides(swiper) {
            if (!swiper || !swiper.slides || !Array.isArray(swiper.slides)) return;

            const slides = swiper.slides;
            slides.forEach(slide => {
                if (slide.classList.contains('swiper-slide-duplicate')) return;
                if (slide.dataset.animationsInitialized === 'true') return;

                slide.dataset.animationsInitialized = 'true';

                const wrappers = slide.querySelectorAll('.video-hover-wrapper');
                wrappers.forEach(wrap => {
                    const inner = wrap.querySelector('.video-hover-inner');
                    if (!inner) return;

                    if (getComputedStyle(wrap).position === 'static') {
                        wrap.style.position = 'relative';
                    }

                    inner.style.position = 'absolute';
                    inner.style.left = '50%';
                    inner.style.top = '50%';
                    inner.style.transform = 'translate(-50%, -50%)';
                    inner.style.pointerEvents = 'none';

                    let isHovering = false;

                    wrap.addEventListener('mouseenter', function(e) {
                        isHovering = true;
                        const r = wrap.getBoundingClientRect();
                        const x = e.clientX - r.left;
                        const y = e.clientY - r.top;
                        inner.style.transform = `translate(calc(-50% + ${x - r.width/2}px), calc(-50% + ${y - r.height/2}px))`;
                    });

                    wrap.addEventListener('mousemove', function(e) {
                        if (!isHovering) return;
                        const r = wrap.getBoundingClientRect();
                        const x = e.clientX - r.left;
                        const y = e.clientY - r.top;
                        inner.style.transform = `translate(calc(-50% + ${x - r.width/2}px), calc(-50% + ${y - r.height/2}px))`;
                    });

                    wrap.addEventListener('mouseleave', function() {
                        isHovering = false;
                        inner.style.transform = 'translate(-50%, -50%)';
                    });
                });

                const shuffleElements = slide.querySelectorAll('[data-shuffle]');
                shuffleElements.forEach(shuffleEl => {
                    ProjectApp.animations.initAlternatingShuffleForElement(shuffleEl);
                });
            });
        },

        addHoverAnimationToPosterBlock(posterBlock) {
            const wrappers = posterBlock.querySelectorAll('.report-hover-wrapper');
            wrappers.forEach(wrap => {
                const inner = wrap.querySelector('.video-hover-inner');
                if (!inner) return;

                if (getComputedStyle(wrap).position === 'static') {
                    wrap.style.position = 'relative';
                }
                wrap.style.pointerEvents = 'auto';

                inner.style.position = 'absolute';
                inner.style.left = '50%';
                inner.style.top = '50%';
                inner.style.transform = 'translate(-50%, -50%)';
                inner.style.pointerEvents = 'none';

                let isHovering = false;

                wrap.addEventListener('mouseenter', function(e) {
                    isHovering = true;
                    const r = wrap.getBoundingClientRect();
                    const x = e.clientX - r.left;
                    const y = e.clientY - r.top;
                    inner.style.transform = `translate(calc(-50% + ${x - r.width/2}px), calc(-50% + ${y - r.height/2}px))`;
                });

                wrap.addEventListener('mousemove', function(e) {
                    if (!isHovering) return;
                    const r = wrap.getBoundingClientRect();
                    const x = e.clientX - r.left;
                    const y = e.clientY - r.top;
                    inner.style.transform = `translate(calc(-50% + ${x - r.width/2}px), calc(-50% + ${y - r.height/2}px))`;
                });

                wrap.addEventListener('mouseleave', function() {
                    isHovering = false;
                    inner.style.transform = 'translate(-50%, -50%)';
                });
            });

            const shuffleElements = posterBlock.querySelectorAll('[data-shuffle]');
            shuffleElements.forEach(shuffleEl => {
                ProjectApp.animations.initAlternatingShuffleForElement(shuffleEl);
            });

            if (!posterBlock.dataset.clickHandlerAdded) {
                posterBlock.dataset.clickHandlerAdded = 'true';
                posterBlock.style.cursor = 'pointer';
                posterBlock.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    const isAdding = !posterBlock.classList.contains('is--large');
                    posterBlock.classList.toggle('is--large');

                    const cursorTextBlock = posterBlock.querySelector('.cursor-text-block');
                    if (cursorTextBlock) {
                        if (isAdding) {
                            cursorTextBlock.style.transform = 'translateY(-100%)';
                        } else {
                            cursorTextBlock.style.transform = 'translateY(0%)';
                        }
                    }

                    const infoWrapper = document.querySelector('.info-wrapper');
                    if (infoWrapper) {
                        if (isAdding) {
                            infoWrapper.style.zIndex = '0';
                        } else {
                            infoWrapper.style.zIndex = '900';
                        }
                    }

                    if (isAdding) {
                        if (typeof ScrollTrigger !== 'undefined') {
                            ScrollTrigger.getAll().forEach(trigger => trigger.disable());
                        }

                        if (window.swiperInstance) {
                            window.swiperInstance.allowSlideNext = false;
                            window.swiperInstance.allowSlidePrev = false;
                            window.swiperInstance.allowTouchMove = false;
                        }

                        const activeSlide = document.querySelector('.swiper-slide-active');
                        const prevSlide = document.querySelector('.swiper-slide.is--prev-logical');

                        if (activeSlide) {
                            const previewWrapper = activeSlide.querySelector('.preview-wrapper_reportage');
                            if (previewWrapper) {
                                const previewBlocks = previewWrapper.querySelectorAll('.preview-block_reportage');
                                if (previewBlocks[0]) {
                                    previewBlocks[0].style.clipPath = 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)';
                                }
                                if (previewBlocks[1]) {
                                    previewBlocks[1].style.clipPath = 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)';
                                }
                            }
                        }

                        if (prevSlide) {
                            const previewWrapper = prevSlide.querySelector('.preview-wrapper_reportage');
                            if (previewWrapper) {
                                const previewBlocks = previewWrapper.querySelectorAll('.preview-block_reportage');
                                if (previewBlocks[0]) {
                                    previewBlocks[0].style.clipPath = 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)';
                                }
                                if (previewBlocks[1]) {
                                    previewBlocks[1].style.clipPath = 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)';
                                }
                            }
                        }
                    } else {
                        if (typeof ScrollTrigger !== 'undefined') {
                            ScrollTrigger.getAll().forEach(trigger => trigger.enable());
                        }

                        if (window.swiperInstance) {
                            window.swiperInstance.allowSlideNext = true;
                            window.swiperInstance.allowSlidePrev = true;
                            window.swiperInstance.allowTouchMove = true;
                        }

                        const activeSlide = document.querySelector('.swiper-slide-active');
                        const prevSlide = document.querySelector('.swiper-slide.is--prev-logical');

                        if (activeSlide) {
                            const previewWrapper = activeSlide.querySelector('.preview-wrapper_reportage');
                            if (previewWrapper) {
                                const previewBlocks = previewWrapper.querySelectorAll('.preview-block_reportage');
                                if (previewBlocks[0]) {
                                    previewBlocks[0].style.clipPath = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
                                }
                                if (previewBlocks[1]) {
                                    previewBlocks[1].style.clipPath = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
                                }
                            }
                        }

                        if (prevSlide) {
                            const previewWrapper = prevSlide.querySelector('.preview-wrapper_reportage');
                            if (previewWrapper) {
                                const previewBlocks = previewWrapper.querySelectorAll('.preview-block_reportage');
                                if (previewBlocks[0]) {
                                    previewBlocks[0].style.clipPath = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
                                }
                                if (previewBlocks[1]) {
                                    previewBlocks[1].style.clipPath = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
                                }
                            }
                        }
                    }
                });
            }
        },

        initPosterBlockAnimations() {
            const posterBlocks = document.querySelectorAll('.poster-block');
            posterBlocks.forEach(posterBlock => {
                if (posterBlock.dataset.posterAnimationsInitialized === 'true') return;
                posterBlock.dataset.posterAnimationsInitialized = 'true';
                ProjectApp.animations.addHoverAnimationToPosterBlock(posterBlock);
            });
        },

        initBackgroundImageHover() {
            if (window.innerWidth < 768) return;

            let activeIndex = 0;
            const bgImages = document.querySelectorAll('.background-image');
            let isTransitioning = false;

            if (bgImages.length >= 2) {
                bgImages[0].style.clipPath = 'polygon(0 50%, 100% 50%, 100% 50%, 0 50%)';
                bgImages[0].style.zIndex = '2';
                bgImages[1].style.clipPath = 'polygon(0 50%, 100% 50%, 100% 50%, 0 50%)';
                bgImages[1].style.zIndex = '1';
            }

            function handleProjectHover(projectItem) {
                if (isTransitioning) return;

                const listVideo = projectItem.querySelector('.list-video');
                if (!listVideo) return;

                const newSrc = listVideo.src || listVideo.getAttribute('src');
                if (!newSrc) return;

                const currentImage = bgImages[activeIndex];
                const currentSrc = currentImage.src || currentImage.getAttribute('src');
                if (newSrc === currentSrc) return;

                isTransitioning = true;
                const nextIndex = activeIndex === 0 ? 1 : 0;
                const incoming = bgImages[nextIndex];
                const current = bgImages[activeIndex];

                incoming.style.transition = 'none';
                incoming.style.clipPath = 'polygon(0 50%, 100% 50%, 100% 50%, 0 50%)';
                incoming.style.zIndex = '5';
                incoming.src = newSrc;

                const transitionImages = () => {
                    requestAnimationFrame(() => {
                        incoming.style.transition = 'clip-path 600ms cubic-bezier(0.75, 0, 0, 1)';
                        incoming.style.clipPath = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
                        current.style.transition = 'clip-path 600ms cubic-bezier(0.75, 0, 0, 1) 600ms';
                        current.style.clipPath = 'polygon(0% 50%, 100% 50%, 100% 50%, 0% 50%)';
                        current.style.zIndex = '4';

                        setTimeout(() => {
                            incoming.style.zIndex = '3';
                            current.style.zIndex = '2';
                            activeIndex = nextIndex;
                            isTransitioning = false;
                        }, 600);
                    });
                };

                if (incoming.complete && incoming.naturalWidth !== 0) {
                    transitionImages();
                } else {
                    incoming.onload = transitionImages;
                }
            }

            document.querySelectorAll('.project-item').forEach(item => {
                item.addEventListener('mouseenter', function() {
                    handleProjectHover(this);
                });
            });

            return handleProjectHover;
        },

        initBackgroundHoverBlock() {
            const hoverWrappers = document.querySelectorAll('.hover-wrapper');

            hoverWrappers.forEach(wrapper => {
                const hoverBlock = wrapper.querySelector('.background-hover-block');
                if (!hoverBlock) return;

                const magnifiedImage = hoverBlock.querySelector('.magnified-image, img');
                if (!magnifiedImage) return;

                const hasPointer = window.matchMedia('(pointer: fine)').matches;
                if (!hasPointer) return;

                if (getComputedStyle(wrapper).position === 'static') {
                    wrapper.style.position = 'relative';
                }
                wrapper.style.overflow = 'hidden';

                hoverBlock.style.position = 'absolute';
                hoverBlock.style.overflow = 'hidden';
                hoverBlock.style.opacity = '0';
                hoverBlock.style.pointerEvents = 'none';
                hoverBlock.style.transition = 'opacity 0.5s cubic-bezier(0.75, 0, 0.25, 1)';

                magnifiedImage.style.position = 'absolute';
                magnifiedImage.style.objectFit = 'cover';

                let isHovering = false;
                let runAnimation = false;
                let containerRect = null;
                const magnification = 1.15;
                const speed = 0.15;

                let mouse = { x: 0, y: 0 };
                let current = { x: 0, y: 0 };

                const lerp = (start, end, factor) => start + (end - start) * factor;

                const animate = () => {
                    if (!runAnimation || !containerRect) return;

                    current.x = lerp(current.x, mouse.x, speed);
                    current.y = lerp(current.y, mouse.y, speed);

                    const lensRect = hoverBlock.getBoundingClientRect();
                    const lensWidth = lensRect.width;
                    const lensHeight = lensRect.height;

                    const relativeX = current.x - containerRect.left;
                    const relativeY = current.y - containerRect.top;

                    hoverBlock.style.left = `${relativeX - lensWidth / 2}px`;
                    hoverBlock.style.top = `${relativeY - lensHeight / 2}px`;

                    const percentX = relativeX / containerRect.width;
                    const percentY = relativeY / containerRect.height;

                    const imgWidth = containerRect.width * magnification;
                    const imgHeight = containerRect.height * magnification;

                    magnifiedImage.style.width = `${imgWidth}px`;
                    magnifiedImage.style.height = `${imgHeight}px`;

                    const offsetX = -percentX * imgWidth + lensWidth / 2;
                    const offsetY = -percentY * imgHeight + lensHeight / 2;

                    magnifiedImage.style.left = `${offsetX}px`;
                    magnifiedImage.style.top = `${offsetY}px`;

                    requestAnimationFrame(animate);
                };

                const updateMousePosition = (e) => {
                    mouse.x = e.clientX;
                    mouse.y = e.clientY;
                };

                const initializeOnWrapper = () => {
                    containerRect = wrapper.getBoundingClientRect();

                    const centerX = containerRect.left + containerRect.width / 2;
                    const centerY = containerRect.top + containerRect.height / 2;

                    mouse.x = centerX;
                    mouse.y = centerY;
                    current.x = centerX;
                    current.y = centerY;

                    hoverBlock.style.opacity = '1';

                    runAnimation = true;
                    animate();
                };

                const wrapperRect = wrapper.getBoundingClientRect();
                const isInViewport = wrapperRect.top < window.innerHeight && wrapperRect.bottom > 0;

                if (isInViewport) {
                    setTimeout(initializeOnWrapper, 100);
                }

                wrapper.addEventListener('mouseenter', function(e) {
                    if (!runAnimation) {
                        initializeOnWrapper();
                    }
                    isHovering = true;
                    mouse.x = e.clientX;
                    mouse.y = e.clientY;
                    hoverBlock.style.opacity = '1';
                });

                wrapper.addEventListener('mousemove', updateMousePosition);

                wrapper.addEventListener('mouseleave', function() {
                    isHovering = false;
                    hoverBlock.style.opacity = '0';
                });
            });
        },

        addHoverAnimationToListItem(item) {
            const wrappers = item.querySelectorAll('.video-hover-wrapper');
            wrappers.forEach(wrap => {
                const inner = wrap.querySelector('.video-hover-inner');
                if (!inner) return;

                if (getComputedStyle(wrap).position === 'static') {
                    wrap.style.position = 'relative';
                }
                wrap.style.pointerEvents = 'auto';

                inner.style.position = 'absolute';
                inner.style.left = '50%';
                inner.style.top = '50%';
                inner.style.transform = 'translate(-50%, -50%)';
                inner.style.pointerEvents = 'none';

                let isHovering = false;

                wrap.addEventListener('mouseenter', function(e) {
                    isHovering = true;
                    const r = wrap.getBoundingClientRect();
                    const x = e.clientX - r.left;
                    const y = e.clientY - r.top;
                    inner.style.transform = `translate(calc(-50% + ${x - r.width/2}px), calc(-50% + ${y - r.height/2}px))`;
                });

                wrap.addEventListener('mousemove', function(e) {
                    if (!isHovering) return;
                    const r = wrap.getBoundingClientRect();
                    const x = e.clientX - r.left;
                    const y = e.clientY - r.top;
                    inner.style.transform = `translate(calc(-50% + ${x - r.width/2}px), calc(-50% + ${y - r.height/2}px))`;
                });

                wrap.addEventListener('mouseleave', function() {
                    isHovering = false;
                    inner.style.transform = 'translate(-50%, -50%)';
                });
            });

            if (ProjectApp.state.backgroundHoverHandler) {
                item.addEventListener('mouseenter', function() {
                    ProjectApp.state.backgroundHoverHandler(this);
                });
            }

            const shuffleElements = item.querySelectorAll('[data-shuffle]');
            shuffleElements.forEach(shuffleEl => {
                ProjectApp.animations.initAlternatingShuffleForElement(shuffleEl);
            });
        },

        initGuildsAnimations() {
            const guildsElements = document.querySelectorAll('.guilds-image-wrapper [data-shuffle]');
            guildsElements.forEach(element => {
                ProjectApp.animations.initAlternatingShuffleForElement(element);
            });
        },

        initPressAnimations() {
            const pressElements = document.querySelectorAll('.press-hover[data-shuffle]');
            pressElements.forEach(element => {
                ProjectApp.animations.initAlternatingShuffleForElement(element);
            });
        },

        cleanupLinkHover() {
            ProjectApp.state.linkHoverState.items.forEach(r => {
                try { r.link.removeEventListener('mouseenter', r.onEnter); } catch(e) {}
                try { r.link.removeEventListener('mouseleave', r.onLeave); } catch(e) {}
                try { window.removeEventListener('resize', r.onResize); } catch(e) {}

                r.duplicateChars.forEach(d => d && d.parentNode && d.parentNode.removeChild(d));

                try {
                    r.split && r.split.revert && r.split.revert();
                } catch(e) {}
            });
            ProjectApp.state.linkHoverState.items = [];
        }
    };

    (function () {
        ProjectApp.animations.cfg = ProjectApp.animations.cfg || {
            hideDuration: 0.6,
            showDuration: 0.8,
            ease: "transitionEase",
            lineStagger: 0.04
        };

        if (!ProjectApp.animations.clipNarrow) {
            ProjectApp.animations.clipNarrow = 'polygon(50% 0, 50% 0, 50% 100%, 50% 100%)';
        }
        if (!ProjectApp.animations.clipFull) {
            ProjectApp.animations.clipFull   = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
        }

        if (!ProjectApp.animations.animateOutSlide) {
            ProjectApp.animations.animateOutSlide = function (slideEl) {
                return new Promise((resolve) => {
                    if (!window.gsap || !slideEl) { resolve(); return; }

                    const easeName = ProjectApp.animations.cfg.ease || 'power3.inOut';
                    const tl = gsap.timeline({ defaults: { ease: easeName }, onComplete: resolve });

                    const projectTop     = slideEl.querySelector('.project-top');
                    const projectBottom  = slideEl.querySelector('.project-bottom');
                    const videoElements  = slideEl.querySelectorAll('.video-spacer, .video-wrapper');
                    const previewWrapper = slideEl.querySelector('.preview-wrapper');
                    const rightNameWrap  = slideEl.querySelector('.name-wrapper.has--align-right');
                    const leftNameWrap   = slideEl.querySelector('.name-wrapper.has--align-left');
                    const d = ProjectApp.animations.cfg.hideDuration;
                    const st = ProjectApp.animations.cfg.lineStagger;
                    if (rightNameWrap) {
                        const lines = rightNameWrap.querySelectorAll('.name-xlarge .line');
                        if (lines.length) tl.to(lines, { y: '110%', duration: d, stagger: st }, 0);
                    }
                    if (leftNameWrap) {
                        const lines = leftNameWrap.querySelectorAll('.name-xlarge .line');
                        if (lines.length) tl.to(lines, { y: '-110%', duration: d, stagger: st }, 0);
                    }
                    if (projectTop)    tl.to(projectTop,    { y: '100%',  duration: d }, 0);
                    if (projectBottom) tl.to(projectBottom, { y: '-100%', duration: d }, 0);
                    if (videoElements && videoElements.length) {
                        tl.to(videoElements, { clipPath: ProjectApp.animations.clipNarrow, duration: d }, 0);
                    }
                    if (previewWrapper) tl.to(previewWrapper, { opacity: 0, duration: d }, 0);

                    if (!tl.getChildren().length) resolve();
                });
            };
        }
        if (!ProjectApp.animations.animateInSlide) {
            ProjectApp.animations.animateInSlide = function (slideEl) {
                return new Promise((resolve) => {
                    if (!window.gsap || !slideEl) { resolve(); return; }

                    const easeName = ProjectApp.animations.cfg.ease || 'power3.inOut';
                    const tl = gsap.timeline({ defaults: { ease: easeName }, onComplete: resolve });

                    const projectTop     = slideEl.querySelector('.project-top');
                    const projectBottom  = slideEl.querySelector('.project-bottom');
                    const videoElements  = slideEl.querySelectorAll('.video-spacer, .video-wrapper');
                    const previewWrapper = slideEl.querySelector('.preview-wrapper');
                    const rightNameWrap  = slideEl.querySelector('.name-wrapper.has--align-right');
                    const leftNameWrap   = slideEl.querySelector('.name-wrapper.has--align-left');

                    const d = ProjectApp.animations.cfg.showDuration;
                    const st = ProjectApp.animations.cfg.lineStagger;
                    if (rightNameWrap) {
                        const lines = rightNameWrap.querySelectorAll('.name-xlarge .line');
                        if (lines.length) tl.fromTo(lines, { y: '110%' }, { y: '0%', duration: d, stagger: st }, 0);
                    }
                    if (leftNameWrap) {
                        const lines = leftNameWrap.querySelectorAll('.name-xlarge .line');
                        if (lines.length) tl.fromTo(lines, { y: '-110%' }, { y: '0%', duration: d, stagger: st }, 0);
                    }
                    if (projectTop)    tl.fromTo(projectTop,    { y: '100%' },  { y: '0%', duration: d }, 0);
                    if (projectBottom) tl.fromTo(projectBottom, { y: '-100%' }, { y: '0%', duration: d }, 0);

                    if (videoElements && videoElements.length) {
                        tl.fromTo(videoElements,
                            { clipPath: ProjectApp.animations.clipNarrow },
                            { clipPath: ProjectApp.animations.clipFull, duration: d },
                            0
                        );
                    }
                    if (previewWrapper) tl.fromTo(previewWrapper, { opacity: 0 }, { opacity: 1, duration: d }, 0);
                    if (!tl.getChildren().length) resolve();
                });
            };
        }
    })();

    // ============================================
    // BARBA MANAGER
    // ============================================
//     ProjectApp.barbaManager = {
//     setBlockAlignments(blocks) {
//     blocks.forEach((block, index) => {
//     if (ProjectApp.state.blockAlignmentState === 'initial') {
//     block.style.alignSelf = index % 2 === 0 ? 'flex-end' : 'flex-start';
// } else {
//     block.style.alignSelf = index % 2 === 0 ? 'flex-start' : 'flex-end';
// }
// });
// },
//
//     swapBlockAlignments(blocks) {
//     ProjectApp.state.blockAlignmentState =
//     ProjectApp.state.blockAlignmentState === 'initial' ? 'swapped' : 'initial';
//
//     blocks.forEach((block, index) => {
//     if (ProjectApp.state.blockAlignmentState === 'initial') {
//     block.style.alignSelf = index % 2 === 0 ? 'flex-end' : 'flex-start';
// } else {
//     block.style.alignSelf = index % 2 === 0 ? 'flex-start' : 'flex-end';
// }
// });
// },
//
//     prepareTransitionBlocks() {
//     const blocks = document.querySelectorAll('.transition-block');
//     blocks.forEach((block) => {
//     gsap.set(block, {clearProps: 'height'});
// });
//     ProjectApp.barbaManager.setBlockAlignments(blocks);
// },
//
//     updateActiveLinkByHref(href) {
//     try {
//     const url = new URL(href, window.location.origin);
//     const links = Array.from(document.querySelectorAll('.nav-link-block'));
//     links.forEach(a => a.classList.remove('is--active'));
//
//     const pqh = url.pathname + url.search + url.hash;
//     let target = document.querySelector(`.nav-link-block[href="${pqh}"]`) ||
//     document.querySelector(`.nav-link-block[href="${url.pathname}"]`);
//
//     if (!target) {
//     target = links.find(a => {
//     try {
//     const aURL = new URL(a.getAttribute('href'), window.location.origin);
//     return aURL.pathname === url.pathname;
// } catch(e) {
//     return false;
// }
// });
// }
//
//     if (target) target.classList.add('is--active');
// } catch(e) {}
// },
//
//     init() {
//     if (!window.barba || !window.barba.init) {
//     return;
// }
//
//     if (window.barbaPrefetch && typeof barbaPrefetch !== 'undefined' && barba.use) {
//     barba.use(barbaPrefetch);
// }
//
//     barba.init({
//     preventRunning: true,
//     prefetch: !!window.barbaPrefetch,
//
//     views: [
// {
//     namespace: 'archive',
//     beforeEnter() {
//     console.log('Entering archive page');
// },
//     afterEnter() {
//     if (ProjectApp.archivePageModule?.init) {
//     ProjectApp.archivePageModule.init();
// }
// },
//     beforeLeave() {
//     if (ProjectApp.archivePageModule?.cleanup) {
//     ProjectApp.archivePageModule.cleanup();
// }
// }
// },
// {
//     namespace: 'about',
//     afterEnter() {
//     if (ProjectApp.pageSpecificModule?.init) {
//     ProjectApp.pageSpecificModule.init();
// }
// },
//     beforeLeave() {
//     if (ProjectApp.pageSpecificModule?.cleanup) {
//     ProjectApp.pageSpecificModule.cleanup();
// }
// }
// }
//     ],
//
//     transitions: [{
//     name: 'default-transition',
//
//     async leave(data) {
//     ProjectApp.state.isTransitioning = true;
//
//     // Cleanup ALL modules
//     const cleanupModules = [
//     ProjectApp.listModule,
//     ProjectApp.pageSpecificModule,
//     ProjectApp.archivePageModule,
//     ProjectApp.reportageSwiper
//     ];
//
//     cleanupModules.forEach(module => {
//     if (module?.cleanup) module.cleanup();
// });
//
//     Object.values(ProjectApp.swiperModule.swipers || {}).forEach(swiper => {
//     try {
//     if (swiper.mousewheel?.disable) swiper.mousewheel.disable();
//     swiper.allowTouchMove = false;
//     if (swiper.detachEvents) swiper.detachEvents();
// } catch(e) {}
// });
//
//     ProjectApp.eventHandlers.cleanupSharedListeners();
//     ProjectApp.viewSwitcher.cleanupSwitchAnimation();
//     ProjectApp.animations.cleanupLinkHover();
//     ProjectApp.timeline.cleanupTimeline();
//
//     // Pause all videos
//     document.querySelectorAll('video').forEach(v => v.pause());
//
//     if (data?.trigger?.tagName) {
//     const href = data.trigger.getAttribute?.('href');
//     if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
//     try {
//     ProjectApp.barbaManager.updateActiveLinkByHref(new URL(href, window.location.origin).href);
// } catch(e) {}
// }
// }
//
//     const blocks = document.querySelectorAll('.transition-block');
//     ProjectApp.barbaManager.setBlockAlignments(blocks);
//
//     const done = this.async();
//
//     gsap.timeline({
//     onComplete: () => {
//     ProjectApp.barbaManager.swapBlockAlignments(blocks);
//     done();
// }
// })
//     .fromTo(blocks,
// {height: '0%'},
// {height: '100%', duration: 0.6, ease: 'power2.inOut', stagger: 0.1}
//     );
// },
//
//     async enter(data) {
//     const next = data.next.container;
//
//     // Wait for images
//     await ProjectApp.utils.waitForImages(next);
//
//     // Prepare videos (lazy load)
//     ProjectApp.utils.prepareVideos(next);
//
//     ProjectApp.barbaManager.prepareTransitionBlocks();
//     const blocks = document.querySelectorAll('.transition-block');
//
//     const done = this.async();
//
//     gsap.timeline({
//     onComplete: () => {
//     ProjectApp.barbaManager.swapBlockAlignments(blocks);
//     ProjectApp.state.isTransitioning = false;
//
//     // Initialize immediately
//     ProjectApp.initPageFeatures();
//     if (ProjectApp.pageAnimations?.initAll) {
//     ProjectApp.pageAnimations.initAll();
// }
//
//     done();
// }
// })
//     .fromTo(blocks,
// {height: '100%'},
// {height: '0%', duration: 0.6, ease: 'power2.inOut', stagger: 0.1}
//     );
// },
//
//     async once(data) {
//     const container = data.next.container || data.current.container || document;
//     await ProjectApp.utils.waitForImages(container);
//
//     try {
//     ProjectApp.barbaManager.updateActiveLinkByHref(window.location.href);
// } catch(e) {}
//
//     const transitionBlocks = document.querySelectorAll('.transition-block');
//     ProjectApp.barbaManager.setBlockAlignments(transitionBlocks);
// }
// }]
// });
//
//     if (barba.hooks?.after) {
//     barba.hooks.after(() => {
//     ProjectApp.barbaManager.updateActiveLinkByHref(window.location.href);
// });
// }
// }
// };
//
//     // ============================================
//     // MAIN INIT
//     // ============================================
//     ProjectApp.initPageFeatures = function() {
//     if (ProjectApp.textStyling?.init) {
//     ProjectApp.textStyling.init();
// }
//
//     // Check current page/view and init appropriate module
//     const currentPath = window.location.pathname;
//     const namespace = document.querySelector('[data-barba-namespace]')?.getAttribute('data-barba-namespace');
//
//     // General features
//     ProjectApp.state.backgroundHoverHandler = ProjectApp.animations.initBackgroundImageHover();
//
//     const activeOption = document.querySelector('.option-item.is--active');
//     let desired = 'swiper';
//
//     if (activeOption) {
//     if (activeOption.hasAttribute('data-list')) desired = 'list';
//     if (activeOption.hasAttribute('data-swiper')) desired = 'swiper';
// } else {
//     const projectCollection = document.querySelector('.project-collection');
//     if (projectCollection && !ProjectApp.utils.isElementActuallyHidden(projectCollection)) {
//     desired = 'list';
// }
// }
//
//     if (desired === 'swiper') {
//     ProjectApp.state.currentView = 'swiper';
//     const projectCollection = document.querySelector('.project-collection');
//     const swipersContainer = document.querySelector('.swipers-container');
//
//     if (swipersContainer) swipersContainer.classList.remove('is--hidden');
//     if (projectCollection) projectCollection.classList.add('is--hidden');
//
//     if (ProjectApp.swiperModule?.initAll) {
//     ProjectApp.swiperModule.initAll();
// }
// } else {
//     ProjectApp.state.currentView = 'list';
//     const swipersContainer = document.querySelector('.swipers-container');
//     const projectCollection = document.querySelector('.project-collection');
//
//     if (projectCollection) projectCollection.classList.remove('is--hidden');
//     if (swipersContainer) swipersContainer.classList.add('is--hidden');
//
//     if (ProjectApp.listModule?.ensureListInit) {
//     ProjectApp.listModule.ensureListInit();
// }
// }
//
//     setTimeout(() => {
//     if (ProjectApp.filterModule?.initializeTotalCounts) {
//     ProjectApp.state.countsInitialized = false;
//     ProjectApp.filterModule.initializeTotalCounts();
//     ProjectApp.filterModule.updateCurrentTotalCount();
// }
// }, 200);
//
//     // Always init these
//     ProjectApp.eventHandlers.setupSharedListeners();
//     ProjectApp.viewSwitcher.initSwitchAnimation();
//     ProjectApp.animations.initLinkHover();
//     ProjectApp.animations.initBackgroundHoverBlock();
//     ProjectApp.animations.initGuildsAnimations();
//     ProjectApp.animations.initPressAnimations();
//     ProjectApp.timeline.initTimeline();
//
//     // Reportage swiper (if exists and not already initialized)
//     if (ProjectApp.reportageSwiper &&
//     !ProjectApp.reportageSwiper.swiperMove &&
//     !ProjectApp.reportageSwiper.swiperFade) {
//     const hasReportage = document.querySelector('.swiper.reportage-move') &&
//     document.querySelector('.swiper.reportage-fade');
//     if (hasReportage) {
//     ProjectApp.reportageSwiper.init();
// }
// }
// };

 // ============================================
 // BARBA MANAGER
 // ============================================
 ProjectApp.barbaManager = {
     setBlockAlignments(blocks) {
         blocks.forEach((block, index) => {
             if (ProjectApp.state.blockAlignmentState === 'initial') {
                 block.style.alignSelf = index % 2 === 0 ? 'flex-end' : 'flex-start';
             } else {
                 block.style.alignSelf = index % 2 === 0 ? 'flex-start' : 'flex-end';
             }
         });
     },

     swapBlockAlignments(blocks) {
         ProjectApp.state.blockAlignmentState =
             ProjectApp.state.blockAlignmentState === 'initial' ? 'swapped' : 'initial';

         blocks.forEach((block, index) => {
             if (ProjectApp.state.blockAlignmentState === 'initial') {
                 block.style.alignSelf = index % 2 === 0 ? 'flex-end' : 'flex-start';
             } else {
                 block.style.alignSelf = index % 2 === 0 ? 'flex-start' : 'flex-end';
             }
         });
     },

     prepareTransitionBlocks() {
         const blocks = document.querySelectorAll('.transition-block');
         blocks.forEach((block) => {
             gsap.set(block, {clearProps: 'height'});
         });
         ProjectApp.barbaManager.setBlockAlignments(blocks);
     },

     updateActiveLinkByHref(href) {
         try {
             const url = new URL(href, window.location.origin);
             const links = Array.from(document.querySelectorAll('.nav-link-block'));
             links.forEach(a => a.classList.remove('is--active'));

             const pqh = url.pathname + url.search + url.hash;
             let target = document.querySelector(`.nav-link-block[href="${pqh}"]`) ||
                 document.querySelector(`.nav-link-block[href="${url.pathname}"]`);

             if (!target) {
                 target = links.find(a => {
                     try {
                         const aURL = new URL(a.getAttribute('href'), window.location.origin);
                         return aURL.pathname === url.pathname;
                     } catch(e) {
                         return false;
                     }
                 });
             }

             if (target) target.classList.add('is--active');
         } catch(e) {}
     },

     init() {
         if (!window.barba || !window.barba.init) {
             return;
         }

         if (window.barbaPrefetch && typeof barbaPrefetch !== 'undefined' && barba.use) {
             barba.use(barbaPrefetch);
         }

         barba.init({
             preventRunning: true,
             prefetch: !!window.barbaPrefetch,

             views: [
                 {
                     namespace: 'work',
                     afterEnter() {
                         console.log('Entering work page');
                         ProjectApp.initWorkPage();
                     },
                     beforeLeave() {
                         ProjectApp.cleanupWorkPage();
                     }
                 },
                 {
                     namespace: 'archive',
                     afterEnter() {
                         console.log('Entering archive page');
                         if (ProjectApp.archivePageModule?.init) {
                             ProjectApp.archivePageModule.init();
                         }
                     },
                     beforeLeave() {
                         if (ProjectApp.archivePageModule?.cleanup) {
                             ProjectApp.archivePageModule.cleanup();
                         }
                     }
                 },
                 {
                     namespace: 'about',
                     afterEnter() {
                         console.log('Entering about page');
                         if (ProjectApp.pageSpecificModule?.init) {
                             ProjectApp.pageSpecificModule.init();
                         }
                     },
                     beforeLeave() {
                         if (ProjectApp.pageSpecificModule?.cleanup) {
                             ProjectApp.pageSpecificModule.cleanup();
                         }
                     }
                 },
                 {
                     namespace: 'reportage',
                     afterEnter() {
                         console.log('Entering reportage page');
                         if (ProjectApp.reportageSwiper?.init) {
                             ProjectApp.reportageSwiper.init();
                         }
                     },
                     beforeLeave() {
                         if (ProjectApp.reportageSwiper?.cleanup) {
                             ProjectApp.reportageSwiper.cleanup();
                         }
                     }
                 },
                 {
                     namespace: 'contact',
                     afterEnter() {
                         console.log('Entering contact page');
                     }
                 }
             ],

             transitions: [{
                 name: 'default-transition',

                 async leave(data) {
                     ProjectApp.state.isTransitioning = true;

                     // Cleanup ALL modules
                     const cleanupModules = [
                         ProjectApp.listModule,
                         ProjectApp.swiperModule,
                         ProjectApp.pageSpecificModule,
                         ProjectApp.archivePageModule,
                         ProjectApp.reportageSwiper
                     ];

                     cleanupModules.forEach(module => {
                         if (module?.cleanup) module.cleanup();
                     });

                     // Cleanup swipers specifically
                     Object.values(ProjectApp.swiperModule.swipers || {}).forEach(swiper => {
                         try {
                             if (swiper.mousewheel?.disable) swiper.mousewheel.disable();
                             swiper.allowTouchMove = false;
                             if (swiper.detachEvents) swiper.detachEvents();
                         } catch(e) {}
                     });

                     // Cleanup shared listeners
                     ProjectApp.eventHandlers.cleanupSharedListeners();
                     ProjectApp.viewSwitcher.cleanupSwitchAnimation();
                     ProjectApp.animations.cleanupLinkHover();
                     ProjectApp.timeline.cleanupTimeline();

                     // Pause all videos
                     document.querySelectorAll('video').forEach(v => v.pause());

                     // Update active nav link
                     if (data?.trigger?.tagName) {
                         const href = data.trigger.getAttribute?.('href');
                         if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                             try {
                                 ProjectApp.barbaManager.updateActiveLinkByHref(new URL(href, window.location.origin).href);
                             } catch(e) {}
                         }
                     }

                     const blocks = document.querySelectorAll('.transition-block');
                     ProjectApp.barbaManager.setBlockAlignments(blocks);

                     const done = this.async();

                     gsap.timeline({
                         onComplete: () => {
                             ProjectApp.barbaManager.swapBlockAlignments(blocks);
                             done();
                         }
                     })
                         .fromTo(blocks,
                             {height: '0%'},
                             {height: '100%', duration: 0.6, ease: 'power2.inOut', stagger: 0.1}
                         );
                 },

                 async enter(data) {
                     const next = data.next.container;

                     // Wait for images
                     await ProjectApp.utils.waitForImages(next);

                     // Prepare videos (lazy load)
                     ProjectApp.utils.prepareVideos(next);

                     ProjectApp.barbaManager.prepareTransitionBlocks();
                     const blocks = document.querySelectorAll('.transition-block');

                     const done = this.async();

                     gsap.timeline({
                         onComplete: () => {
                             ProjectApp.barbaManager.swapBlockAlignments(blocks);
                             ProjectApp.state.isTransitioning = false;

                             // Initialize shared features for ALL pages (includes all animations)
                             ProjectApp.initSharedFeatures();

                             // Page animations (if you have this module)
                             if (ProjectApp.pageAnimations?.initAll) {
                                 ProjectApp.pageAnimations.initAll();
                             }

                             done();
                         }
                     })
                         .fromTo(blocks,
                             {height: '100%'},
                             {height: '0%', duration: 0.6, ease: 'power2.inOut', stagger: 0.1}
                         );
                 },

                 async once(data) {
                     const container = data.next.container || data.current.container || document;
                     await ProjectApp.utils.waitForImages(container);

                     try {
                         ProjectApp.barbaManager.updateActiveLinkByHref(window.location.href);
                     } catch(e) {}

                     const transitionBlocks = document.querySelectorAll('.transition-block');
                     ProjectApp.barbaManager.setBlockAlignments(transitionBlocks);
                 }
             }]
         });

         if (barba.hooks?.after) {
             barba.hooks.after(() => {
                 ProjectApp.barbaManager.updateActiveLinkByHref(window.location.href);
             });
         }
     }
 };

 // ============================================
 // SHARED FEATURES (Run on Every Page)
 // ============================================
 ProjectApp.initSharedFeatures = function() {
     console.log('Initializing shared features');

     // Text styling
     if (ProjectApp.textStyling?.init) {
         ProjectApp.textStyling.init();
     }

     // ALL Animations (on every page)
     if (ProjectApp.animations) {
         ProjectApp.animations.initLinkHover();
         ProjectApp.state.backgroundHoverHandler = ProjectApp.animations.initBackgroundImageHover();
         ProjectApp.animations.initBackgroundHoverBlock();
         ProjectApp.animations.initGuildsAnimations();
         ProjectApp.animations.initPressAnimations();
     }

     // Timeline
     if (ProjectApp.timeline?.initTimeline) {
         ProjectApp.timeline.initTimeline();
     }

     // Event handlers
     if (ProjectApp.eventHandlers?.setupSharedListeners) {
         ProjectApp.eventHandlers.setupSharedListeners();
     }

     // View switcher (includes mode state)
     if (ProjectApp.viewSwitcher?.initSwitchAnimation) {
         ProjectApp.viewSwitcher.initSwitchAnimation();
     }

     // Apply background video mode state (NEW - call this AFTER initSwitchAnimation)
     if (ProjectApp.viewSwitcher?.applyModeState) {
         ProjectApp.viewSwitcher.applyModeState();
     }
 };

 // ============================================
 // WORK PAGE SPECIFIC INIT
 // ============================================
 ProjectApp.initWorkPage = function() {
     console.log('Initializing work page features');

     const activeOption = document.querySelector('.option-item.is--active');
     let desired = 'swiper';

     if (activeOption) {
         if (activeOption.hasAttribute('data-list')) desired = 'list';
         if (activeOption.hasAttribute('data-swiper')) desired = 'swiper';
     } else {
         const projectCollection = document.querySelector('.project-collection');
         if (projectCollection && !ProjectApp.utils.isElementActuallyHidden(projectCollection)) {
             desired = 'list';
         }
     }

     if (desired === 'swiper') {
         ProjectApp.state.currentView = 'swiper';
         const projectCollection = document.querySelector('.project-collection');
         const swipersContainer = document.querySelector('.swipers-container');

         if (swipersContainer) swipersContainer.classList.remove('is--hidden');
         if (projectCollection) projectCollection.classList.add('is--hidden');

         if (ProjectApp.swiperModule?.initAll) {
             ProjectApp.swiperModule.initAll();
         }
     } else {
         ProjectApp.state.currentView = 'list';
         const swipersContainer = document.querySelector('.swipers-container');
         const projectCollection = document.querySelector('.project-collection');

         if (projectCollection) projectCollection.classList.remove('is--hidden');
         if (swipersContainer) swipersContainer.classList.add('is--hidden');

         if (ProjectApp.listModule?.ensureListInit) {
             ProjectApp.listModule.ensureListInit();
         }
     }

     // Initialize filter counts
     setTimeout(() => {
         if (ProjectApp.filterModule?.initializeTotalCounts) {
             ProjectApp.state.countsInitialized = false;
             ProjectApp.filterModule.initializeTotalCounts();
             ProjectApp.filterModule.updateCurrentTotalCount();
         }
     }, 200);

     // ❌ REMOVE THIS - now in shared features
     // ProjectApp.viewSwitcher.initSwitchAnimation();

     // Additional work page animations
     ProjectApp.animations.initGuildsAnimations();
     ProjectApp.animations.initPressAnimations();
 };

 // ============================================
 // WORK PAGE CLEANUP
 // ============================================
 ProjectApp.cleanupWorkPage = function() {
     console.log('Cleaning up work page');

     if (ProjectApp.listModule?.cleanupInfiniteScroll) {
         ProjectApp.listModule.cleanupInfiniteScroll();
     }

     if (ProjectApp.swiperModule?.cleanup) {
         ProjectApp.swiperModule.cleanup();
     }

     ProjectApp.viewSwitcher.cleanupSwitchAnimation();
 };

     // ============================================
     // BOOTSTRAP
     // ============================================
     (function() {
         ProjectApp.__bootDone = false;

         ProjectApp.__isCoreReady = function() {
             return !!(
                 ProjectApp.swiperModule?.initSwiper &&
                 ProjectApp.listModule?.ensureListInit &&
                 ProjectApp.animations?.initLinkHover &&
                 ProjectApp.barbaManager?.init
             );
         };

         ProjectApp.bootstrap = function() {
             if (ProjectApp.__bootDone) return;

             if (!ProjectApp.__isCoreReady()) {
                 return setTimeout(ProjectApp.bootstrap, 50);
             }

             try {
                 // Initialize shared features on first load
                 ProjectApp.initSharedFeatures();

                 // Initialize page-specific features based on current namespace
                 const namespace = document.querySelector('[data-barba-namespace]')?.getAttribute('data-barba-namespace');

                 switch(namespace) {
                     case 'work':
                         ProjectApp.initWorkPage();
                         break;
                     case 'archive':
                         if (ProjectApp.archivePageModule?.init) {
                             ProjectApp.archivePageModule.init();
                         }
                         break;
                     case 'about':
                         if (ProjectApp.pageSpecificModule?.init) {
                             ProjectApp.pageSpecificModule.init();
                         }
                         break;
                     case 'reportage':
                         if (ProjectApp.reportageSwiper?.init) {
                             ProjectApp.reportageSwiper.init();
                         }
                         break;
                     case 'contact':
                         // Contact page has no specific modules
                         break;
                     default:
                         console.log('Unknown namespace:', namespace);
                 }

                 // Initialize page animations
                 if (ProjectApp.pageAnimations?.initAll) {
                     ProjectApp.pageAnimations.initAll();
                 }

             } catch(e) {
                 console.error('Init error:', e);
             }

             try {
                 // Initialize Barba after initial page setup
                 if (ProjectApp.barbaManager?.init) {
                     ProjectApp.barbaManager.init();
                 }
             } catch(e) {
                 console.error('Barba init error:', e);
             }

             ProjectApp.__bootDone = true;
         };

         if (document.readyState === 'loading') {
             document.addEventListener('DOMContentLoaded', ProjectApp.bootstrap);
         } else {
             ProjectApp.bootstrap();
         }
     })();

 // ============================================
 // PRELOADER (Only Once Per Session - Work Page Only)
 // ============================================
 (function() {
     document.addEventListener("DOMContentLoaded", function () {
         // Check if we're on the work page
         const namespace = document.querySelector('[data-barba-namespace]')?.getAttribute('data-barba-namespace');

         if (namespace !== 'work') {
             console.log('Not work page - skipping preloader');
             return;
         }

         // Check if preloader exists
         const preloaderElement = document.querySelector('.preloader');
         if (!preloaderElement) {
             console.log('No preloader element found');
             return;
         }

         // Check if preloader has already been shown in this session
         const preloaderShown = sessionStorage.getItem('preloaderShown');

         // If already shown, skip preloader and show content immediately
         if (preloaderShown === 'true') {
             console.log('Preloader already shown this session - skipping');

             // Hide preloader immediately
             preloaderElement.style.display = 'none';

             // Show navbar and footer immediately
             const navbar = document.querySelector('.navbar');
             const footer = document.querySelector('.footer');
             if (navbar) gsap.set(navbar, { yPercent: 0 });
             if (footer) gsap.set(footer, { yPercent: 0 });

             // Unblock interactions
             const blockedBlock = document.querySelector('.blocked-block');
             if (blockedBlock) blockedBlock.style.pointerEvents = 'none';

             // Show slides in final state
             const activeSlide = document.querySelector('.swiper-slide-active');
             const logicalPrevSlide = document.querySelector('.swiper-slide.is--prev-logical');

             if (activeSlide && ProjectApp.slidePresets?.resetSlideElements) {
                 ProjectApp.slidePresets.resetSlideElements(activeSlide);
             }
             if (logicalPrevSlide) {
                 gsap.set(logicalPrevSlide, { visibility: 'visible' });
             }

             return;
         }

         // Mark preloader as shown for this session
         console.log('First visit to work page - running preloader');
         sessionStorage.setItem('preloaderShown', 'true');

         // YOUR ORIGINAL CODE STARTS HERE
         function prepareSlide() {
             const activeSlide = document.querySelector('.swiper-slide-active');
             const logicalPrevSlide = document.querySelector('.swiper-slide.is--prev-logical');

             if (!activeSlide && !logicalPrevSlide) {
                 return false;
             }

             if (activeSlide) {
                 ProjectApp.slideAnimations.setSlideHidden(activeSlide);
             }

             if (logicalPrevSlide) {
                 ProjectApp.slidePresets.setPrevSlidesHidden(logicalPrevSlide);
             }

             return !!(activeSlide && (logicalPrevSlide || document.querySelectorAll('.swiper-slide').length === 1));
         }

         if (!prepareSlide()) {
             const checkInterval = setInterval(() => {
                 if (prepareSlide()) {
                     clearInterval(checkInterval);
                 }
             }, 50);

             setTimeout(() => {
                 clearInterval(checkInterval);
                 const activeSlide = document.querySelector('.swiper-slide-active');
                 const logicalPrevSlide = document.querySelector('.swiper-slide.is--prev-logical');
                 if (activeSlide) {
                     ProjectApp.slideAnimations.setSlideHidden(activeSlide);
                 }
                 if (logicalPrevSlide) {
                     ProjectApp.slidePresets.setPrevSlidesHidden(logicalPrevSlide);
                 }
             }, 2000);
         }

         const timeline = gsap.timeline({ delay: 1 });

         const textInner = document.querySelector('.preloader-text-inner');
         const firstText = document.querySelector('.preloader-text-inner .preloader-text');
         const leftImageBlock = document.querySelector('.preloader-image-block.is--left');
         const rightImageBlock = document.querySelector('.preloader-image-block.is--right');
         const preloader = document.querySelector('.preloader');
         const navbar = document.querySelector('.navbar');
         const footer = document.querySelector('.footer');

         let chars = [];
         if (firstText) {
             const split = new SplitType(firstText, { types: 'chars' });
             chars = split.chars || [];
         }

         if (leftImageBlock) {
             timeline.to(leftImageBlock, { x: '0%', y: '0vh', duration: 1.2, ease: "power3.out" }, 0.05);
         }
         if (rightImageBlock) {
             timeline.to(rightImageBlock, { x: '0%', y: '0vh', duration: 1.2, ease: "power3.out" }, 0.05);
         }

         if (chars.length) {
             chars.forEach((char, index) => {
                 const fromBottom = index % 2 === 0;
                 timeline.fromTo(
                     char,
                     { yPercent: fromBottom ? 100 : -100 },
                     { yPercent: 0, duration: 0.85, ease: "mainEase" },
                     0.1
                 );
             });
         }

         timeline.add(() => {}, '-=1');

         const odometerPreload = document.querySelector('.odometer');
         const odometerContainer = document.querySelector('.odometer-container');
         const leftDecor = document.querySelector('.decor-numbers.is--left');
         const rightDecor = document.querySelector('.decor-numbers.is--right');

         let odometerTextPreload = null;
         let digitHeightPreload = 0;

         if (odometerPreload) {
             odometerTextPreload = odometerPreload.querySelector('.preloader-text');
         }

         if (odometerTextPreload) {
             const computedStylePreload = window.getComputedStyle(odometerTextPreload);
             const fontSizePreload = parseFloat(computedStylePreload.fontSize);
             const lineHeightPreload = parseFloat(computedStylePreload.lineHeight);
             digitHeightPreload = isNaN(lineHeightPreload) ? fontSizePreload * 1.2 : lineHeightPreload;

             const tempDigits = odometerTextPreload.textContent.split('');
             odometerTextPreload.innerHTML = '';

             tempDigits.forEach((digit, index) => {
                 const span = document.createElement('span');
                 span.textContent = digit;
                 span.style.display = 'inline-block';

                 if (index === 0) {
                     span.style.transform = `translateY(${digitHeightPreload * 5}px)`;
                     span.style.opacity = '0';
                 }

                 odometerTextPreload.appendChild(span);
             });
         }

         timeline.add('moveText');

         if (firstText) {
             timeline.to(firstText, { y: '-90%', duration: 0.4, ease: 'power1.out' }, 'moveText');
         }

         if (textInner) {
             timeline.to(textInner, { y: '-50%', duration: 0.3, ease: 'power1.in' }, 'moveText+=0.35');
         }

         timeline.add('odometerStart');

         timeline.add(() => { animateOdometer(); }, 'odometerStart-=0.05');

         if (leftImageBlock) {
             timeline.to(leftImageBlock, { x: '0%', top: '-380%', duration: 3.5, ease: 'power2.inOut' }, 'odometerStart-=1');
         }
         if (rightImageBlock) {
             timeline.to(rightImageBlock, { x: '0%', bottom: '-380%', duration: 3.5, ease: 'power2.inOut' }, 'odometerStart-=1');
         }
         if (leftDecor) {
             timeline.to(leftDecor, { y: '120vw', duration: 3.5, ease: 'power2.inOut' }, 'odometerStart-=1');
         }
         if (rightDecor) {
             timeline.to(rightDecor, { y: '-120vw', duration: 3.5, ease: 'power2.inOut' }, 'odometerStart-=1');
         }

         timeline.add(() => {}, 'odometerStart+=2.5');

         const leftText = document.querySelector('.preloader-text.is--left');
         const rightText = document.querySelector('.preloader-text.is--right');
         const textFinal = document.querySelector('.preloader-text-final');
         const preloaderBackground = document.querySelector('.preloader-background');
         const imageWrapper = document.querySelector('.preloader-image-wrapper');

         const leftWidth = leftText ? window.getComputedStyle(leftText).width : '0px';
         const rightWidth = rightText ? window.getComputedStyle(rightText).width : '0px';
         const rightMargin = rightText ? window.getComputedStyle(rightText).marginLeft : '0px';

         if (leftText) {
             gsap.set(leftText, { width: '0px' });
         }
         if (rightText) {
             gsap.set(rightText, { width: '0px', marginLeft: '0px' });
         }

         if (odometerContainer) {
             timeline.to(odometerContainer, { yPercent: -100, duration: 0.5, ease: 'power2.inOut' }, 'odometerStart+=1.5');
         }

         if (textFinal) {
             timeline.to(textFinal, { width: '25vw', duration: 0.7, delay: 0.1, ease: 'power3.inOut' }, 'odometerStart+=1.5');
         }
         if (leftText) {
             timeline.to(leftText, { width: leftWidth, duration: 0.7, delay: 0.1, ease: 'power3.inOut' }, 'odometerStart+=1.5');
         }
         if (rightText) {
             timeline.to(rightText, { width: rightWidth, marginLeft: rightMargin, duration: 0.7, delay: 0.1, ease: '' }, 'odometerStart+=1.5');
         }

         if (textFinal) {
             timeline.to(textFinal, { width: '61vw', duration: 0.8, ease: 'power3.inOut' }, 'odometerStart+=2.5');
         }
         if (imageWrapper) {
             timeline.to(imageWrapper, { width: '0%', duration: 0.8, ease: 'transitionEase' }, 'odometerStart+=2.5');
         }
         if (preloaderBackground) {
             timeline.to(preloaderBackground, { opacity: 0, duration: 0.8, ease: 'power3.inOut' }, 'odometerStart+=3');
         }

         if (leftImageBlock) {
             timeline.to(leftImageBlock, { x: '-50%', duration: 0.4, ease: 'transitionEase' }, 'odometerStart+=2.65');
         }
         if (rightImageBlock) {
             timeline.to(rightImageBlock, { x: '50%', duration: 0.4, ease: 'transitionEase' }, 'odometerStart+=2.65');
         }

         if (navbar) {
             timeline.from(navbar, { yPercent: -100, duration: 0.6, ease: 'power3.inOut' }, 'odometerStart+=2.8');
         }
         if (footer) {
             timeline.from(footer, { yPercent: 100, duration: 0.6, ease: 'power3.inOut' }, 'odometerStart+=2.8');
         }

         if (leftText) {
             timeline.to(leftText, { y: '-100%', duration: 0.8, ease: 'headingHoverEase' }, 'odometerStart+=3.5');
         }
         if (rightText) {
             timeline.to(rightText, { y: '100%', duration: 0.8, ease: 'headingHoverEase' }, 'odometerStart+=3.5');
         }

         timeline.add(() => {
             ProjectApp.slideAnimations.animatePreloaderSlideIn();
         }, 'odometerStart+=3.8');

         if (preloader) {
             timeline.add(() => {
                 const logicalPrevSlide = document.querySelector('.swiper-slide.is--prev-logical');
                 if (logicalPrevSlide) {
                     gsap.set(logicalPrevSlide, { visibility: 'visible' });
                 }
             }, 'odometerStart+=5.8');

             timeline.to(preloader, { opacity: '0', duration: 0 }, 'odometerStart+=4.6');
         }
         timeline.set('.blocked-block', { pointerEvents: 'none' }, 'odometerStart+=5.5');

         function animateOdometer() {
             const odometer = document.querySelector('.odometer');
             if (!odometer) return;

             const odometerText = odometer.querySelector('.preloader-text');
             const endValue = 99;

             let fontSize = 16, lineHeight = 19.2;
             if (odometerText) {
                 const computedStyle = window.getComputedStyle(odometerText);
                 fontSize = parseFloat(computedStyle.fontSize) || 16;
                 lineHeight = parseFloat(computedStyle.lineHeight) || fontSize * 1.2;
             }
             const digitHeight = lineHeight;

             odometer.innerHTML = '';

             const endDigits = endValue.toString().split('').map(Number);
             endDigits.forEach((endDigit, digitIndex) => {
                 const digitContainer = document.createElement('div');
                 digitContainer.classList.add('digit-container');
                 digitContainer.style.height = `${digitHeight}px`;
                 digitContainer.style.overflow = 'hidden';
                 digitContainer.style.display = 'inline-block';
                 digitContainer.style.position = 'relative';

                 const digitStrip = document.createElement('div');
                 digitStrip.classList.add('digit-strip');
                 digitStrip.style.position = 'relative';

                 const repeatCount = digitIndex === 0 ? 1 : 2;

                 for (let repeat = 0; repeat < repeatCount; repeat++) {
                     for (let i = 0; i < 10; i++) {
                         const digit = document.createElement('div');
                         digit.textContent = i;
                         digit.classList.add('digit');
                         digit.style.height = `${digitHeight}px`;
                         digit.style.fontSize = `${fontSize}px`;
                         digit.style.lineHeight = `${digitHeight}px`;
                         digitStrip.appendChild(digit);
                     }
                 }

                 digitContainer.appendChild(digitStrip);
                 odometer.appendChild(digitContainer);

                 const finalPosition = digitIndex === 0 ? 9 : 19;
                 const targetY = -(finalPosition * digitHeight);

                 if (digitIndex === 0) {
                     gsap.set(digitStrip, { y: digitHeight * 5 });
                 } else {
                     gsap.set(digitStrip, { y: 0 });
                 }

                 const delay = digitIndex === 0 ? 0.05 : 0;
                 const duration = digitIndex === 0 ? 1.3 : 1.25;

                 gsap.to(digitStrip, {
                     y: targetY,
                     duration,
                     delay,
                     ease: 'transitionEase'
                 });
             });
         }
     });
 })();