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

    const scrollMultiplier = 0.2;
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