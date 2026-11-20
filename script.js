// ==================== script.js ====================
// 3D 生日礼物网站 - 性能优化完整版
// Three.js ES Module
//
// 优化内容：
// 1. 修复 routeParticles 未声明问题
// 2. 3D 地球质量自动适配 PC / 手机
// 3. 路线点预计算，避免动画过程中重复 getPoints()
// 4. 减少动画过程中的临时 Vector3 创建
// 5. 统一 Earth RAF 生命周期
// 6. 修复地球文字状态冲突
// 7. 增加路线移动光点
// 8. 优化页面隐藏/恢复
// 9. 优化音乐加载
// 10. 优化 Resize
// 11. 保持原来的章节结构和交互
// ================================================================

import * as THREE from 'three';
import { startParticleStory, closeParticleStory } from './particles.js';


// ================================================================
// ==================== 可修改配置 ================================
// ================================================================

const birthdayData = {

    name: "许依诺",          // 她的名字
    me: "闫希然",            // 你的名字
    birthday: "2026.11.25",

    // 正式在一起的日期 → 自动算到生日这天(10.28 → 11.25 = 28 天)
    together: { start: "2026.10.28", until: "2026.11.25" },

    // -------------------- 记忆星星(点一下就点亮,想加几颗加几颗) --------------------
    story: [
        { date: "2026.10.28", title: "我们在一起了", text: "从这一天起,我的世界里多了一个想牵着走很远的人" },
        { date: "2026.11.29", title: "我第一次收到50条消息", text: "我刚刚起床,看见50条消息,心里超级超级激动!" },
        { date: "2026.11.25", title: "你的生日", text: "在一起的第 28 天,我想给你一个一辈子都忘不掉的生日" },
        { date: "现在", title: "我们", text: "隔着屏幕,可我知道我们的心很近很近" }
    ],

    photos: [
        { src: "assets/photo.jpeg", caption: "你的笑容,是我最珍贵的画面。" }
    ],

    song: { title: "我特意挑的歌哦", file: "assets/music.mp3" },

    // -------------------- 信件(空行 = 分段) --------------------
    letter: `亲爱的姐姐:

生日快乐呀!

这是我第一次,用代码给一个人写信

2026 年 10 月 28 日,我们正式在一起 到今天,不过 28 天,可我却觉得,已经认识你很久很久了

你说话的语气,你每一句晚安,都成了我每天最期待的事

虽然姐姐平时很忙,我们说话的机会不多

但是,我确实真正喜欢上你了

现在能遇到这么好的女生已经是很不容易啦

姐姐是世界上最漂亮的女孩子啦,温柔又漂亮

再过两天我们就在一起一个月啦,打破我谈的最长记录啦

姐姐可以永远放心,我一直都会好好爱你的!

你总是替别人着想,可你也会累  以后累的时候,换我来做你的依靠,好嘛姐姐

我没办法把蛋糕送到你面前,所以做了这个网页,把想说的话,一点一点放了进去

愿你被世界温柔以待,愿你所有的愿望都能实现

我只爱姐姐一个

—— 闫希然`,

    futureLetter:
        "我们都不知道未来会怎样\n\n但我知道,只要有你,我就有勇气面对一切\n\n谢谢你出现在我的生命里\n\n以后的每个生日,我都想陪你一起过",

    // -------------------- 最后的粒子剧场 --------------------
    finale: {
        cakeCaption: "吹蜡烛之前,先许个愿吧",
        lines: ["姐姐,生日快乐!", "我爱你姐姐", "一生一世", "只愛你"],
        names: "许依诺 ♡ 闫希然"
    },

    // -------------------- 地理位置 --------------------

    locations: {

        her: {
            name: "海口 · 海南 · 中国",
            lat: 20.0440,
            lon: 110.1999
        },

        me: {
            name: "Rostock · Germany",
            lat: 54.1178130,
            lon: 12.0604630
        }

    }

};


// ================================================================
// ==================== DOM 元素 =================================
// ================================================================

const chapters =
    document.querySelectorAll('.chapter');

const sectionDots =
    document.querySelectorAll('#section-dots .dot');

const timelineEl =
    document.getElementById('timeline');

const photoTrack =
    document.getElementById('photo-track');

const photoCounter =
    document.getElementById('photo-counter');

const photoCaption =
    document.getElementById('photo-caption');

const audioEl =
    document.getElementById('audio-element');

const playPauseBtn =
    document.getElementById('play-pause-btn');

const playIcon =
    document.getElementById('play-icon');

const pauseIcon =
    document.getElementById('pause-icon');

const progressBar =
    document.getElementById('progress-bar');

const progressFill =
    document.getElementById('progress-fill');

const currentTimeEl =
    document.getElementById('current-time');

const totalTimeEl =
    document.getElementById('total-time');

const vinylDisc =
    document.getElementById('vinyl-disc');

const songTitleDisplay =
    document.getElementById('song-title-display');

const envelope =
    document.getElementById('envelope');

const letterCard =
    document.getElementById('letter-card');

const letterText =
    document.getElementById('letter-text');

const giftBox =
    document.getElementById('gift-box');

const openGiftBtn =
    document.getElementById('open-gift-btn');

const birthdayNameDisplay =
    document.getElementById('birthday-name-display');

const celebrateBtn =
    document.getElementById('celebrate-btn');

const celebrationContainer =
    document.getElementById('celebration-container');

const particleStage =
    document.getElementById('particle-stage');

const particleCanvas =
    document.getElementById('particle-canvas');

const particleClose =
    document.getElementById('particle-close');

const celebrationFlash =
    document.getElementById('celebration-flash');

const celebrateSuccess =
    document.getElementById('celebrate-success');

const revealBtn =
    document.getElementById('reveal-btn');

const futureLetterText =
    document.getElementById('future-letter-text');

const earthContainer =
    document.getElementById('earth-container');

const earthOverlay =
    document.getElementById('earth-overlay');

const earthTextStage =
    document.getElementById('earth-text-stage');

const replayEarthBtn =
    document.getElementById('replay-earth-btn');


// ================================================================
// ==================== 安全 DOM 检查 ==============================
// ================================================================

function exists(el) {
    return el !== null && el !== undefined;
}


// ================================================================
// ==================== 设备性能检测 ===============================
// ================================================================

const reducedMotion =
    window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;

const isMobile =
    /Android|iPhone|iPad|iPod/i.test(
        navigator.userAgent
    );

const deviceMemory =
    navigator.deviceMemory || 4;

const hardwareConcurrency =
    navigator.hardwareConcurrency || 4;


// 自动选择质量等级

let performanceLevel = 'high';

if (isMobile) {

    if (deviceMemory <= 4 || hardwareConcurrency <= 4) {
        performanceLevel = 'low';
    } else {
        performanceLevel = 'medium';
    }

}


// ================================================================
// ==================== 画质配置 ==================================
// ================================================================

const QUALITY = {

    low: {

        stars: 400,

        landDots: 1500,

        cityLights: 80,

        sphere: 28,

        pixelRatio: 1,

        antialias: false

    },

    medium: {

        stars: 800,

        landDots: 3000,

        cityLights: 160,

        sphere: 40,

        pixelRatio: 1.25,

        antialias: false

    },

    high: {

        stars: 1500,

        landDots: 6000,

        cityLights: 300,

        sphere: 64,

        pixelRatio:
            Math.min(window.devicePixelRatio || 1, 2),

        antialias: true

    }

};

const QUALITY_CONFIG =
    QUALITY[performanceLevel];


// ================================================================
// ==================== 页面初始化配置 =============================
// ================================================================

function initConfigDisplay() {

    const tb = document.getElementById('together-badge');
    if (tb) {
        const p = (t) => new Date(t.replace(/\./g, '-') + 'T00:00:00');
        const days = Math.round((p(birthdayData.together.until) - p(birthdayData.together.start)) / 864e5);
        tb.innerHTML = `正式在一起 · 到你生日这天,已经 <b>${days}</b> 天`;
    }
    const au = document.getElementById('future-author');
    if (au) au.textContent = `—— ${birthdayData.me}`;

    if (exists(birthdayNameDisplay)) {
        birthdayNameDisplay.textContent =
            birthdayData.name;
    }

    if (exists(songTitleDisplay)) {
        songTitleDisplay.textContent =
            birthdayData.song.title;
    }

    if (exists(futureLetterText)) {
        futureLetterText.textContent =
            birthdayData.futureLetter;
    }

    if (exists(audioEl)) {

        audioEl.preload = 'metadata';

        audioEl.src =
            birthdayData.song.file;

        audioEl.volume = 0.7;

        audioEl.addEventListener(
            'error',
            () => {
                console.warn(
                    '音乐文件加载失败：',
                    birthdayData.song.file
                );
            }
        );

        audioEl.addEventListener(
            'canplay',
            () => {
                console.log(
                    '音乐文件加载成功'
                );
            },
            { once: true }
        );

        audioEl.load();
    }

}


// ================================================================
// ==================== Chapter Observer ==========================
// ================================================================

