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
    // Handle existing shuffle animations
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

    // Initialize simple Y animations (110% to 0%) for text-mono elements
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

    // Initialize line-split animations for specific elements
    const lineSplitElements = [
    ...popupWrapper.querySelectorAll('.popup-heading-wrapper_reportage .name-large'),
    ...popupWrapper.querySelectorAll('.popup-content .text-regular')
    ];

    // Special handling for text-abs (check if already split)
    const textAbsElements = popupWrapper.querySelectorAll('.popup-heading-wrapper_reportage .text-abs');
    textAbsElements.forEach(element => {
    // If not already split by another script, add to line split list
    if (!element.querySelector('.line')) {
    lineSplitElements.push(element);
} else {
    // If already split, just ensure lines are wrapped and positioned
    this._ensureLinesWrappedAndPositioned(element);
}
});

    // Process line split elements
    lineSplitElements.forEach(element => {
    if (!element.dataset.lineSplitInitialized) {
    this._splitTextIntoLinesForPopup(element);
    element.dataset.lineSplitInitialized = 'true';
}
});
},

    _splitTextIntoLinesForPopup(element) {
    if (!element || !window.SplitType) return;

    // Check if element contains rich text (paragraphs)
    const hasParagraphs = element.querySelector('p');

    if (hasParagraphs) {
    // Handle rich text with paragraphs
    const paragraphs = element.querySelectorAll('p');

    paragraphs.forEach(p => {
    // Check if paragraph is empty or contains only invisible characters
    const textContent = p.textContent.replace(/\u200D/g, '').trim(); // Remove ZWJ and trim
    if (!textContent || textContent === '') {
    p.style.display = 'none';
    return;
}

    // Store the original HTML to preserve special characters
    const originalHTML = p.innerHTML;

    // Temporarily set a max-width to force line wrapping for SplitType
    const originalWidth = p.style.width;
    const originalMaxWidth = p.style.maxWidth;
    const computedStyle = window.getComputedStyle(element);
    const containerWidth = element.offsetWidth || parseInt(computedStyle.width) || 800;

    // Force the paragraph to wrap at container width
    p.style.maxWidth = containerWidth + 'px';
    p.style.width = '100%';

    // Apply SplitType to each paragraph
    const splitInstance = new SplitType(p, {
    types: 'lines',
    tagName: 'span',
    lineClass: 'text-line'
});

    // Restore original width settings
    p.style.width = originalWidth || '';
    p.style.maxWidth = originalMaxWidth || '';

    // Get the split lines
    const lines = p.querySelectorAll('.text-line');

    // If SplitType only created one line but the text is long, force manual splitting
    if (lines.length === 1 && textContent.length > 100) {
    // Revert the split
    splitInstance.revert();

    // Manual line splitting by sentence or at punctuation
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

    // Wrap all generated lines in overflow-hidden divs
    const allLines = element.querySelectorAll('.text-line');
    allLines.forEach(line => {
    // Skip if already wrapped
    if (line.parentElement.classList.contains('overflow-hidden')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'overflow-hidden';
    wrapper.style.overflow = 'hidden';
    line.parentNode.insertBefore(wrapper, line);
    wrapper.appendChild(line);

    // Set initial transform
    line.style.transform = 'translateY(110%)';
    line.style.display = 'block';
});
} else {
    // Original handling for simple text
    new SplitType(element, {
    types: 'lines',
    tagName: 'span'
});

    // Wrap each line in overflow-hidden div and set initial transform
    element.querySelectorAll('.line').forEach(line => {
    const wrapper = document.createElement('div');
    wrapper.className = 'overflow-hidden';
    wrapper.style.overflow = 'hidden';
    line.parentNode.insertBefore(wrapper, line);
    wrapper.appendChild(line);

    // Set initial transform
    line.style.transform = 'translateY(110%)';
    line.style.display = 'block';
});
}
},

    _ensureLinesWrappedAndPositioned(element) {
    // For already split text-abs, ensure lines are wrapped and positioned
    element.querySelectorAll('.line').forEach(line => {
    // Check if already wrapped
    if (!line.parentElement.classList.contains('overflow-hidden')) {
    const wrapper = document.createElement('div');
    wrapper.className = 'overflow-hidden';
    wrapper.style.overflow = 'hidden';
    line.parentNode.insertBefore(wrapper, line);
    wrapper.appendChild(line);
}

    // Set initial transform
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

    // Animate shuffle elements (existing animation)
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

    // Animate simple Y-transform elements (text-mono)
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

    // Animate line-split elements
    const lineSplitSelectors = [
    '.popup-heading-wrapper_reportage .name-large .line',
    '.popup-heading-wrapper_reportage .text-abs .line',
    '.popup-content .text-regular .line',
    '.popup-content .text-regular .text-line'  // Added for rich text paragraphs
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

    // Animate shuffle elements back
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

    // Animate simple Y-transform elements back to 110%
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

    // Animate line-split elements back to 110%
    const lineSplitSelectors = [
    '.popup-heading-wrapper_reportage .name-large .line',
    '.popup-heading-wrapper_reportage .text-abs .line',
    '.popup-content .text-regular .line',
    '.popup-content .text-regular .text-line'  // Added for rich text paragraphs
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

    this.cleanup();

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