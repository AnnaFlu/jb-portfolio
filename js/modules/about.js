    ProjectApp = window.ProjectApp || {};
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
    };

};