const chapterObserver =
    new IntersectionObserver(
        (entries) => {

            entries.forEach(
                (entry) => {

                    const chapter =
                        entry.target;

                    const index =
                        parseInt(
                            chapter.dataset.index,
                            10
                        );

                    if (entry.isIntersecting) {

                        chapter.classList.add(
                            'visible'
                        );

                        sectionDots.forEach(
                            (dot) => {

                                dot.classList.toggle(
                                    'active',
                                    parseInt(
                                        dot.dataset.section,
                                        10
                                    ) === index
                                );

                            }
                        );

                        if (index === 1) {
                            animateTimelineItems();
                        }

                        if (index === 5) {
                            startEarthAnimation();
                        }

                    } else {

                        chapter.classList.remove(
                            'visible'
                        );

                    }

                }
            );

        },
        {
            threshold: 0.3,
            rootMargin:
                '0px 0px -10% 0px'
        }
    );


chapters.forEach(
    chapter =>
        chapterObserver.observe(chapter)
);


// ================================================================
// ==================== 章节导航 ==================================
// ================================================================

sectionDots.forEach(
    (dot) => {

        dot.addEventListener(
            'click',
            () => {

                const index =
                    parseInt(
                        dot.dataset.section,
                        10
                    );

                const target =
                    chapters[index];

                if (target) {

                    target.scrollIntoView({
                        behavior: 'smooth'
                    });

                }

            }
        );

    }
);


// ================================================================
// ==================== Chapter 0 礼物 ==============================
// ================================================================

let giftOpening = false;

function openGift() {

    if (giftOpening) return;

    giftOpening = true;

    if (exists(giftBox)) {

        giftBox.style.transition =
            'opacity 0.6s ease, transform 0.6s ease';

        giftBox.style.opacity = '0';

        giftBox.style.transform =
            'scale(0.8)';

    }

    if (exists(openGiftBtn)) {

        openGiftBtn.style.transition =
            'opacity 0.5s ease';

        openGiftBtn.style.opacity = '0';

    }

    setTimeout(
        () => {

            if (chapters[1]) {

                chapters[1].scrollIntoView({
                    behavior: 'smooth'
                });

            }

        },
        500
    );

    setTimeout(
        () => {

            if (exists(giftBox)) {

                giftBox.style.opacity = '1';

                giftBox.style.transform =
                    'scale(1)';

            }

            if (exists(openGiftBtn)) {
                openGiftBtn.style.opacity = '1';
            }

            giftOpening = false;

        },
        2000
    );

}


if (exists(giftBox)) {

    giftBox.addEventListener(
        'click',
        openGift
    );

    giftBox.addEventListener(
        'keydown',
        (e) => {

            if (
                e.key === 'Enter' ||
                e.key === ' '
            ) {

                e.preventDefault();

                openGift();

            }

        }
    );

}


if (exists(openGiftBtn)) {

    openGiftBtn.addEventListener(
        'click',
        openGift
    );

}


// ================================================================
// ==================== Chapter 1 时间线 ============================
// ================================================================

function renderTimeline() {

    if (!exists(timelineEl)) return;

    timelineEl.innerHTML = '';

    birthdayData.story.forEach(
        (item, index) => {

            const div =
                document.createElement('div');

            div.className =
                'timeline-item';

            div.style.transitionDelay =
                `${index * 0.08}s`;

            const date =
                document.createElement('div');

            date.className =
                'timeline-date';

            date.textContent =
                item.date;

            const title =
                document.createElement('div');

            title.className =
                'timeline-title';

            title.textContent =
                item.title;

            const text =
                document.createElement('div');

            text.className =
                'timeline-text';

            text.textContent =
                item.text;

            div.appendChild(date);
            div.appendChild(title);
            div.appendChild(text);

            div.addEventListener(
                'click',
                () => {

                    div.classList.toggle(
                        'expanded'
                    );

                }
            );

            timelineEl.appendChild(div);

        }
    );

}


let timelineAnimated = false;

function animateTimelineItems() {

    if (timelineAnimated) return;

    timelineAnimated = true;

    const items =
        timelineEl?.querySelectorAll(
            '.timeline-item'
        );

    if (!items) return;

    items.forEach(
        (item, index) => {

            setTimeout(
                () => {

                    item.classList.add(
                        'visible'
                    );

                },
                index * 120
            );

        }
    );

}


// ================================================================
// ==================== Chapter 2 相册 ==============================
// ================================================================

let currentPhotoIndex = 0;

let photoTouchStartX = 0;
let photoTouchDeltaX = 0;

let mouseDown = false;
let mouseStartX = 0;
let mouseDeltaX = 0;

const photoCarousel =
    document.querySelector(
        '.photo-carousel'
    );


function renderPhotoCarousel() {

    if (!exists(photoTrack)) return;

    photoTrack.innerHTML = '';

    birthdayData.photos.forEach(
        (photo, index) => {

            const slide =
                document.createElement('div');

            slide.className =
                'photo-slide';

            const img =
                document.createElement('img');

            img.src = photo.src;

            img.alt =
                photo.caption;

            img.loading =
                index === 0
                    ? 'eager'
                    : 'lazy';

            img.decoding =
                'async';

            img.draggable =
                false;

            img.addEventListener(
                'contextmenu',
                (e) => {
                    e.preventDefault();
                }
            );

            img.onerror =
                () => {

                    slide.innerHTML = '';

                    const placeholder =
                        document.createElement('div');

                    placeholder.className =
                        'photo-placeholder';

                    placeholder.textContent =
                        `照片 ${index + 1}`;

                    slide.appendChild(
                        placeholder
                    );

                };

            slide.appendChild(img);

            photoTrack.appendChild(
                slide
            );

        }
    );

    updatePhotoDisplay();

}


function updatePhotoDisplay() {

    const total =
        birthdayData.photos.length;

    if (exists(photoCounter)) {

        photoCounter.textContent =
            `${String(
                currentPhotoIndex + 1
            ).padStart(2, '0')} / ${String(
                total
            ).padStart(2, '0')}`;

    }

    if (exists(photoCaption)) {

        photoCaption.textContent =
            birthdayData
                .photos[currentPhotoIndex]
                ?.caption || '';

    }

    if (exists(photoTrack)) {

        photoTrack.style.transform =
            `translate3d(-${
                currentPhotoIndex * 100
            }%, 0, 0)`;

    }

}


function nextPhoto() {

    if (
        currentPhotoIndex <
        birthdayData.photos.length - 1
    ) {

        currentPhotoIndex++;

        updatePhotoDisplay();

    }

}


function previousPhoto() {

    if (currentPhotoIndex > 0) {

        currentPhotoIndex--;

        updatePhotoDisplay();

    }

}


if (exists(photoCarousel)) {

    photoCarousel.addEventListener(
        'touchstart',
        (e) => {

            photoTouchStartX =
                e.touches[0].clientX;

            photoTouchDeltaX = 0;

        },
        {
            passive: true
        }
    );

    photoCarousel.addEventListener(
        'touchmove',
        (e) => {

            photoTouchDeltaX =
                e.touches[0].clientX -
                photoTouchStartX;

        },
        {
            passive: true
        }
    );

    photoCarousel.addEventListener(
        'touchend',
        () => {

            const threshold = 50;

            if (
                photoTouchDeltaX <
                -threshold
            ) {

                nextPhoto();

            } else if (
                photoTouchDeltaX >
                threshold
            ) {

                previousPhoto();

            }

            photoTouchDeltaX = 0;

        }
    );


    photoCarousel.addEventListener(
        'mousedown',
        (e) => {

            mouseDown = true;

            mouseStartX =
                e.clientX;

            mouseDeltaX = 0;

        }
    );

}


document.addEventListener(
    'mousemove',
    (e) => {

        if (!mouseDown) return;

        mouseDeltaX =
            e.clientX -
            mouseStartX;

    }
);


document.addEventListener(
    'mouseup',
    () => {

        if (!mouseDown) return;

        const threshold = 50;

        if (
            mouseDeltaX <
            -threshold
        ) {

            nextPhoto();

        } else if (
            mouseDeltaX >
            threshold
        ) {

            previousPhoto();

        }

        mouseDown = false;

        mouseDeltaX = 0;

    }
);


// ================================================================
// ==================== Chapter 3 音乐 ==============================
// ================================================================

let isPlaying = false;
let audioInitialized = false;


function togglePlay() {

    if (!exists(audioEl)) return;

    if (!audioInitialized) {

        audioEl.load();

        audioInitialized = true;

    }

    if (isPlaying) {

        audioEl.pause();

    } else {

        const promise =
            audioEl.play();

        if (promise) {

            promise.catch(
                (err) => {

                    console.warn(
                        '播放失败：',
                        err
                    );

                }
            );

        }

    }

}


if (exists(playPauseBtn)) {

    playPauseBtn.addEventListener(
        'click',
        togglePlay
    );

}


