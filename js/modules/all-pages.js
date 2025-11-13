<script>
    // UTILITY FUNCTIONS
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
}
};

    if (!ProjectApp.utils.waitFor) {
    ProjectApp.utils.waitFor = function (testFn, timeoutMs, intervalMs) {
        return new Promise((resolve) => {
            const start = Date.now();
            const iv = setInterval(() => {
                let ok = false;
                try { ok = !!testFn(); } catch (e) { ok = false; }
                if (ok) { clearInterval(iv); resolve(true); return; }
                if (Date.now() - start > (timeoutMs || 3000)) { clearInterval(iv); resolve(false); }
            }, intervalMs || 50);
        });
    };
}

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
</script>