if (exists(audioEl)) {

    audioEl.addEventListener(
        'play',
        () => {

            isPlaying = true;

            if (exists(playIcon)) {
                playIcon.style.display =
                    'none';
            }

            if (exists(pauseIcon)) {
                pauseIcon.style.display =
                    'inline';
            }

            if (exists(vinylDisc)) {
                vinylDisc.classList.remove(
                    'paused'
                );
            }

        }
    );


    audioEl.addEventListener(
        'pause',
        () => {

            isPlaying = false;

            if (exists(playIcon)) {
                playIcon.style.display =
                    'inline';
            }

            if (exists(pauseIcon)) {
                pauseIcon.style.display =
                    'none';
            }

            if (exists(vinylDisc)) {
                vinylDisc.classList.add(
                    'paused'
                );
            }

        }
    );


    audioEl.addEventListener(
        'loadedmetadata',
        () => {

            if (exists(totalTimeEl)) {

                totalTimeEl.textContent =
                    formatTime(
                        audioEl.duration
                    );

            }

        }
    );


    audioEl.addEventListener(
        'timeupdate',
        () => {

            if (exists(currentTimeEl)) {

                currentTimeEl.textContent =
                    formatTime(
                        audioEl.currentTime
                    );

            }

            if (
                exists(progressFill) &&
                audioEl.duration
            ) {

                progressFill.style.width =
                    `${(
                        audioEl.currentTime /
                        audioEl.duration
                    ) * 100}%`;

            }

        }
    );

}


if (exists(progressBar)) {

    progressBar.addEventListener(
        'click',
        (e) => {

            if (
                !exists(audioEl) ||
                !audioEl.duration
            ) return;

            const rect =
                progressBar.getBoundingClientRect();

            const ratio =
                Math.max(
                    0,
                    Math.min(
                        1,
                        (e.clientX - rect.left) /
                        rect.width
                    )
                );

            audioEl.currentTime =
                ratio *
                audioEl.duration;

        }
    );

}


function formatTime(seconds) {

    if (
        !seconds ||
        Number.isNaN(seconds)
    ) {
        return '0:00';
    }

    const mins =
        Math.floor(seconds / 60);

    const secs =
        Math.floor(seconds % 60);

    return `${mins}:${String(
        secs
    ).padStart(2, '0')}`;

}


// ================================================================
// ==================== Chapter 4 信封 ==============================
// ================================================================

let letterOpened = false;
const envelopeHint = document.getElementById('envelope-hint');

// 仪式:点一下封蜡 → 蜡封裂开、迸出金光 → 信封翻盖 → 信纸升起 → 一段一段浮现
function openLetter() {
    if (letterOpened || !exists(envelope)) return;
    letterOpened = true;
    if (navigator.vibrate) navigator.vibrate([30, 50, 90]);
    envelope.classList.add('cracking');
    if (exists(envelopeHint)) envelopeHint.classList.add('gone');
    for (let i = 0; i < 18; i++) {
        const sp = document.createElement('i');
        const a = (i / 18) * Math.PI * 2, d = 50 + Math.random() * 60;
        sp.className = 'seal-spark';
        sp.style.setProperty('--tx', `${Math.cos(a) * d}px`);
        sp.style.setProperty('--ty', `${Math.sin(a) * d}px`);
        envelope.appendChild(sp);
        setTimeout(() => sp.remove(), 1500);
    }
    setTimeout(() => envelope.classList.add('opened'), 900);
    setTimeout(() => envelope.classList.add('fade'), 1700);
    setTimeout(() => {
        envelope.style.display = 'none';
        if (!exists(letterCard) || !exists(letterText)) return;
        letterCard.style.display = 'block';
        letterCard.classList.add('rise');
        letterText.innerHTML = '';
        birthdayData.letter.split('\n\n').forEach((para, index) => {
            const p = document.createElement('p');
            p.textContent = para.trim();
            p.style.animationDelay = `${0.8 + index * 0.9}s`;
            letterText.appendChild(p);
        });
    }, 2300);
}

if (exists(envelope)) {
    envelope.addEventListener('click', openLetter);
    envelope.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLetter(); }
    });
}


// ================================================================
// ==================== Chapter 5 3D Earth =========================
// ================================================================

let scene = null;
let camera = null;
let renderer = null;

let earthGroup = null;
let earthMesh = null;

let wireframeGroup = null;
let atmosphereMesh = null;

let cityLightsPoints = null;

let herMarker = null;
let meMarker = null;

let routeLine = null;
let routePoints = null;
let routeParticles = null;

let routeCurve = null;
let routeSamplePoints = null;
let countryOutlinesGroup = null;

let starsField = null;


// -------------------- Earth RAF 状态 --------------------

let earthVisible = false;
let earthRendering = false;
let rafId = null;

let lastFrameTime = 0;


// -------------------- 动画状态 --------------------

let animationState = 'idle';

let animationStartTime = 0;
let animationElapsed = 0;


// -------------------- 摄像机 --------------------

const cameraTargetPosition =
    new THREE.Vector3();

const cameraTargetLookAt =
    new THREE.Vector3();


// -------------------- 四元数 --------------------

const earthTargetQuat =
    new THREE.Quaternion();

const earthCurrentQuat =
    new THREE.Quaternion();


// -------------------- 纹理 --------------------

const textureLoader =
    new THREE.TextureLoader();


// -------------------- 临时 Vector3 --------------------

const tempRoutePoint =
    new THREE.Vector3();

const tempCamOffset =
    new THREE.Vector3();

const tempRouteParticle =
    new THREE.Vector3();

const tempRouteDirection =
    new THREE.Vector3();

const earthFrontDirection =
    new THREE.Vector3(0, 0, 1);


// -------------------- 文字状态 --------------------

let herNameShown = false;
let herSubShown = false;

let meNameShown = false;
let meSubShown = false;

let distanceShown = false;

let openingTextShown = false;
let midTextShown = false;

let emotionalTextStarted = false;
let emotionalTextStep = -1;

const EARTH_ANIMATION_DURATION = 60;


// ================================================================
// ==================== 重置文字状态 ===============================
// ================================================================

function resetTextFlags() {

    herNameShown = false;
    herSubShown = false;

    meNameShown = false;
    meSubShown = false;

    distanceShown = false;

    openingTextShown = false;
    midTextShown = false;

    emotionalTextStarted = false;
    emotionalTextStep = -1;

}


// ================================================================
// ==================== 距离计算 ==================================
// ================================================================

function haversineDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371;

    const dLat =
        (lat2 - lat1) *
        Math.PI / 180;

    const dLon =
        (lon2 - lon1) *
        Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(
            lat1 * Math.PI / 180
        ) *
        Math.cos(
            lat2 * Math.PI / 180
        ) *
        Math.sin(dLon / 2) ** 2;

    return (
        R *
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        )
    );

}


// ================================================================
// ==================== 经纬度 → 3D ================================
// ================================================================

function latLonToVector3(
    lat,
    lon,
    radius
) {

    const phi =
        (90 - lat) *
        Math.PI / 180;

    const theta =
        (lon + 180) *
        Math.PI / 180;

    const x =
        -radius *
        Math.sin(phi) *
        Math.cos(theta);

    const y =
        radius *
        Math.cos(phi);

    const z =
        radius *
        Math.sin(phi) *
        Math.sin(theta);

    return new THREE.Vector3(
        x,
        y,
        z
    );

}


// ================================================================
// ==================== 初始化 Three.js ============================
// ================================================================

function initThreeJS() {

    if (scene) return;

    if (
        reducedMotion ||
        !exists(earthContainer)
    ) {

        if (exists(earthTextStage)) {

            earthTextStage.innerHTML =
                `
                <p class="earth-text visible">
                    虽然我们现在不在同一个地方……
                </p>
                <p class="earth-text visible highlight">
                    但距离只是地图上的距离
                </p>
                `;

        }

        return;

    }


    const width =
        Math.max(
            1,
            earthContainer.clientWidth
        );

    const height =
        Math.max(
            1,
            earthContainer.clientHeight
        );


    // -------------------- Scene --------------------

    scene =
        new THREE.Scene();

    scene.background =
        new THREE.Color(
            0x0a0a12
        );

    scene.fog =
        new THREE.Fog(
            0x0a0a12,
            3,
            12
        );

    scene.add(
        new THREE.HemisphereLight(
            0x8aa4ff,
            0x080b18,
            0.45
        )
    );

    const sunlight =
        new THREE.DirectionalLight(
            0xffffff,
            0.75
        );

    sunlight.position.set(
        -3,
        2,
        4
    );

    scene.add(
        sunlight
    );


    // -------------------- Camera --------------------

    camera =
        new THREE.PerspectiveCamera(
            50,
            width / height,
            0.1,
            100
        );

    camera.position.set(
        0,
        1.5,
        5
    );

    camera.lookAt(
        0,
        0,
        0
    );


    // -------------------- Renderer --------------------

    renderer =
        new THREE.WebGLRenderer({

            antialias:
                QUALITY_CONFIG.antialias,

            alpha: false,

            powerPreference:
                'high-performance',

            precision:
                performanceLevel === 'low'
                    ? 'mediump'
                    : 'highp'

        });


    renderer.setSize(
        width,
        height,
        false
    );

    renderer.setPixelRatio(
        QUALITY_CONFIG.pixelRatio
    );

    renderer.shadowMap.enabled =
        false;


    earthContainer.appendChild(
        renderer.domElement
    );


    // -------------------- 星空 --------------------

    createEnhancedStars();


    // -------------------- 地球 --------------------

    earthGroup =
        new THREE.Group();

    scene.add(
        earthGroup
    );


    // -------------------- 地球纹理 --------------------

    textureLoader.load(

        'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',

        (texture) => {

            texture.colorSpace =
                THREE.SRGBColorSpace;

            const material =
                new THREE.MeshStandardMaterial({

                    map: texture,

                    color: 0xffffff,

                    emissive: 0x06112d,

                    emissiveIntensity: 0.16,

                    roughness: 0.7,

                    metalness: 0.05

                });


            earthMesh =
                new THREE.Mesh(

                    new THREE.SphereGeometry(
                        1,
                        QUALITY_CONFIG.sphere,
                        QUALITY_CONFIG.sphere
                    ),

                    material

                );


            earthGroup.add(
                earthMesh
            );


            createWireframe();

            createAtmosphere();

            createLandmassDots();

            createCityLights();

            createLocationMarkers();

            createRouteCurve();

            loadCountryOutlines();

        },

        undefined,

        (error) => {

            console.warn(
                'Earth texture loading failed:',
                error
            );

            createFallbackEarth();

        }

    );


    // -------------------- 初始状态 --------------------

    earthCurrentQuat.copy(
        earthGroup.quaternion
    );

    cameraTargetPosition.copy(
        camera.position
    );

    cameraTargetLookAt.set(
        0,
        0,
        0
    );

}


// ================================================================
// ==================== 备用地球 ==================================
// ================================================================

function createFallbackEarth() {

    if (!earthGroup) return;

    const material =
        new THREE.MeshStandardMaterial({

            color: 0x0a1628,

            roughness: 0.8,

            metalness: 0.05

        });


    earthMesh =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                1,
                QUALITY_CONFIG.sphere,
                QUALITY_CONFIG.sphere
            ),

            material

        );


    earthGroup.add(
        earthMesh
    );


    createWireframe();

    createAtmosphere();

    createCityLights();

    createLandmassDots();

    createLocationMarkers();

    createRouteCurve();

    loadCountryOutlines();

}


// 从公开 GeoJSON 绘制目标国家的真实边界，避免用矩形点云猜大陆形状。
async function loadCountryOutlines() {

    if (!earthGroup || countryOutlinesGroup) return;

    try {

        const response = await fetch(
            'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'
        );

        if (!response.ok) return;

        const data = await response.json();

        countryOutlinesGroup = new THREE.Group();

        const countryStyles = {
            China: 0xf2c879,
            Germany: 0x9ed8ff
        };

        data.features
            .filter((feature) => {
                const name =
                    feature.properties?.ADMIN ||
                    feature.properties?.NAME;

                return name === 'China' || name === 'Germany';
            })
            .forEach((feature) => {

                const name =
                    feature.properties?.ADMIN ||
                    feature.properties?.NAME;

                const polygons =
                    feature.geometry.type === 'Polygon'
                        ? [feature.geometry.coordinates]
                        : feature.geometry.coordinates;

                polygons.forEach((polygon) => {

                    const outline = polygon[0]
                        .map(([lon, lat]) =>
                            latLonToVector3(lat, lon, 1.058)
                        );

                    if (outline.length < 3) return;

                    const geometry =
                        new THREE.BufferGeometry()
                            .setFromPoints(outline);

                    countryOutlinesGroup.add(
                        new THREE.LineLoop(
                            geometry,
                            new THREE.LineBasicMaterial({
                                color: countryStyles[name],
                                transparent: true,
                                opacity: 0.95,
                                blending: THREE.AdditiveBlending,
                                depthWrite: false,
                                depthTest: false
                            })
                        )
                    );

                });

            });

        earthGroup.add(countryOutlinesGroup);

    } catch (error) {
        console.warn('Country boundary loading failed:', error);
    }

}


// ================================================================
// ==================== 星空 ======================================
// ================================================================

function createEnhancedStars() {

    if (!scene) return;

    const starCount =
        reducedMotion
            ? 250
            : QUALITY_CONFIG.stars;


    const geometry =
        new THREE.BufferGeometry();


    const positions =
        new Float32Array(
            starCount * 3
        );

    const colors =
        new Float32Array(
            starCount * 3
        );


    for (
        let i = 0;
        i < starCount;
        i++
    ) {

        const theta =
            Math.random() *
            Math.PI * 2;

        const phi =
            Math.acos(
                2 * Math.random() - 1
            );

        const radius =
            5 +
            Math.random() * 10;


        positions[i * 3] =
            radius *
            Math.sin(phi) *
            Math.cos(theta);

        positions[i * 3 + 1] =
            radius *
            Math.sin(phi) *
            Math.sin(theta);

        positions[i * 3 + 2] =
            radius *
            Math.cos(phi);


        const colorType =
            Math.random();


        if (colorType < 0.6) {

            colors[i * 3] =
                0.8 +
                Math.random() * 0.2;

            colors[i * 3 + 1] =
                0.8 +
                Math.random() * 0.2;

            colors[i * 3 + 2] =
                0.9 +
                Math.random() * 0.1;

        } else if (
            colorType < 0.8
        ) {

            colors[i * 3] =
                0.7;

            colors[i * 3 + 1] =
                0.7;

            colors[i * 3 + 2] =
                1.0;

        } else {

            colors[i * 3] =
                0.9;

            colors[i * 3 + 1] =
                0.85;

            colors[i * 3 + 2] =
                1.0;

        }

    }


    geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(
            positions,
            3
        )
    );

    geometry.setAttribute(
        'color',
        new THREE.BufferAttribute(
            colors,
            3
        )
    );


    const material =
        new THREE.PointsMaterial({

            size:
                performanceLevel === 'low'
                    ? 0.018
                    : 0.02,

            vertexColors: true,

            transparent: true,

            opacity: 0.9,

            blending:
                THREE.AdditiveBlending,

            depthWrite: false,

            sizeAttenuation: true

        });


    starsField =
        new THREE.Points(
            geometry,
            material
        );


    scene.add(
        starsField
    );

}


// ================================================================
// ==================== 光点大陆 ==================================
// ================================================================

function createLandmassDots() {

    if (!earthGroup) return;

    const dotCount =
        reducedMotion
            ? 1000
            : QUALITY_CONFIG.landDots;


    const geometry =
        new THREE.BufferGeometry();


    const positions =
        new Float32Array(
            dotCount * 3
        );

    const colors =
        new Float32Array(
            dotCount * 3
        );


    const landRegions = [

        // 北美洲
        {
            latMin: 15,
            latMax: 70,
            lonMin: -170,
            lonMax: -50
        },

        // 南美洲
        {
            latMin: -55,
            latMax: 15,
            lonMin: -80,
            lonMax: -35
        },

        // 欧洲
        {
            latMin: 35,
            latMax: 70,
            lonMin: -10,
            lonMax: 40
        },

        // 非洲
        {
            latMin: -35,
            latMax: 35,
            lonMin: -20,
            lonMax: 50
        },

        // 亚洲
        {
            latMin: 10,
            latMax: 75,
            lonMin: 40,
            lonMax: 180
        },

        // 澳洲
        {
            latMin: -40,
            latMax: -10,
            lonMin: 110,
            lonMax: 155
        },

        // 格陵兰
        {
            latMin: 60,
            latMax: 83,
            lonMin: -73,
            lonMax: -20
        }

    ];


    let index = 0;

    const pointsPerRegion =
        Math.floor(
            dotCount /
            landRegions.length
        );


    landRegions.forEach(
        (region) => {

            for (
                let i = 0;
                i < pointsPerRegion;
                i++
            ) {

                const lat =
                    region.latMin +
                    Math.random() *
                    (
                        region.latMax -
                        region.latMin
                    );

                const lon =
                    region.lonMin +
                    Math.random() *
                    (
                        region.lonMax -
                        region.lonMin
                    );


                const pos =
                    latLonToVector3(
                        lat,
                        lon,
                        1.005
                    );


                positions[index * 3] =
                    pos.x;

                positions[index * 3 + 1] =
                    pos.y;

                positions[index * 3 + 2] =
                    pos.z;


                const shade =
                    0.2 +
                    Math.random() * 0.4;


                colors[index * 3] =
                    0.3 +
                    shade * 0.3;

                colors[index * 3 + 1] =
                    0.4 +
                    shade * 0.4;

                colors[index * 3 + 2] =
                    0.5 +
                    shade * 0.5;


                index++;

            }

        }
    );


    geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(
            positions,
            3
        )
    );

    geometry.setAttribute(
        'color',
        new THREE.BufferAttribute(
            colors,
            3
        )
    );


    const material =
        new THREE.PointsMaterial({

            size:
                performanceLevel === 'low'
                    ? 0.007
                    : 0.008,

            vertexColors: true,

            transparent: true,

                opacity: 0.38,

            blending:
                THREE.AdditiveBlending,

            depthWrite: false

        });


    const landDots =
        new THREE.Points(
            geometry,
            material
        );


    earthGroup.add(
        landDots
    );

}


// ================================================================
// ==================== 经纬网 ====================================
// ================================================================

function createWireframe() {

    if (!earthGroup) return;

    wireframeGroup =
        new THREE.Group();


    const material =
        new THREE.LineBasicMaterial({

            color: 0x1a3050,

            transparent: true,

            opacity: 0.2,

            depthWrite: false

        });


    // 纬线

    for (
        let lat = -60;
        lat <= 60;
        lat += 30
    ) {

        const points = [];

        for (
            let lon = -180;
            lon <= 180;
            lon += 8
        ) {

            points.push(
                latLonToVector3(
                    lat,
                    lon,
                    1.005
                )
            );

        }


        const geometry =
            new THREE.BufferGeometry()
                .setFromPoints(
                    points
                );


        wireframeGroup.add(
            new THREE.Line(
                geometry,
                material
            )
        );

    }


    // 经线

    for (
        let lon = -180;
        lon < 180;
        lon += 30
    ) {

        const points = [];

        for (
            let lat = -85;
            lat <= 85;
            lat += 6
        ) {

            points.push(
                latLonToVector3(
                    lat,
                    lon,
                    1.005
                )
            );

        }


        const geometry =
            new THREE.BufferGeometry()
                .setFromPoints(
                    points
                );


        wireframeGroup.add(
            new THREE.Line(
                geometry,
                material
            )
        );

    }


    earthGroup.add(
        wireframeGroup
    );

}


// ================================================================
// ==================== 大气层 ====================================
// ================================================================

function createAtmosphere() {

    if (!earthGroup) return;

    const geometry =
        new THREE.SphereGeometry(
            1.08,
            24,
            24
        );


    const material =
        new THREE.ShaderMaterial({

            vertexShader: `

                varying vec3 vNormal;
                varying vec3 vPosition;

                void main() {

                    vNormal =
                        normalize(
                            normalMatrix *
                            normal
                        );

                    vPosition =
                        (
                            modelViewMatrix *
                            vec4(
                                position,
                                1.0
                            )
                        ).xyz;

                    gl_Position =
                        projectionMatrix *
                        modelViewMatrix *
                        vec4(
                            position,
                            1.0
                        );

                }

            `,

            fragmentShader: `

                varying vec3 vNormal;
                varying vec3 vPosition;

                void main() {

                    vec3 viewDir =
                        normalize(
                            -vPosition
                        );

                    float fresnel =
                        1.0 -
                        abs(
                            dot(
                                viewDir,
                                vNormal
                            )
                        );

                    fresnel =
                        pow(
                            fresnel,
                            3.0
                        );

                    vec3 color =
                        mix(
                            vec3(
                                0.3,
                                0.2,
                                0.6
                            ),
                            vec3(
                                0.6,
                                0.4,
                                1.0
                            ),
                            fresnel
                        );

                    gl_FragColor =
                        vec4(
                            color,
                            fresnel * 0.5
                        );

                }

            `,

            transparent: true,

            blending:
                THREE.AdditiveBlending,

            depthWrite: false,

            side:
                THREE.FrontSide

        });


    atmosphereMesh =
        new THREE.Mesh(
            geometry,
            material
        );


    earthGroup.add(
        atmosphereMesh
    );

}


// ================================================================
// ==================== 城市灯光 ==================================
// ================================================================

function createCityLights() {

    if (!earthGroup) return;

    const lightCount =
        reducedMotion
            ? 60
            : QUALITY_CONFIG.cityLights;


    const geometry =
        new THREE.BufferGeometry();


    const positions =
        new Float32Array(
            lightCount * 3
        );

    const colors =
        new Float32Array(
            lightCount * 3
        );


    const cityZones = [

        {
            lat: 20.0,
            lon: 110.2,
            spread: 15
        },

        {
            lat: 54.1,
            lon: 12.1,
            spread: 10
        },

        {
            lat: 35.0,
            lon: 135.0,
            spread: 12
        },

        {
            lat: 40.7,
            lon: -74.0,
            spread: 15
        },

        {
            lat: 51.5,
            lon: -0.1,
            spread: 12
        },

        {
            lat: 48.8,
            lon: 2.3,
            spread: 10
        },

        {
            lat: 55.7,
            lon: 37.6,
            spread: 10
        },

        {
            lat: 31.2,
            lon: 121.5,
            spread: 12
        }

    ];


    for (
        let i = 0;
        i < lightCount;
        i++
    ) {

        let lat;
        let lon;


        if (
            Math.random() <
            0.6
        ) {

            const zone =
                cityZones[
                    Math.floor(
                        Math.random() *
                        cityZones.length
                    )
                ];


            lat =
                zone.lat +
                (
                    Math.random() -
                    0.5
                ) *
                zone.spread;


            lon =
                zone.lon +
                (
                    Math.random() -
                    0.5
                ) *
                zone.spread;

        } else {

            lat =
                (
                    Math.random() -
                    0.5
                ) *
                140;

            lon =
                (
                    Math.random() -
                    0.5
                ) *
                350;

        }


        const pos =
            latLonToVector3(
                lat,
                lon,
                1.01
            );


        positions[i * 3] =
            pos.x;

        positions[i * 3 + 1] =
            pos.y;

        positions[i * 3 + 2] =
            pos.z;


        const warmth =
            Math.random();


        colors[i * 3] =
            0.8 +
            warmth * 0.2;

        colors[i * 3 + 1] =
            0.6 +
            warmth * 0.3;

        colors[i * 3 + 2] =
            0.3 +
            warmth * 0.2;

    }


    geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(
            positions,
            3
        )
    );

    geometry.setAttribute(
        'color',
        new THREE.BufferAttribute(
            colors,
            3
        )
    );


    cityLightsPoints =
        new THREE.Points(

            geometry,

            new THREE.PointsMaterial({

                size: 0.015,

                vertexColors: true,

                transparent: true,

                opacity: 0.7,

                blending:
                    THREE.AdditiveBlending,

                depthWrite: false

            })

        );


    earthGroup.add(
        cityLightsPoints
    );

}


// ================================================================
// ==================== 地理位置 Marker ============================
// ================================================================

function createLocationMarkers() {

    if (!earthGroup) return;


    const herPos =
        latLonToVector3(

            birthdayData
                .locations
                .her
                .lat,

            birthdayData
                .locations
                .her
                .lon,

            1.02

        );


    herMarker =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                0.025,
                8,
                8
            ),

            new THREE.MeshBasicMaterial({
                color: 0xc4b5fd
            })

        );


    herMarker.position.copy(
        herPos
    );

    earthGroup.add(
        herMarker
    );


    const herRing =
        new THREE.Mesh(

            new THREE.RingGeometry(
                0.03,
                0.05,
                16
            ),

            new THREE.MeshBasicMaterial({

                color: 0xa78bfa,

                transparent: true,

                opacity: 0.5,

                blending:
                    THREE.AdditiveBlending,

                side:
                    THREE.DoubleSide,

                depthWrite: false

            })

        );


    herRing.position.copy(
        herPos
    );

    herRing.lookAt(
        new THREE.Vector3(
            0,
            0,
            0
        )
    );

    earthGroup.add(
        herRing
    );


    // -------------------- 我的坐标 --------------------

    const mePos =
        latLonToVector3(

            birthdayData
                .locations
                .me
                .lat,

            birthdayData
                .locations
                .me
                .lon,

            1.02

        );


    meMarker =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                0.025,
                8,
                8
            ),

            new THREE.MeshBasicMaterial({
                color: 0xc4b5fd
            })

        );


    meMarker.position.copy(
        mePos
    );

    earthGroup.add(
        meMarker
    );


    const meRing =
        new THREE.Mesh(

            new THREE.RingGeometry(
                0.03,
                0.05,
                16
            ),

            new THREE.MeshBasicMaterial({

                color: 0xa78bfa,

                transparent: true,

                opacity: 0.5,

                blending:
                    THREE.AdditiveBlending,

                side:
                    THREE.DoubleSide,

                depthWrite: false

            })

        );


    meRing.position.copy(
        mePos
    );

    meRing.lookAt(
        new THREE.Vector3(
            0,
            0,
            0
        )
    );

    earthGroup.add(
        meRing
    );

}


// ================================================================
// ==================== 中国 → 德国路线 ============================
// ================================================================

function createRouteCurve() {

    if (!earthGroup) return;


    const herPos =
        latLonToVector3(

            birthdayData
                .locations
                .her
                .lat,

            birthdayData
                .locations
                .her
                .lon,

            1.04

        );


    const mePos =
        latLonToVector3(

            birthdayData
                .locations
                .me
                .lat,

            birthdayData
                .locations
                .me
                .lon,

            1.04

        );


    const herVec =
        herPos
            .clone()
            .normalize();

    const meVec =
        mePos
            .clone()
            .normalize();


    const angle =
        Math.acos(

            Math.max(
                -1,
                Math.min(
                    1,
                    herVec.dot(meVec)
                )
            )

        );


    const samples = 120;

    const points = [];


    for (
        let i = 0;
        i <= samples;
        i++
    ) {

        const t =
            i / samples;


        let point;


        if (angle < 0.001) {

            point =
                herVec.clone();

        } else {

            const sinAngle =
                Math.sin(angle);

            const s1 =
                Math.sin(
                    (1 - t) *
                    angle
                ) /
                sinAngle;

            const s2 =
                Math.sin(
                    t * angle
                ) /
                sinAngle;


            point =
                herVec
                    .clone()
                    .multiplyScalar(s1)
                    .add(
                        meVec
                            .clone()
                            .multiplyScalar(s2)
                    )
                    .normalize();

        }


        point.multiplyScalar(
            1.045
        );


        points.push(
            point
        );

    }


    routeCurve =
        new THREE.CatmullRomCurve3(
            points
        );


    // 只计算一次

    routeSamplePoints =
        routeCurve.getPoints(
            samples
        );


    // ============================================================
    // 路线 Line
    // ============================================================

    const linePositions =
        new Float32Array(
            routeSamplePoints.length * 3
        );


    routeSamplePoints.forEach(
        (point, index) => {

            linePositions[
                index * 3
            ] = point.x;

            linePositions[
                index * 3 + 1
            ] = point.y;

            linePositions[
                index * 3 + 2
            ] = point.z;

        }
    );


    const lineGeometry =
        new THREE.BufferGeometry();


    lineGeometry.setAttribute(

        'position',

        new THREE.BufferAttribute(
            linePositions,
            3
        )

    );


    routeLine =
        new THREE.Line(

            lineGeometry,

            new THREE.LineBasicMaterial({

                color: 0xffc477,

                transparent: true,

                opacity: 1,

                blending:
                    THREE.AdditiveBlending,

                depthWrite: false,

                depthTest: false

            })

        );


    routeLine.visible =
        false;


    routeLine.geometry.setDrawRange(
        0,
        0
    );


    earthGroup.add(
        routeLine
    );


    // ============================================================
    // 路线移动光点
    // ============================================================

    routePoints =
        new THREE.BufferGeometry();


    const particlePosition =
        new Float32Array(3);


    routePoints.setAttribute(

        'position',

        new THREE.BufferAttribute(
            particlePosition,
            3
        )

    );


    routeParticles =
        new THREE.Points(

            routePoints,

            new THREE.PointsMaterial({

                size:
                    performanceLevel === 'low'
                        ? 0.012
                        : 0.016,

                color: 0xe0d5ff,

                transparent: true,

                opacity: 0.95,

                blending:
                    THREE.AdditiveBlending,

                depthWrite: false

            })

        );


    routeParticles.visible =
        false;


    earthGroup.add(
        routeParticles
    );

}


// ================================================================
// ==================== 地球旋转计算 ===============================
// ================================================================

function computeRotationForLatLon(
    lat,
    lon
) {

    const targetPos =
        latLonToVector3(
            lat,
            lon,
            1
        );


    const targetDir =
        targetPos
            .normalize();


    const desiredDir =
        new THREE.Vector3(
            0,
            0,
            1
        );


    return new THREE.Quaternion()
        .setFromUnitVectors(
            targetDir,
            desiredDir
        );

}


// ================================================================
// ==================== 缓动函数 ==================================
// ================================================================

function easeInOutCubic(t) {

    return t < 0.5
        ? 4 * t * t * t
        : 1 -
          Math.pow(
              -2 * t + 2,
              3
          ) / 2;

}


function easeOutCubic(t) {

    return 1 -
        Math.pow(
            1 - t,
            3
        );

}


// ================================================================
// ==================== Earth Animation ============================
// ================================================================

function startEarthAnimation() {

    if (reducedMotion) return;

    if (!earthVisible) {

        earthVisible = true;

        initThreeJS();

        animationState =
            'playing';

        animationStartTime =
            performance.now();

        animationElapsed = 0;

        resetTextFlags();

        if (exists(replayEarthBtn)) {

            replayEarthBtn.style.display =
                'none';

        }

        startEarthRendering();

    } else {

        resumeEarthRendering();

    }

}


// ================================================================
// ==================== RAF 控制 ===================================
// ================================================================

function startEarthRendering() {

    if (
        earthRendering ||
        !scene ||
        !renderer
    ) {
        return;
    }

    earthRendering = true;

    lastFrameTime =
        performance.now();

    rafId =
        requestAnimationFrame(
            renderLoop
        );

}


function stopEarthRendering() {

    earthRendering = false;

    if (rafId !== null) {

        cancelAnimationFrame(
            rafId
        );

        rafId = null;

    }

}


function pauseEarthRendering() {

    stopEarthRendering();

}


function resumeEarthRendering() {

    if (
        scene &&
        earthVisible
    ) {

        startEarthRendering();

    }

}


// ================================================================
// ==================== Earth Render Loop ==========================
// ================================================================

function renderLoop(timestamp) {

    if (
        !earthRendering ||
        !scene ||
        !renderer
    ) {

        rafId = null;

        return;

    }


    const delta =
        Math.min(

            (
                timestamp -
                lastFrameTime
            ) / 1000,

            0.05

        );


    lastFrameTime =
        timestamp;


    if (
        animationState ===
        'playing'
    ) {

        animationElapsed +=
            delta;

        updateEarthAnimation(
            animationElapsed
        );

    }


    if (
        animationState ===
        'done'
    ) {

        earthGroup.quaternion.slerp(
            earthTargetQuat,
            0.02
        );

    }


    // 星空缓慢旋转

    if (starsField) {

        starsField.rotation.y +=
            delta * 0.01;

        starsField.rotation.x +=
            delta * 0.005;

    }


    // 路线移动光点

    updateRouteParticle();


    camera.position.lerp(
        cameraTargetPosition,
        0.08
    );


    camera.lookAt(
        cameraTargetLookAt
    );


    renderer.render(
        scene,
        camera
    );


    rafId =
        requestAnimationFrame(
            renderLoop
        );

}


// ================================================================
// ==================== 路线移动光点 ================================
// ================================================================

function updateRouteParticle() {

    if (
        !routeParticles ||
        !routeParticles.visible ||
        !routeCurve
    ) {
        return;
    }


    const start =
        EARTH_ANIMATION_DURATION * 0.24;

    const duration =
        EARTH_ANIMATION_DURATION * 0.26;


    const progress =
        (
            animationElapsed -
            start
        ) /
        duration;


    if (
        progress < 0 ||
        progress > 1
    ) {
        return;
    }


    const eased =
        easeInOutCubic(
            progress
        );


    routeCurve.getPoint(
        eased,
        tempRouteParticle
    );


    const attribute =
        routeParticles
            .geometry
            .attributes
            .position;


    attribute.setXYZ(
        0,

        tempRouteParticle.x,

        tempRouteParticle.y,

        tempRouteParticle.z

    );


    attribute.needsUpdate =
        true;

}


// ================================================================
// ==================== 地球主动画 =================================
// ================================================================

function updateEarthAnimation(
    elapsed
) {

    const duration = EARTH_ANIMATION_DURATION;

    const t =
        Math.min(
            elapsed / duration,
            1
        );


    // ============================================================
    // 0% - 10%
    // 地球浮现
    // ============================================================

    if (t < 0.10) {

        const s =
            t / 0.10;

        const easeS =
            easeOutCubic(s);


        cameraTargetPosition.set(
            0,
            1.2,
            8 -
            easeS * 3.5
        );


        earthTargetQuat.setFromEuler(

            new THREE.Euler(
                easeS * 0.25,
                easeS * 1.5,
                0
            )

        );


        earthGroup.quaternion.slerp(
            earthTargetQuat,
            0.05
        );


        if (
            s > 0.6 &&
            !openingTextShown
        ) {

            openingTextShown =
                true;

            showEarthText(
                '虽然我们现在不在同一个地方……',
                false
            );

        }

    }


    // ============================================================
    // 10% - 18%
    // 飞向海口
    // ============================================================

    else if (t < 0.18) {

        const s =
            (t - 0.10) /
            0.08;


        earthTargetQuat.copy(

            computeRotationForLatLon(

                birthdayData
                    .locations
                    .her
                    .lat,

                birthdayData
                    .locations
                    .her
                    .lon

            )

        );


        earthGroup.quaternion.slerp(
            earthTargetQuat,
            0.04
        );


        cameraTargetPosition.set(
            0,
            0.5,
            4.5 -
            easeInOutCubic(s) *
            1.8
        );


        hideEarthText();

    }


    // ============================================================
    // 18% - 24%
    // 海口
    // ============================================================

    else if (t < 0.24) {

        const s =
            (t - 0.18) /
            0.06;


        earthTargetQuat.copy(

            computeRotationForLatLon(

                birthdayData
                    .locations
                    .her
                    .lat,

                birthdayData
                    .locations
                    .her
                    .lon

            )

        );


        earthGroup.quaternion.slerp(
            earthTargetQuat,
            0.04
        );


        cameraTargetPosition.set(
            0,
            0.3,
            3.5
        );


        if (
            !herNameShown &&
            s > 0.2
        ) {

            herNameShown =
                true;

            herSubShown =
                true;

            showEarthLocation(
                birthdayData
                    .locations
                    .her
                    .name,
                '你所在的位置'
            );

        }

    }


    // ============================================================
    // 24% - 50%
    // 路线绘制
    // ============================================================

    else if (t < 0.50) {

        const s =
            (t - 0.24) /
            0.26;


        const easeS =
            easeInOutCubic(s);


        if (routeLine) {

            routeLine.visible =
                true;

        }


        if (routeParticles) {

            routeParticles.visible =
                true;

        }


        if (routeLine) {

            const count =
                Math.floor(
                    easeS *
                    routeSamplePoints.length
                );


            routeLine.geometry.setDrawRange(
                0,
                Math.max(
                    2,
                    count
                )
            );

        }


        if (routeCurve) {

            routeCurve.getPoint(
                easeS * 0.6,
                tempRoutePoint
            );

            tempRouteDirection
                .copy(tempRoutePoint)
                .normalize();

            earthTargetQuat.setFromUnitVectors(
                tempRouteDirection,
                earthFrontDirection
            );

            earthGroup.quaternion.slerp(
                earthTargetQuat,
                0.055
            );


            tempCamOffset
                .copy(
                    tempRoutePoint
                )
                .normalize()
                .multiplyScalar(2.2);


            cameraTargetPosition.set(

                tempRoutePoint.x +
                tempCamOffset.x *
                0.5,

                tempRoutePoint.y +
                tempCamOffset.y *
                0.5,

                tempRoutePoint.z +
                tempCamOffset.z *
                1.2

            );

        }


        hideEarthText();

    }


    // ============================================================
    // 50% - 62%
    // 拉远全景
    // ============================================================

    else if (t < 0.62) {

        const s =
            (t - 0.50) /
            0.12;


        const easeS =
            easeInOutCubic(s);


        cameraTargetPosition.set(
            0,
            2.5,
            3 +
            easeS * 3
        );


        earthTargetQuat.setFromEuler(

            new THREE.Euler(
                0.2,
                (
                    30 *
                    Math.PI / 180
                ) *
                easeS +
                (
                    birthdayData
                        .locations
                        .her
                        .lon *
                        Math.PI / 180
                ) *
                (1 - easeS),
                0
            )

        );


        earthGroup.quaternion.slerp(
            earthTargetQuat,
            0.04
        );


        if (
            !midTextShown &&
            s > 0.5
        ) {

            midTextShown =
                true;

            showEarthText(
                '我们真的隔了很远',
                false
            );


            setTimeout(
                hideEarthText,
                1500
            );

        }

    }


    // ============================================================
    // 62% - 75%
    // 飞向 Rostock
    // ============================================================

    else if (t < 0.75) {

        const s =
            (t - 0.62) /
            0.13;


        const easeS =
            easeInOutCubic(s);


        earthTargetQuat.copy(

            computeRotationForLatLon(

                birthdayData
                    .locations
                    .me
                    .lat,

                birthdayData
                    .locations
                    .me
                    .lon

            )

        );


        earthGroup.quaternion.slerp(
            earthTargetQuat,
            0.04
        );


        cameraTargetPosition.set(
            0,
            0.4,
            6 -
            easeS * 2.8
        );


        if (
            !meNameShown &&
            s > 0.3
        ) {

            meNameShown =
                true;

            meSubShown =
                true;

            showEarthLocation(
                birthdayData
                    .locations
                    .me
                    .name,
                '我所在的位置'
            );

        }

    }


    // ============================================================
    // 75% - 84%
    // 显示距离
    // ============================================================

    else if (t < 0.84) {

        const s =
            (t - 0.75) /
            0.09;


        earthTargetQuat.copy(

            computeRotationForLatLon(

                birthdayData
                    .locations
                    .me
                    .lat,

                birthdayData
                    .locations
                    .me
                    .lon

            )

        );


        earthGroup.quaternion.slerp(
            earthTargetQuat,
            0.04
        );


        cameraTargetPosition.set(
            0,
            0.5,
            3.6
        );


        if (
            !distanceShown &&
            s > 0.3
        ) {

            distanceShown =
                true;


            const distance =
                haversineDistance(

                    birthdayData
                        .locations
                        .her
                        .lat,

                    birthdayData
                        .locations
                        .her
                        .lon,

                    birthdayData
                        .locations
                        .me
                        .lat,

                    birthdayData
                        .locations
                        .me
                        .lon

                );


            showEarthText(

                `${Math.round(
                    distance
                ).toLocaleString()} km`,

                true,

                'distance-number'

            );


        }

    }


    // ============================================================
    // 84% - 100%
    // 情感转折
    // ============================================================

    else {

        if (
            routeParticles
        ) {

            routeParticles.visible =
                false;

        }


        const emotionalElapsed =
            elapsed - duration * 0.84;

        const nextStep =
            emotionalElapsed < 3
                ? 0
                : emotionalElapsed < 6
                    ? 1
                    : emotionalElapsed < 9
                        ? 2
                        : 3;

        if (nextStep !== emotionalTextStep) {

            emotionalTextStep = nextStep;
            emotionalTextStarted = true;

            hideEarthText();

            const messages = [
                '但是距离只是地图上的距离。',
                '它没有让你离我的世界变远。',
                '因为今天，我把这段距离做成了一场旅行。',
                '继续 →'
            ];

            showEarthText(
                messages[nextStep],
                nextStep === 3,
                nextStep === 3 ? 'highlight' : ''
            );

            if (
                nextStep === 3 &&
                exists(replayEarthBtn)
            ) {
                replayEarthBtn.style.display =
                    'block';
            }

            if (
                nextStep === 3 &&
                emotionalElapsed >= 12
            ) {
                animationState =
                    'done';
            }

        }

    }

}


// ================================================================
// ==================== Earth Text ================================
// ================================================================

function showEarthLocation(
    locationName,
    relation
) {

    if (!exists(earthTextStage)) return;

    earthTextStage.innerHTML = '';

    const location =
        document.createElement('div');

    location.className =
        'earth-location';

    const name =
        document.createElement('p');

    name.className =
        'earth-text visible highlight';

    name.textContent =
        locationName;

    const caption =
        document.createElement('p');

    caption.className =
        'earth-text visible';

    caption.textContent =
        relation;

    location.appendChild(name);
    location.appendChild(caption);
    earthTextStage.appendChild(location);

}

function showEarthText(
    text,
    isHighlight = false,
    extraClass = ''
) {

    if (!exists(earthTextStage)) {
        return;
    }


    const existing =
        earthTextStage.querySelector(
            '.earth-text.visible'
        );


    if (
        existing &&
        existing.textContent === text
    ) {

        return;

    }


    // 清除正在显示的旧文本

    earthTextStage
        .querySelectorAll(
            '.earth-text'
        )
        .forEach(
            (element) => {

                element.classList.remove(
                    'visible'
                );

            }
        );


    const p =
        document.createElement('p');


    p.className =
        `earth-text ${
            isHighlight
                ? 'highlight'
                : ''
        } ${
            extraClass
        }`;


    p.textContent =
        text;


    earthTextStage.appendChild(
        p
    );


    requestAnimationFrame(
        () => {

            p.classList.add(
                'visible'
            );

        }
    );


    // 最多保留 3 个

    while (
        earthTextStage.children.length >
        3
    ) {

        earthTextStage.removeChild(
            earthTextStage.firstChild
        );

    }

}


function hideEarthText() {

    if (!exists(earthTextStage)) {
        return;
    }


    earthTextStage
        .querySelectorAll(
            '.earth-text'
        )
        .forEach(
            (element) => {

                if (
                    element.classList.contains(
                        'distance-number'
                    )
                ) {
                    return;
                }


                element.classList.remove(
                    'visible'
                );


                setTimeout(
                    () => {

                        if (
                            element.parentNode
                        ) {

                            element.remove();

                        }

                    },
                    800
                );

            }
        );

}


// ================================================================
// ==================== Earth Replay ==============================
// ================================================================

if (exists(replayEarthBtn)) {

    replayEarthBtn.addEventListener(
        'click',
        () => {

            if (!scene) {
                initThreeJS();
            }


            animationState =
                'playing';


            animationStartTime =
                performance.now();


            animationElapsed =
                0;


            resetTextFlags();


            if (
                exists(earthTextStage)
            ) {

                earthTextStage.innerHTML =
                    '';

            }


            if (routeLine) {

                routeLine.visible =
                    false;

                routeLine.geometry
                    .setDrawRange(
                        0,
                        0
                    );

            }


            if (routeParticles) {

                routeParticles.visible =
                    false;

            }


            replayEarthBtn.style.display =
                'none';


            startEarthRendering();

        }
    );

}


// ================================================================
// ==================== Earth Intersection =========================
// ================================================================

const earthSection =
    document.getElementById(
        'chapter-5'
    );


if (exists(earthSection)) {

    const earthSectionObserver =
        new IntersectionObserver(

            (entries) => {

                entries.forEach(
                    (entry) => {

                        if (
                            entry.isIntersecting
                        ) {

                            if (
                                !earthVisible
                            ) {

                                startEarthAnimation();

                            } else {

                                resumeEarthRendering();

                            }

                        } else {

                            pauseEarthRendering();

                        }

                    }
                );

            },

            {
                threshold: 0.2
            }

        );


    earthSectionObserver.observe(
        earthSection
    );

}


// ================================================================
// ==================== 页面可见性 =================================
// ================================================================

document.addEventListener(
    'visibilitychange',
    () => {

        if (
            document.hidden
        ) {

            pauseEarthRendering();


            if (
                isPlaying &&
                exists(audioEl)
            ) {

                audioEl.pause();

            }

        } else {

            // 只有 Earth 在当前页面时恢复

            if (
                earthVisible &&
                exists(earthSection)
            ) {

                const rect =
                    earthSection
                        .getBoundingClientRect();


                const visible =
                    rect.top <
                    window.innerHeight &&
                    rect.bottom > 0;


                if (visible) {

                    resumeEarthRendering();

                }

            }

        }

    }
);


// ================================================================
// ==================== Chapter 6 庆祝 ==============================
// ================================================================

const CELEBRATE_COLORS = [
    '#a78bfa',
    '#c4b5fd',
    '#8b7cf8',
    '#e0d5ff',
    '#ffd700',
    '#ff6b9d',
    '#7cf8d0',
    '#ffffff'
];

const CELEBRATE_EMOJI = ['🎉', '🎂', '✨', '💜', '🎈', '🌟'];

// 从指定原点向四周炸开的一波粒子（星星 / 圆点 / 表情混合）
function spawnBurstWave(originXPercent, originYPercent, count, spreadMultiplier) {

    if (!exists(celebrationContainer)) return;

    for (let i = 0; i < count; i++) {

        const particle = document.createElement('div');
        particle.className = 'celebration-particle';

        const roll = Math.random();
        const isEmoji = roll < 0.16;
        const isStar = !isEmoji && roll < 0.4;

        const angle = Math.random() * Math.PI * 2;
        const distance = (120 + Math.random() * 260) * spreadMultiplier;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance - 40; // 略微偏上，模拟烟花上扬

        particle.style.left = `${originXPercent}%`;
        particle.style.top = `${originYPercent}%`;
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        particle.style.setProperty('--rot', `${(Math.random() - 0.5) * 720}deg`);

        if (isEmoji) {
            particle.classList.add('shape-emoji');
            particle.textContent = CELEBRATE_EMOJI[Math.floor(Math.random() * CELEBRATE_EMOJI.length)];
            const emojiSize = 16 + Math.random() * 14;
            particle.style.setProperty('--emoji-size', `${emojiSize}px`);
            particle.style.width = `${emojiSize}px`;
            particle.style.height = `${emojiSize}px`;
        } else {
            const size = 3 + Math.random() * 7;
            const background = CELEBRATE_COLORS[Math.floor(Math.random() * CELEBRATE_COLORS.length)];
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.background = background;
            particle.style.boxShadow = `0 0 ${size * 3}px ${background}`;
            if (isStar) particle.classList.add('shape-star');
        }

        particle.style.animationDuration = `${1.4 + Math.random() * 1.4}s`;
        particle.style.animationDelay = `${Math.random() * 0.15}s`;

        celebrationContainer.appendChild(particle);
        setTimeout(() => particle.remove(), 3200);
    }

}

// 顶部飘落的彩带雨，持续几秒，制造惊喜的持续感
function spawnConfettiRain(count, durationMs) {

    if (!exists(celebrationContainer)) return;

    for (let i = 0; i < count; i++) {

        const particle = document.createElement('div');
        particle.className = 'celebration-particle confetti-fall';

        const isStar = Math.random() < 0.3;
        const size = 4 + Math.random() * 6;
        const background = CELEBRATE_COLORS[Math.floor(Math.random() * CELEBRATE_COLORS.length)];

        particle.style.left = `${Math.random() * 100}%`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.background = background;
        particle.style.boxShadow = `0 0 ${size * 2}px ${background}`;
        if (isStar) particle.classList.add('shape-star');

        particle.style.setProperty('--tx', `${(Math.random() - 0.5) * 160}px`);
        particle.style.setProperty('--rot', `${360 + Math.random() * 360}deg`);

        const duration = 2.2 + Math.random() * 1.6;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${Math.random() * (durationMs / 1000)}s`;

        celebrationContainer.appendChild(particle);
        setTimeout(() => particle.remove(), durationMs + duration * 1000 + 200);

    }

}

function flashScreen() {

    if (!exists(celebrationFlash)) return;

    celebrationFlash.classList.remove('flash-active');
    // 强制重排以便动画可以重新触发
    void celebrationFlash.offsetWidth;
    celebrationFlash.classList.add('flash-active');

}

function triggerCelebration() {

    if (!exists(celebrationContainer)) return;

    // 轻微震动反馈（若设备支持）
    if (navigator.vibrate) {
        navigator.vibrate([20, 40, 20, 40, 60]);
    }

    flashScreen();

    const burstCount = isMobile ? 26 : 40;

    // 第一波：从按钮位置附近炸开
    spawnBurstWave(50, 58, burstCount, isMobile ? 0.85 : 1);

    // 后续几波，从不同位置错峰炸开，模拟真实烟花
    const extraBursts = [
        { x: 25, y: 45, delay: 220 },
        { x: 75, y: 42, delay: 380 },
        { x: 50, y: 30, delay: 560 }
    ];

    extraBursts.forEach(({ x, y, delay }) => {
        setTimeout(() => {
            spawnBurstWave(x, y, Math.round(burstCount * 0.55), isMobile ? 0.8 : 1);
        }, delay);
    });

    // 顶部飘落的彩带雨，持续制造惊喜氛围
    spawnConfettiRain(isMobile ? 18 : 28, 1800);

}

// ================================================================
// ==================== 庆祝按钮 / 最后的粒子剧场 ===================
// ================================================================

if (exists(celebrateBtn)) {
    celebrateBtn.addEventListener('click', () => {
        triggerCelebration();
        celebrateBtn.classList.add('is-clicked');
        setTimeout(() => celebrateBtn.classList.add('is-hidden'), 550);
        if (exists(celebrateSuccess)) celebrateSuccess.classList.add('show');
    }, { once: true });
}

const finaleBtn = document.getElementById('finale-btn');
if (exists(finaleBtn)) finaleBtn.addEventListener('click', () => startParticleStory(birthdayData.finale));
if (exists(particleClose)) particleClose.addEventListener('click', closeParticleStory);


// ================================================================
// ==================== Chapter 7 揭示 ==============================
// ================================================================

if (exists(revealBtn)) {

    revealBtn.addEventListener(
        'click',
        () => {

            if (chapters[8]) {

                chapters[8].scrollIntoView({
                    behavior: 'smooth'
                });

            }

        }
    );

}


// ================================================================
// ==================== Resize =====================================
// ================================================================

let resizeTimer = null;


function handleResize() {


    if (
        !renderer ||
        !camera ||
        !earthContainer
    ) {
        return;
    }


    const width =
        Math.max(
            1,
            earthContainer.clientWidth
        );

    const height =
        Math.max(
            1,
            earthContainer.clientHeight
        );


    renderer.setSize(
        width,
        height,
        false
    );


    camera.aspect =
        width / height;


    camera.updateProjectionMatrix();

}


window.addEventListener(
    'resize',
    () => {

        clearTimeout(
            resizeTimer
        );


        resizeTimer =
            setTimeout(
                handleResize,
                100
            );

    },
    {
        passive: true
    }
);


window.addEventListener(
    'orientationchange',
    () => {

        setTimeout(
            handleResize,
            300
        );

    },
    {
        passive: true
    }
);


// ================================================================
// ==================== 页面卸载 ==================================
// ================================================================

window.addEventListener(
    'beforeunload',
    () => {

        stopEarthRendering();


        if (
            exists(audioEl)
        ) {

            audioEl.pause();

        }

    }
);


// ================================================================
// ==================== 初始化 ====================================
// ================================================================

function init() {

    initConfigDisplay();

    renderTimeline();

    renderPhotoCarousel();


    if (chapters[0]) {

        chapters[0].classList.add(
            'visible'
        );

    }


    console.log(
        '🎂 生日礼物网站已加载'
    );

    console.log(
        '👤 名字：',
        birthdayData.name
    );

    console.log(
        '🎵 音乐文件：',
        birthdayData.song.file
    );

    console.log(
        '🖥️ 性能等级：',
        performanceLevel
    );

    console.log(
        '📱 移动设备：',
        isMobile
    );

}


init();