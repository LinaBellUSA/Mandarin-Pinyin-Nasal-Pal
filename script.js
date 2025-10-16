// 全局变量
let wordPairs = [];
let currentPairIndex = 0;
let learnedPairs = [];
let wrongPairs = [];
let currentGameWords = [];
let currentChallengeWord = null;
let currentChallengeIsFront = false;
let score = 0;
let totalQuestions = 0;

// 共享音频上下文，避免重复创建导致播放失败
let audioCtx = null;
function ensureAudioContext() {
    try {
        if (!audioCtx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) audioCtx = new AC();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
    } catch (e) {
        console.warn('AudioContext 初始化失败', e);
    }
    return audioCtx;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async function() {
    console.log('1. 页面加载完成');
    
    try {
        // 显示首页
        showSection('homeSection');
        
        // 解析CSV数据
        await parseCSV();
        
        // 初始化UI
        initUI();
        // 首次用户交互时解锁音频权限
        const unlock = () => ensureAudioContext();
        document.addEventListener('click', unlock, { once: true });
        document.addEventListener('touchstart', unlock, { once: true });
        // 图片加载失败时提供回退
        const headerImg = document.getElementById('headerImg');
        if (headerImg) {
            headerImg.addEventListener('error', function () {
                this.outerHTML = `<svg class="h-16 w-16 mr-4 rounded-lg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-label="前后鼻音学习助手图标">
  <circle cx="32" cy="32" r="29" fill="#f0f9ff" stroke="#60a5fa" stroke-width="3"/>
  <path d="M18 32h28" stroke="#60a5fa" stroke-width="3" stroke-linecap="round"/>
  <path d="M26 24l-6 8 6 8" fill="none" stroke="#f472b6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M38 24l6 8-6 8" fill="none" stroke="#f472b6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="32" cy="32" r="4" fill="#60a5fa"/>
</svg>`;
            });
        }
        const heroImg = document.getElementById('heroImg');
        if (heroImg) {
            heroImg.addEventListener('error', function () {
                this.outerHTML = `<svg class="h-40 rounded-xl" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-label="前后鼻音主题插画">
  <circle cx="60" cy="40" r="30" fill="#f0f9ff" stroke="#60a5fa" stroke-width="3"/>
  <path d="M30 90h25" stroke="#60a5fa" stroke-width="6" stroke-linecap="round"/>
  <path d="M65 90h25" stroke="#f472b6" stroke-width="6" stroke-linecap="round"/>
  <path d="M48 40c0-8 24-8 24 0" fill="none" stroke="#60a5fa" stroke-width="3" stroke-linecap="round"/>
  <path d="M40 52c8 6 32 6 40 0" fill="none" stroke="#f472b6" stroke-width="3" stroke-linecap="round"/>
</svg>`;
            });
        }
        
        // 添加事件监听器
        addEventListeners();
        
        console.log('初始化完成');
    } catch (error) {
        console.error('初始化过程中出错:', error);
    }
});

// 初始化UI
function initUI() {
    console.log('6. 初始化UI');
    try {
        // 显示首页
        showSection('homeSection');
        
        // 固定 compare/classify 模块的 h3 文本为 前鼻音 / 后鼻音
        const compareH3 = document.querySelectorAll('#compareSection h3');
        if (compareH3 && compareH3.length >= 2) {
            compareH3[0].textContent = '前鼻音';
            compareH3[1].textContent = '后鼻音';
        }
        const classifyH3 = document.querySelectorAll('#classifySection h3');
        if (classifyH3 && classifyH3.length >= 2) {
            classifyH3[0].textContent = '前鼻音';
            classifyH3[1].textContent = '后鼻音';
        }
        
        // 添加错题复习模块
        if (wordPairs && wordPairs.length > 0) {
            // 查找未学习的词对
            findUnlearnedPair();
            
            // 添加错题复习模块
            addMistakeReviewModules();
            // 对比听读页注入“标记为错题/错题本”按钮
            addCompareMistakeControls();
            
            // 加载学习进度
            loadProgress();
            
            // 更新词对显示
            updateWordPair();
        } else {
            console.warn('词对数据为空，无法初始化UI');
        }
        
        // 顶部导航按钮（通过id）
        const homeBtn = document.getElementById('homeBtn');
        if (homeBtn) {
            homeBtn.addEventListener('click', function() {
                showSection('homeSection');
            });
        }
        const compareBtn = document.getElementById('compareBtn');
        if (compareBtn) {
            compareBtn.addEventListener('click', function() {
                showSection('compareSection');
                findUnlearnedPair();
                updateWordPair();
            });
        }
        const classifyBtn = document.getElementById('classifyBtn');
        if (classifyBtn) {
            classifyBtn.addEventListener('click', function() {
                showSection('classifySection');
                initClassifyGame();
            });
        }
        const challengeBtn = document.getElementById('challengeBtn');
        if (challengeBtn) {
            challengeBtn.addEventListener('click', function() {
                showSection('challengeSection');
                initChallengeGame();
            });
        }
    } catch (e) {
        console.error('初始化UI失败', e);
    }
}

// 添加事件监听器
function addEventListeners() {
    console.log('7. 添加事件监听器');
    try {
        // 导航菜单点击事件
        const navLinks = document.querySelectorAll('nav a');
        if (navLinks && navLinks.length > 0) {
            navLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const section = this.getAttribute('href').substring(1);
                    showSection(section);
                    
                    // 如果是对比听读页面，更新词对显示
                    if (section === 'compareSection') {
                        findUnlearnedPair();
                        updateWordPair();
                    }
                });
            });
        }
        
        // 主页功能按钮点击事件
        const featureButtons = document.querySelectorAll('.feature-btn, .goToCompareBtn, .goToClassifyBtn, .goToChallengeBtn');
        if (featureButtons && featureButtons.length > 0) {
            featureButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    let section;
                    
                    // 根据按钮类名确定要显示的部分
                    if (this.classList.contains('goToCompareBtn')) {
                        section = 'compare';
                    } else if (this.classList.contains('goToClassifyBtn')) {
                        section = 'classify';
                    } else if (this.classList.contains('goToChallengeBtn')) {
                        section = 'challenge';
                    } else {
                        section = this.getAttribute('data-section');
                    }
                    
                    showSection(section + 'Section');
                    
                    // 如果是对比听读页面，更新词对显示
                    if (section === 'compare') {
                        findUnlearnedPair();
                        updateWordPair();
                    } else if (section === 'classify') {
                        initClassifyGame();
                    } else if (section === 'challenge') {
                        initChallengeGame();
                    }
                });
            });
        }
        
        // 对比听读页面按钮事件（适配index.html中的实际ID）
        const prevBtnEl = document.getElementById('prevBtn');
        if (prevBtnEl) {
            prevBtnEl.addEventListener('click', function() {
                currentPairIndex = (currentPairIndex - 1 + wordPairs.length) % wordPairs.length;
                updateWordPair();
            });
        }
        
        const nextBtnEl = document.getElementById('nextBtn');
        if (nextBtnEl) {
            nextBtnEl.addEventListener('click', function() {
                currentPairIndex = (currentPairIndex + 1) % wordPairs.length;
                updateWordPair();
            });
        }
        
        // 播放按钮事件在下方批量绑定，避免重复绑定
        
        // 模态窗口关闭按钮
        const closeModalBtn = document.getElementById('closeModalBtn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', function() {
                document.getElementById('feedbackModal').classList.add('hidden');
            });
        }
        
        const closeWordListBtn = document.getElementById('closeWordListBtn');
        if (closeWordListBtn) {
            closeWordListBtn.addEventListener('click', function() {
                document.getElementById('wordListModal').classList.add('hidden');
            });
        }
        
        // 词汇表按钮
        const wordListBtn = document.getElementById('wordListBtn');
        if (wordListBtn) {
            wordListBtn.addEventListener('click', showWordList);
        }

        // 分类游戏按钮：检查与新游戏
        const checkClassifyBtn = document.getElementById('checkClassifyBtn');
        if (checkClassifyBtn) {
            checkClassifyBtn.addEventListener('click', function() {
                showFeedback(true, '已检查', '拖拽到正确区域继续练习');
            });
        }
        const newGameBtn = document.getElementById('newGameBtn');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', function() {
                initClassifyGame();
            });
        }

        // 辨音挑战按钮：播放与下一题
        const playChallengeBtn = document.getElementById('playChallengeBtn');
        if (playChallengeBtn) {
            playChallengeBtn.addEventListener('click', function() {
                const wordToPlay = currentChallengeIsFront ? (currentChallengeWord && currentChallengeWord.front) : (currentChallengeWord && currentChallengeWord.back);
                if (wordToPlay) speakText(wordToPlay);
            });
        }
        const nextChallengeBtn = document.getElementById('nextChallengeBtn');
        if (nextChallengeBtn) {
            nextChallengeBtn.addEventListener('click', function() {
                showNextChallengeWord();
            });
        }
        
        console.log('8. 事件监听器添加完成');
    } catch (e) {
        console.error('添加事件监听器失败', e);
    }
}
    
    // 兼容playFrontBtn和playBackBtn类
    document.querySelectorAll('.playFrontBtn').forEach(btn => {
        btn.addEventListener('click', function() {
            const el = document.getElementById('frontNasalWord');
            if (el) speakText(el.textContent);
        });
    });
    
    document.querySelectorAll('.playBackBtn').forEach(btn => {
        btn.addEventListener('click', function() {
            const el = document.getElementById('backNasalWord');
            if (el) speakText(el.textContent);
        });
    });
    
    // 添加点击汉字播放发音的事件
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('chinese-char')) {
            speakText(e.target.textContent);
        }
    });
    
    // 词汇表显示按钮已在上方绑定，避免重复绑定
    
    // 对比听读：标记为错题 / 打开错题本（事件委托，兼容动态注入）
    document.addEventListener('click', function(e) {
        const markBtn = e.target.closest('#markMistakeBtn');
        if (markBtn) {
            e.preventDefault();
            markCurrentPairAsMistake();
            return;
        }
        const bookBtn = e.target.closest('#mistakeBookBtn');
        if (bookBtn) {
            e.preventDefault();
            showMistakeBook('time');
            return;
        }
    });
    
    // 错题本：排序按钮
    const sortByTimeBtn = document.getElementById('sortByTimeBtn');
    if (sortByTimeBtn) {
        sortByTimeBtn.addEventListener('click', function() {
            showMistakeBook('time');
        });
    }
    const sortByFrequencyBtn = document.getElementById('sortByFrequencyBtn');
    if (sortByFrequencyBtn) {
        sortByFrequencyBtn.addEventListener('click', function() {
            showMistakeBook('freq');
        });
    }
    // 错题本：关闭按钮
    const closeMistakeListBtn = document.getElementById('closeMistakeListBtn');
    if (closeMistakeListBtn) {
        closeMistakeListBtn.addEventListener('click', function() {
            const modal = document.getElementById('mistakeListModal');
            if (modal) modal.classList.add('hidden');
        });
    }
    // 错题本：移除事件（委托）
    const mistakeListContainer = document.getElementById('mistakeListContainer');
    if (mistakeListContainer) {
        mistakeListContainer.addEventListener('click', function(e) {
            const btn = e.target.closest('.remove-mistake-btn');
            if (btn) {
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                if (!isNaN(idx) && wordPairs[idx]) {
                    wordPairs[idx].mistakes = 0;
                    wordPairs[idx].lastMistakeAt = null;
                    saveProgress();
                    showMistakeBook();
                }
            }
        });
    }
    
    // 添加错题复习按钮事件
    document.addEventListener('click', function(e) {
        if (e.target.closest('.review-mistakes-btn')) {
            const section = e.target.closest('.review-mistakes-btn').getAttribute('data-section');
            reviewMistakes(section);
        }
    });
    
    // 分类游戏拖拽事件（wordPool卡片适配）
    document.querySelectorAll('.drop-target').forEach(target => {
        // 若未设置分类属性，则根据ID设置
        if (!target.getAttribute('data-category')) {
            if (target.id === 'frontNasalBasket') target.setAttribute('data-category', 'front');
            if (target.id === 'backNasalBasket') target.setAttribute('data-category', 'back');
        }

        target.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('highlight');
        });

        target.addEventListener('dragleave', function() {
            this.classList.remove('highlight');
        });

        target.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('highlight');

            const draggedId = e.dataTransfer.getData('text/plain');
            const draggedEl = document.getElementById(draggedId) || document.querySelector('.opacity-50');
            if (!draggedEl) return;

            const cardType = draggedEl.getAttribute('data-type');
            const targetCategory = this.getAttribute('data-category') || (this.id === 'frontNasalBasket' ? 'front' : (this.id === 'backNasalBasket' ? 'back' : ''));

            if (cardType && targetCategory && cardType === targetCategory) {
                this.appendChild(draggedEl);
                draggedEl.classList.add('correct');
                showFeedback(true, '分类正确！', '继续加油！');
                playSound('correct');
            } else {
                draggedEl.classList.add('incorrect');
                setTimeout(() => draggedEl.classList.remove('incorrect'), 800);
                showFeedback(false, '分类错误', '请再试一次');
                playSound('incorrect');
            }
        });
    });
    
    // 挑战游戏选项点击事件（存在性检查）
    // 移除无效ID绑定，统一使用 .optionBtn 事件

    // 兼容 index.html 中使用的 option1/option2 按钮ID
    // 选项按钮事件在下方统一绑定到 .optionBtn，避免重复
    
    // 兼容optionBtn类
    document.querySelectorAll('.optionBtn').forEach((btn, index) => {
        btn.addEventListener('click', function() {
            checkChallengeAnswer(index === 0); // 第一个按钮是前鼻音选项
        });
    });
    
    // 关闭模态窗口按钮事件
    const modalCloseButtons = document.querySelectorAll('#closeModalBtn, #closeWordListBtn');
    if (modalCloseButtons && modalCloseButtons.length > 0) {
        modalCloseButtons.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', function() {
                    const modalElement = this.closest('.modal');
                    if (modalElement) {
                        const modalId = modalElement.id;
                        const modal = document.getElementById(modalId);
                        if (modal) {
                            modal.classList.add('hidden');
                        }
                    }
                });
            }
        });
    }


// 显示指定部分
function showSection(sectionId) {
    ['homeSection','compareSection','classifySection','challengeSection'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    const active = document.getElementById(sectionId);
    if (active) active.classList.remove('hidden');
    try {
        localStorage.setItem('lastSection', sectionId);
    } catch (e) {}
    
    // 更新导航菜单激活状态
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('text-blue-600', 'border-blue-600');
        link.classList.add('text-gray-500', 'border-transparent');
        
        if (link.getAttribute('href') === '#' + sectionId) {
            link.classList.remove('text-gray-500', 'border-transparent');
            link.classList.add('text-blue-600', 'border-blue-600');
        }
    });
}

// 更新词对显示
function updateWordPair() {
    const pair = wordPairs[currentPairIndex];
    
    // 将汉字包装在span中以便点击播放
    const frontChars = pair.front.split('').map(char => {
        if (/[\u4e00-\u9fa5]/.test(char)) {
            return `<span class="chinese-char cursor-pointer hover:text-blue-500">${char}</span>`;
        }
        return char;
    }).join('');
    
    const backChars = pair.back.split('').map(char => {
        if (/[\u4e00-\u9fa5]/.test(char)) {
            return `<span class="chinese-char cursor-pointer hover:text-blue-500">${char}</span>`;
        }
        return char;
    }).join('');
    
    const frontEl = document.getElementById('frontNasalWord');
    const backEl = document.getElementById('backNasalWord');
    if (frontEl) frontEl.innerHTML = frontChars;
    if (backEl) backEl.innerHTML = backChars;
    const frontPinyinEl = document.getElementById('frontPinyin');
    const backPinyinEl = document.getElementById('backPinyin');
    if (frontPinyinEl) frontPinyinEl.textContent = pair.frontPinyin;
    if (backPinyinEl) backPinyinEl.textContent = pair.backPinyin;
    const counterEl = document.getElementById('pairCounter');
    if (counterEl) counterEl.textContent = `${currentPairIndex + 1}/${wordPairs.length}`;
    
    // 标记为已学习
    wordPairs[currentPairIndex].learned = true;
    saveProgress();
}

// 使用Web Speech API播放文本（取消未完成的朗读，避免重叠）
function speakText(text) {
    try {
        if (window.speechSynthesis) {
            if (speechSynthesis.speaking || speechSynthesis.pending) {
                speechSynthesis.cancel();
            }
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            speechSynthesis.speak(utterance);
        }
    } catch (e) {
        console.warn('speakText 调用失败:', e);
    }
}

// 显示词汇表
function showWordList() {
    const modal = document.getElementById('wordListModal');
    const frontList = document.getElementById('frontNasalList');
    const backList = document.getElementById('backNasalList');

    if (!modal || !frontList || !backList) return;

    // 清空现有内容
    frontList.innerHTML = '';
    backList.innerHTML = '';

    wordPairs.forEach(pair => {
        const frontItem = document.createElement('li');
        frontItem.textContent = `${pair.front} (${pair.frontPinyin})`;
        frontItem.className = 'px-3 py-2 bg-white rounded border';
        frontItem.addEventListener('click', function() {
            currentPairIndex = wordPairs.indexOf(pair);
            showSection('compareSection');
            updateWordPair();
            modal.classList.add('hidden');
        });
        frontList.appendChild(frontItem);

        const backItem = document.createElement('li');
        backItem.textContent = `${pair.back} (${pair.backPinyin})`;
        backItem.className = 'px-3 py-2 bg-white rounded border';
        backItem.addEventListener('click', function() {
            currentPairIndex = wordPairs.indexOf(pair);
            showSection('compareSection');
            updateWordPair();
            modal.classList.add('hidden');
        });
        backList.appendChild(backItem);
    });

    // 分类游戏：点击词卡朗读（事件委托，覆盖词池与篮子内的卡片）
    const classifySectionEl = document.getElementById('classifySection');
    if (classifySectionEl) {
        classifySectionEl.addEventListener('click', function(e) {
            const card = e.target.closest('[id^="card-"],[data-type]');
            if (!card) return;
            // 避免拖拽中的点击导致误触发
            if (card.classList.contains('opacity-50')) return;
            // 取词文本（优先取加粗文本块）
            const mainTextEl = card.querySelector('.text-xl');
            const text = (mainTextEl ? mainTextEl.textContent : card.textContent || '').trim();
            if (text) {
                speakText(text);
            }
        });
    }

    modal.classList.remove('hidden');
}

// 初始化分类游戏
function initClassifyGame() {
    // 随机选择8个词对进行游戏
    currentGameWords = getRandomWordPairs(8);

    // 设置篮子分类属性
    const frontBasket = document.getElementById('frontNasalBasket');
    const backBasket = document.getElementById('backNasalBasket');
    if (frontBasket) frontBasket.setAttribute('data-category', 'front');
    if (backBasket) backBasket.setAttribute('data-category', 'back');

    showSection('classifySection');
    // 生成词卡
    showNextClassifyWord();
}

// 使用错题进行分类游戏
function initClassifyGameWithMistakes() {
    // 获取错题
    const mistakePairs = wordPairs.filter(pair => pair.mistakes > 0);
    
    if (mistakePairs.length >= 5) {
        currentGameWords = mistakePairs.slice(0, 10);
    } else {
        // 如果错题不足，补充随机词对
        const additionalPairs = getRandomWordPairs(10 - mistakePairs.length, mistakePairs);
        currentGameWords = [...mistakePairs, ...additionalPairs];
    }
    
    showSection('classifySection');
    showNextClassifyWord();
}

// 显示下一个分类词
function showNextClassifyWord() {
    const pool = document.getElementById('wordPool');
    const frontBasket = document.getElementById('frontNasalBasket');
    const backBasket = document.getElementById('backNasalBasket');
    if (!pool || !frontBasket || !backBasket) return;

    // 如果没有待游戏词对，则结束
    if (!currentGameWords || currentGameWords.length === 0) {
        showFeedback(true, '恭喜你！', '分类游戏完成！');
        setTimeout(() => {
            showSection('homeSection');
        }, 3000);
        return;
    }

    // 清空篮子和词池
    frontBasket.innerHTML = '';
    backBasket.innerHTML = '';
    pool.innerHTML = '';

    // 取当前词对集合，生成前/后鼻音卡片
    const allWords = [];
    currentGameWords.slice(0, 4).forEach(pair => {
        allWords.push({ text: pair.front, pinyin: pair.frontPinyin, type: 'front' });
        allWords.push({ text: pair.back, pinyin: pair.backPinyin, type: 'back' });
    });

    // 打乱顺序
    const shuffled = allWords.sort(() => 0.5 - Math.random());

    // 创建可拖拽卡片
    shuffled.forEach((w, idx) => {
        const card = document.createElement('div');
        card.id = `card-${idx}`;
        card.innerHTML = `<div class="text-xl font-bold">${w.text}</div><div class="text-sm text-gray-600">${w.pinyin || ''}</div>`;
        card.className = 'px-4 py-3 rounded-lg bg-white border-2 border-gray-200 cursor-move text-center';
        card.setAttribute('draggable', 'true');
        card.setAttribute('data-type', w.type);

        card.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.id);
            this.classList.add('opacity-50');
        });
        card.addEventListener('dragend', function() {
            this.classList.remove('opacity-50');
        });

        // 直接绑定点击朗读（同时保留事件委托，避免丢失）
        card.addEventListener('click', function(e) {
            // 避免拖拽态触发
            if (this.classList.contains('opacity-50')) return;
            e.stopPropagation();
            const mainTextEl = this.querySelector('.text-xl');
            const text = (mainTextEl ? mainTextEl.textContent : this.textContent || '').trim();
            if (text) {
                speakText(text);
            }
        });

        pool.appendChild(card);
    });
}

// 初始化挑战游戏
function initChallengeGame() {
    // 重置分数
    score = 0;
    totalQuestions = 0;
    updateScore();
    
    // 开始游戏
    showNextChallengeWord();
}

// 使用错题进行挑战游戏
function initChallengeWithMistakes() {
    // 获取错题
    const mistakePairs = wordPairs.filter(pair => pair.mistakes > 0);
    
    if (mistakePairs.length === 0) {
        showFeedback(true, '太棒了！', '你目前没有错题需要复习！');
        return;
    }
    
    // 重置分数
    score = 0;
    totalQuestions = 0;
    updateScore();
    
    // 使用错题开始游戏
    currentGameWords = [...mistakePairs];
    showSection('challengeSection');
    showNextChallengeWord();
}

// 显示下一个挑战词
function showNextChallengeWord() {
    if (totalQuestions >= 10) {
        // 游戏结束
        const percentage = Math.round((score / totalQuestions) * 100);
        showFeedback(percentage >= 80, 
                    percentage >= 80 ? '太棒了！' : '继续加油！', 
                    `你的得分是: ${score}/${totalQuestions} (${percentage}%)`);
        setTimeout(() => {
            showSection('homeSection');
        }, 3000);
        return;
    }
    
    // 随机选择一个词对
    const pool = (Array.isArray(currentGameWords) && currentGameWords.length > 0) ? currentGameWords : wordPairs;
    const randomIndex = Math.floor(Math.random() * pool.length);
    currentChallengeWord = pool[randomIndex];
    
    // 随机决定播放前鼻音还是后鼻音
    const playFront = Math.random() > 0.5;
    currentChallengeIsFront = playFront;
    const wordToPlay = playFront ? currentChallengeWord.front : currentChallengeWord.back;
    
    // 自动播放发音
    setTimeout(() => {
        speakText(wordToPlay);
    }, 500);
    // 记录当前正确答案（使用变量，不依赖不存在的DOM）
}

// 检查挑战答案
function checkChallengeAnswer(isSelectingFront) {
    totalQuestions++;
    
    const correctAnswer = currentChallengeIsFront;
    const isCorrect = (isSelectingFront === correctAnswer);
    
    if (isCorrect) {
        score++;
        showFeedback(true, '答对了！', '继续保持！');
    } else {
        // 记录错误
        const index = wordPairs.indexOf(currentChallengeWord);
        if (index !== -1) {
            wordPairs[index].mistakes = (wordPairs[index].mistakes || 0) + 1;
            wordPairs[index].lastMistakeAt = Date.now();
            saveProgress();
        }
        
        showFeedback(false, '答错了', `正确答案是: ${correctAnswer ? '前鼻音' : '后鼻音'}`);
    }
    
    // 更新分数
    updateScore();
    
    // 延迟显示下一个词
    setTimeout(showNextChallengeWord, 2000);
}

// 更新分数显示
function updateScore() {
    const scoreEl = document.getElementById('scoreDisplay');
    if (scoreEl) scoreEl.textContent = `得分: ${score}`;

    // 更新首页进度条（存在则更新）
    const progressEl = document.querySelector('.progress-bar .progress');
    const progress = Math.min(100, totalQuestions * 10); // 10题为100%
    if (progressEl) progressEl.style.width = `${progress}%`;
    // 持久化得分与题目数
    try {
        localStorage.setItem('score', String(score));
        localStorage.setItem('totalQuestions', String(totalQuestions));
    } catch (e) {}
}

// 获取随机词对
function getRandomWordPairs(count, excludePairs = []) {
    const availablePairs = wordPairs.filter(pair => !excludePairs.includes(pair));
    const shuffled = [...availablePairs].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// 添加错题复习模块（首页与各功能页）
function addMistakeReviewModules() {
    // 首页：添加“错题复习”卡片，包含三种复习入口
    const homeGrid = document.querySelector('#homeSection .grid');
    if (homeGrid && !document.querySelector('#homeSection .review-card')) {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'card p-6 text-center bg-yellow-50 review-card';
        reviewCard.innerHTML = `
            <div class="text-4xl mb-4 text-yellow-500">
                <i class="fas fa-redo-alt"></i>
            </div>
            <div class="text-xl font-bold mb-2">错题复习</div>
            <p class="mb-4">基于错题的定向复习，巩固薄弱点</p>
            <div class="space-y-2">
                <div class="review-mistakes-btn p-3 bg-yellow-100 rounded-lg shadow cursor-pointer hover:bg-yellow-200 transition-all" data-section="compare">
                    <span class="font-medium text-yellow-800">对比听读复习</span>
                </div>
                <div class="review-mistakes-btn p-3 bg-yellow-100 rounded-lg shadow cursor-pointer hover:bg-yellow-200 transition-all" data-section="classify">
                    <span class="font-medium text-yellow-800">分类游戏复习</span>
                </div>
                <div class="review-mistakes-btn p-3 bg-yellow-100 rounded-lg shadow cursor-pointer hover:bg-yellow-200 transition-all" data-section="challenge">
                    <span class="font-medium text-yellow-800">辨音挑战复习</span>
                </div>
            </div>
        `;
        homeGrid.appendChild(reviewCard);
    }

    // 对比听读页：在“查看词汇表”按钮旁添加复习按钮
    const compareActions = document.querySelector('#compareSection .flex.justify-center.gap-4');
    if (compareActions && !compareActions.querySelector('.review-mistakes-btn')) {
        const reviewBtn = document.createElement('button');
        reviewBtn.className = 'review-mistakes-btn px-4 py-2 rounded-lg btn-secondary';
        reviewBtn.setAttribute('data-section', 'compare');
        reviewBtn.innerHTML = '<i class="fas fa-redo-alt mr-2"></i> 错题复习';
        compareActions.appendChild(reviewBtn);
    }

    // 分类游戏页：在操作按钮区添加复习按钮
    const classifyActions = document.querySelector('#classifySection .flex.justify-center.gap-4');
    if (classifyActions && !classifyActions.querySelector('.review-mistakes-btn')) {
        const reviewBtn = document.createElement('button');
        reviewBtn.className = 'review-mistakes-btn px-4 py-2 rounded-lg btn-secondary';
        reviewBtn.setAttribute('data-section', 'classify');
        reviewBtn.innerHTML = '<i class="fas fa-redo-alt mr-2"></i> 错题复习';
        classifyActions.appendChild(reviewBtn);
    }

    // 辨音挑战页：在播放按钮区域下方添加复习按钮
    const challengeTop = document.querySelector('#challengeSection .text-center.mb-8');
    if (challengeTop && !challengeTop.querySelector('.review-mistakes-btn')) {
        const reviewBtn = document.createElement('div');
        reviewBtn.className = 'review-mistakes-btn mt-4 inline-block px-4 py-2 rounded-lg btn-secondary cursor-pointer';
        reviewBtn.setAttribute('data-section', 'challenge');
        reviewBtn.innerHTML = '<i class="fas fa-redo-alt mr-2"></i> 错题复习';
        challengeTop.appendChild(reviewBtn);
    }
}

// 对比听读页：添加“标记为错题/错题本”按钮
function addCompareMistakeControls() {
    const actions = document.querySelector('#compareSection .flex.justify-center.gap-4');
    if (!actions) return;

    // 标记为错题按钮
    if (!document.getElementById('markMistakeBtn')) {
        const markBtn = document.createElement('button');
        markBtn.id = 'markMistakeBtn';
        markBtn.className = 'px-4 py-2 rounded-lg btn-secondary';
        markBtn.innerHTML = '<i class="fas fa-flag mr-2"></i> 标记为错题';
        actions.appendChild(markBtn);
    }

    // 错题本按钮
    if (!document.getElementById('mistakeBookBtn')) {
        const bookBtn = document.createElement('button');
        bookBtn.id = 'mistakeBookBtn';
        bookBtn.className = 'px-4 py-2 rounded-lg btn-primary';
        bookBtn.innerHTML = '<i class="fas fa-book mr-2"></i> 错题本';
        actions.appendChild(bookBtn);
    }
}

// 标记当前对比词组为错题
function markCurrentPairAsMistake() {
    if (!wordPairs || wordPairs.length === 0) return;
    const idx = currentPairIndex;
    if (idx < 0 || idx >= wordPairs.length) return;
    wordPairs[idx].mistakes = (wordPairs[idx].mistakes || 0) + 1;
    wordPairs[idx].lastMistakeAt = Date.now();
    saveProgress();
    showFeedback(false, '已加入错题本', '该词组已标记为错题，将在复习中出现');
    playSound('incorrect');
}

// 显示错题本（支持按时间/错误频率排序）
function showMistakeBook(sortBy = 'time') {
    const modal = document.getElementById('mistakeListModal');
    const container = document.getElementById('mistakeListContainer');
    const sortTimeBtn = document.getElementById('sortByTimeBtn');
    const sortFreqBtn = document.getElementById('sortByFrequencyBtn');
    if (!modal || !container) return;

    // 高亮当前排序
    if (sortTimeBtn && sortFreqBtn) {
        sortTimeBtn.classList.remove('btn-primary');
        sortFreqBtn.classList.remove('btn-primary');
        sortTimeBtn.classList.add('btn-secondary');
        sortFreqBtn.classList.add('btn-secondary');
        if (sortBy === 'time') {
            sortTimeBtn.classList.remove('btn-secondary');
            sortTimeBtn.classList.add('btn-primary');
        } else {
            sortFreqBtn.classList.remove('btn-secondary');
            sortFreqBtn.classList.add('btn-primary');
        }
    }

    // 构建错题列表
    const items = wordPairs
        .map((pair, index) => ({
            index,
            front: pair.front,
            frontPinyin: pair.frontPinyin,
            back: pair.back,
            backPinyin: pair.backPinyin,
            mistakes: pair.mistakes || 0,
            lastMistakeAt: pair.lastMistakeAt || 0
        }))
        .filter(it => it.mistakes > 0);

    if (items.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-600">目前没有错题，继续加油！</div>';
    } else {
        // 排序
        if (sortBy === 'freq') {
            items.sort((a, b) => b.mistakes - a.mistakes || (b.lastMistakeAt - a.lastMistakeAt));
        } else {
            items.sort((a, b) => (b.lastMistakeAt - a.lastMistakeAt) || (b.mistakes - a.mistakes));
        }
        // 渲染
        container.innerHTML = '';
        items.forEach(it => {
            const row = document.createElement('div');
            row.className = 'flex items-center justify-between p-3 bg-white rounded border mb-2';
            const timeStr = it.lastMistakeAt ? new Date(it.lastMistakeAt).toLocaleString() : '—';
            row.innerHTML = `
                <div class=\"text-left\">\n                    <div class=\"font-semibold\">${it.front} / ${it.back}</div>\n                    <div class=\"text-sm text-gray-600\">${it.frontPinyin || ''} / ${it.backPinyin || ''}</div>\n                    <div class=\"text-xs text-gray-500\">错误次数: ${it.mistakes}｜最近: ${timeStr}</div>\n                </div>\n                <div>\n                    <button class=\"remove-mistake-btn px-3 py-2 rounded-lg btn-secondary\" data-index=\"${it.index}\">\n                        <i class=\"fas fa-check mr-1\"></i> 移出错题本\n                    </button>\n                </div>\n            `;
            container.appendChild(row);
        });
    }

    modal.classList.remove('hidden');
}
// 错题复习功能
function reviewMistakes(section) {
    // 获取有错误记录的词对
    const mistakePairs = wordPairs.filter(pair => pair.mistakes > 0);
    
    if (mistakePairs.length === 0) {
        showFeedback(true, '太棒了！', '你目前没有错题需要复习！');
        return;
    }
    
    // 根据不同部分执行不同的复习方式
    switch(section) {
        case 'compare':
            // 找到第一个错题并跳转到对比听读
            const index = wordPairs.findIndex(pair => pair.mistakes > 0);
            if (index !== -1) {
                currentPairIndex = index;
                showSection('compareSection');
                updateWordPair();
            }
            break;
            
        case 'classify':
            // 使用错题进行分类游戏
            initClassifyGameWithMistakes();
            break;
            
        case 'challenge':
            // 使用错题进行挑战
            initChallengeWithMistakes();
            break;
    }
}

// 显示视觉和听觉反馈
function showFeedback(isCorrect, title, message) {
    // 创建反馈元素
    const feedback = document.createElement('div');
    feedback.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50';
    
    // 根据正确与否显示不同的图标和声音
    if (isCorrect) {
        // 星星特效（白色背景包裹）
        feedback.innerHTML = `<div class="bg-white rounded-xl p-6 shadow-2xl flex flex-col items-center">
                                <i class="fas fa-star text-6xl text-yellow-400 animate-pulse"></i>
                                <p class="mt-4 text-xl font-bold text-yellow-600">${title}</p>
                                <p class="text-lg text-yellow-700">${message}</p>
                              </div>`;
        
        // 播放鼓励声音
        playSound('correct');
    } else {
        // 流泪脸特效（白色背景包裹）
        feedback.innerHTML = `<div class="bg-white rounded-xl p-6 shadow-2xl flex flex-col items-center">
                                <i class="fas fa-sad-tear text-6xl text-blue-400 animate-pulse"></i>
                                <p class="mt-4 text-xl font-bold text-blue-600">${title}</p>
                                <p class="text-lg text-blue-700">${message}</p>
                              </div>`;
        
        // 播放伤心声音
        playSound('incorrect');
    }
    
    // 添加到页面
    document.body.appendChild(feedback);
    
    // 3秒后移除
    setTimeout(() => {
        feedback.classList.add('opacity-0');
        feedback.style.transition = 'opacity 0.5s ease';
        setTimeout(() => feedback.remove(), 500);
    }, 3000);
}

// 播放声音
function playSound(type) {
    // 使用共享的WebAudio上下文，避免频繁创建导致失败
    try {
        const ctx = ensureAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        const now = ctx.currentTime;
        const isCorrect = type === 'correct';
        osc.frequency.setValueAtTime(isCorrect ? 880 : 220, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + (isCorrect ? 0.25 : 0.4));
        osc.start(now);
        osc.stop(now + (isCorrect ? 0.27 : 0.42));
    } catch (e) {
        console.warn('WebAudio不可用，跳过提示音', e);
    }
}

// 已移除冗余的 replaceHeadingsWithEncouragement 函数（避免随机更改标题文案）

// 查找未学习的词对
function findUnlearnedPair() {
    const unlearnedIndex = wordPairs.findIndex(pair => !pair.learned);
    if (unlearnedIndex !== -1) {
        currentPairIndex = unlearnedIndex;
    }
}

// 保存学习进度
function saveProgress() {
    // 保存已学习的词对索引
    const learnedIndices = wordPairs
        .map((pair, index) => pair.learned ? index : -1)
        .filter(index => index !== -1);
    
    // 保存错题索引、错误次数与最近时间
    const wrongItems = wordPairs
        .map((pair, index) => pair.mistakes > 0 ? {index, mistakes: pair.mistakes, lastMistakeAt: pair.lastMistakeAt || null} : null)
        .filter(item => item !== null);
    
    localStorage.setItem('learnedPairs', JSON.stringify(learnedIndices));
    localStorage.setItem('wrongPairs', JSON.stringify(wrongItems));
    try {
        localStorage.setItem('currentPairIndex', String(currentPairIndex));
    } catch (e) {}
}

// 加载学习进度
function loadProgress() {
    try {
        const learnedIndices = JSON.parse(localStorage.getItem('learnedPairs')) || [];
        learnedIndices.forEach(index => {
            if (wordPairs[index]) {
                wordPairs[index].learned = true;
            }
        });
        
        const wrongItems = JSON.parse(localStorage.getItem('wrongPairs')) || [];
        wrongItems.forEach(item => {
            if (wordPairs[item.index]) {
                wordPairs[item.index].mistakes = item.mistakes;
                wordPairs[item.index].lastMistakeAt = item.lastMistakeAt || null;
            }
        });
        const savedIndex = parseInt(localStorage.getItem('currentPairIndex'), 10);
        if (!isNaN(savedIndex) && savedIndex >= 0 && savedIndex < wordPairs.length) {
            currentPairIndex = savedIndex;
        }
        const lastSection = localStorage.getItem('lastSection');
        if (lastSection) {
            showSection(lastSection);
            if (lastSection === 'compareSection') {
                updateWordPair();
            }
        }
        // 恢复得分与题目数
        const s = localStorage.getItem('score');
        const t = localStorage.getItem('totalQuestions');
        const sv = s != null ? parseInt(s, 10) : NaN;
        const tv = t != null ? parseInt(t, 10) : NaN;
        if (!isNaN(sv)) score = sv;
        if (!isNaN(tv)) totalQuestions = tv;
        updateScore();
    } catch (e) {
        console.error('加载学习进度失败', e);
    }
}

// 解析CSV数据
async function parseCSV() {
    console.log('2. 开始解析CSV数据');
    const csvPath = encodeURI('98组前后鼻音词汇表 - Sheet1.csv');
    try {
        const resp = await fetch(csvPath);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const text = await resp.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        let lastCategory = '';
        const parsedPairs = [];

        function parseLine(line) {
            const fields = [];
            let field = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (inQuotes) {
                    if (ch === '"') {
                        if (i + 1 < line.length && line[i + 1] === '"') {
                            field += '"';
                            i++;
                        } else {
                            inQuotes = false;
                        }
                    } else {
                        field += ch;
                    }
                } else {
                    if (ch === '"') {
                        inQuotes = true;
                    } else if (ch === ',') {
                        fields.push(field);
                        field = '';
                    } else {
                        field += ch;
                    }
                }
            }
            fields.push(field);
            return fields;
        }

        function parseWordField(raw) {
            if (!raw) return null;
            const s = raw.trim().replace(/^"+|"+$/g, '');
            let m = s.match(/^(.+?)\s*\(([^,]+),/);
            if (!m) m = s.match(/^(.+?)\s*\(([^\)]+)\)/);
            if (!m) return { char: s, pinyin: '' };
            return { char: m[1].trim(), pinyin: (m[2] || '').trim() };
        }

        for (const line of lines) {
            const cols = parseLine(line);
            const col0 = (cols[0] || '').trim();
            const col1 = cols[1];
            const col2 = cols[2];
            const category = col0 || lastCategory || '';
            if (!col1 || !col2) { lastCategory = category; continue; }
            const f = parseWordField(col1);
            const b = parseWordField(col2);
            if (!f || !b) { lastCategory = category; continue; }
            parsedPairs.push({
                category,
                front: f.char,
                frontPinyin: f.pinyin,
                back: b.char,
                backPinyin: b.pinyin,
                learned: false,
                mistakes: 0,
                lastMistakeAt: null
            });
            lastCategory = category;
        }

        if (parsedPairs.length > 0) {
            wordPairs = parsedPairs;
            console.log('CSV 数据加载完成，词对数量：' + wordPairs.length);
        } else {
            console.warn('CSV解析为空，使用硬编码数据');
            useHardcodedData();
        }
    } catch (err) {
        console.error('加载CSV文件失败:', err);
        useHardcodedData();
        if (wordPairs.length === 0) {
            useBackupData();
        }
    }
}

// 使用备用数据
function useBackupData() {
    console.log('使用备用数据');
    // 最基本的前后鼻音词对
    const backupData = [
        ["基础词汇", "前鼻音an", "后鼻音ang", "an[an]", "ang[aŋ]", "前鼻音发音短促，后鼻音发音延长"],
        ["基础词汇", "班", "帮", "bān", "bāng", ""],
        ["基础词汇", "餐", "仓", "cān", "cāng", ""],
        ["基础词汇", "单", "当", "dān", "dāng", ""],
        ["基础词汇", "烦", "方", "fán", "fāng", ""],
        ["基础词汇", "肝", "刚", "gān", "gāng", ""],
        ["基础词汇", "汗", "行", "hàn", "háng", ""],
        ["基础词汇", "监", "江", "jiān", "jiāng", ""],
        ["基础词汇", "兰", "狼", "lán", "láng", ""],
        ["基础词汇", "满", "忙", "mǎn", "máng", ""],
        ["基础词汇", "南", "囊", "nán", "náng", ""],
        ["基础词汇", "盘", "旁", "pán", "páng", ""]
    ];
    
    // 清空现有数据
    wordPairs = [];
    
    // 解析备用数据
    for (let i = 1; i < backupData.length; i++) {
        const row = backupData[i];
        if (row.length >= 5) {
            const pair = {
                category: row[0],
                front: row[1],
                frontPinyin: row[3],
                back: row[2],
                backPinyin: row[4],
                learned: false,
                mistakes: 0,
                lastMistakeAt: null
            };
            wordPairs.push(pair);
        }
    }
    
    console.log('备用数据加载完成，共加载词对：' + wordPairs.length);
}

// 使用硬编码的数据作为备份
function useHardcodedData() {
    console.log('3. 使用硬编码数据');
    // 嵌入完整CSV文本，保证在Chrome直接打开文件时也能加载98组
    const csvData = `
an vs ang​​,"饭 (fàn, 米饭)","放 (fàng, 放学)",,,,,,,,,,,,,,,,,
,"碗 (wǎn, 饭碗)","网 (wǎng, 上网)",,,,,,,,,,,,,,,,,
,"玩 (wán, 玩耍)","王 (wáng, 国王)",,,,,,,,,,,,,,,,,
,"蓝 (lán, 蓝天)","狼 (láng, 大灰狼)",,,,,,,,,,,,,,,,,
,"看 (kàn, 看见)","炕 (kàng, 火炕)",,,,,,,,,,,,,,,,,
,"山 (shān, 高山)","伤 (shāng, 受伤)",,,,,,,,,,,,,,,,,
,"扇 (shàn, 风扇)","上 (shàng, 上面)",,,,,,,,,,,,,,,,,
,"班 (bān, 班长)","帮 (bāng, 帮助)",,,,,,,,,,,,,,,,,
,"反 (fǎn, 正反)","房 (fáng, 房子)",,,,,,,,,,,,,,,,,
,"蛋 (dàn, 鸡蛋)","糖 (táng, 糖果)",,,,,,,,,,,,,,,,,
,"盘 (pán, 盘子)","旁 (páng, 旁边)",,,,,,,,,,,,,,,,,
,"男 (nán, 男孩)","囊 (náng, 口袋)",,,,,,,,,,,,,,,,,
,"懒 (lǎn, 偷懒)","狼 (láng, 大灰狼)",,,,,,,,,,,,,,,,,
,"干 (gān, 干净)","刚 (gāng, 刚才)",,,,,,,,,,,,,,,,,
,"看 (kàn, 看见)","康 (kāng, 健康)",,,,,,,,,,,,,,,,,
,"寒 (hán, 寒冷)","航 (háng, 航行)",,,,,,,,,,,,,,,,,
,"站 (zhàn, 车站)","张 (zhāng, 张开)",,,,,,,,,,,,,,,,,
,"产 (chǎn, 产品)","长 (cháng, 长短)",,,,,,,,,,,,,,,,,
,"山 (shān, 大山)","伤 (shāng, 受伤)",,,,,,,,,,,,,,,,,
,"然 (rán, 然后)","让 (ràng, 让开)",,,,,,,,,,,,,,,,,
,"伞 (sǎn, 雨伞)","桑 (sāng, 桑树)",,,,,,,,,,,,,,,,,
,"但 (dàn, 但是)","当 (dāng, 当时)",,,,,,,,,,,,,,,,,
,"谈 (tán, 谈话)","唐 (táng, 唐朝)",,,,,,,,,,,,,,,,,
,"南 (nán, 南方)","囊 (náng, 行囊)",,,,,,,,,,,,,,,,,
,"兰 (lán, 兰花)","狼 (láng, 灰狼)",,,,,,,,,,,,,,,,,
,"甘 (gān, 甘甜)","刚 (gāng, 刚刚)",,,,,,,,,,,,,,,,,
,"砍 (kǎn, 砍树)","康 (kāng, 健康)",,,,,,,,,,,,,,,,,
,"汉 (hàn, 汉字)","行 (háng, 行业)",,,,,,,,,,,,,,,,,
,"战 (zhàn, 战争)","丈 (zhàng, 丈夫)",,,,,,,,,,,,,,,,,
,"蝉 (chán, 蝉鸣)","常 (cháng, 经常)",,,,,,,,,,,,,,,,,
​​en vs eng​​,"门 (mén, 房门)","梦 (mèng, 做梦)",,,,,,,,,,,,,,,,,
,"分 (fēn, 分开)","风 (fēng, 大风)",,,,,,,,,,,,,,,,,
,"真 (zhēn, 真实)","争 (zhēng, 争抢)",,,,,,,,,,,,,,,,,
,"身 (shēn, 身体)","声 (shēng, 声音)",,,,,,,,,,,,,,,,,
,"本 (běn, 书本)","崩 (bēng, 崩开)",,,,,,,,,,,,,,,,,
,"针 (zhēn, 打针)","正 (zhèng, 正确)",,,,,,,,,,,,,,,,,
,"人 (rén, 大人)","仍 (réng, 仍然)",,,,,,,,,,,,,,,,,
,"跟 (gēn, 跟从)","更 (gèng, 更加)",,,,,,,,,,,,,,,,,
,"盆 (pén, 花盆)","朋 (péng, 朋友)",,,,,,,,,,,,,,,,,
,"深 (shēn, 深浅)","生 (shēng, 生日)",,,,,,,,,,,,,,,,,
,"什 (shén, 什么)","省 (shěng, 节省)",,,,,,,,,,,,,,,,,
,"怎 (zěn, 怎么)","增 (zēng, 增加)",,,,,,,,,,,,,,,,,
,"森 (sēn, 森林)","僧 (sēng, 僧人)",,,,,,,,,,,,,,,,,
,"陈 (chén, 姓陈)","成 (chéng, 成功)",,,,,,,,,,,,,,,,,
,"神 (shén, 神仙)","绳 (shéng, 绳子)",,,,,,,,,,,,,,,,,
,"跟 (gēn, 跟着)","耕 (gēng, 耕田)",,,,,,,,,,,,,,,,,
,"肯 (kěn, 肯定)","坑 (kēng, 水坑)",,,,,,,,,,,,,,,,,
,"恨 (hèn, 可恨)","横 (héng, 横线)",,,,,,,,,,,,,,,,,
,"珍 (zhēn, 珍贵)","争 (zhēng, 争吵)",,,,,,,,,,,,,,,,,
,"尘 (chén, 灰尘)","成 (chéng, 成为)",,,,,,,,,,,,,,,,,
,"身 (shēn, 身高)","生 (shēng, 生活)",,,,,,,,,,,,,,,,,
,"认 (rèn, 认识)","扔 (rēng, 扔球)",,,,,,,,,,,,,,,,,
,"根 (gēn, 树根)","更 (gēng, 更改)",,,,,,,,,,,,,,,,,
,"肯 (kěn, 肯干)","坑 (kēng, 土坑)",,,,,,,,,,,,,,,,,
,"痕 (hén, 痕迹)","横 (héng, 横竖)",,,,,,,,,,,,,,,,,
,"真 (zhēn, 真心)","蒸 (zhēng, 蒸发)",,,,,,,,,,,,,,,,,
,"晨 (chén, 早晨)","城 (chéng, 城市)",,,,,,,,,,,,,,,,,
,"深 (shēn, 深山)","声 (shēng, 声响)",,,,,,,,,,,,,,,,,
,"仁 (rén, 果仁)","仍 (réng, 仍旧)",,,,,,,,,,,,,,,,,
in vs ing​​,"心 (xīn, 心情)","星 (xīng, 星星)",,,,,,,,,,,,,,,,,
,"新 (xīn, 新旧)","行 (xíng, 行走)",,,,,,,,,,,,,,,,,
,"金 (jīn, 金色)","睛 (jīng, 眼睛)",,,,,,,,,,,,,,,,,
,"音 (yīn, 声音)","英 (yīng, 英雄)",,,,,,,,,,,,,,,,,
,"林 (lín, 树林)","零 (líng, 零钱)",,,,,,,,,,,,,,,,,
,"亲 (qīn, 亲人)","清 (qīng, 清水)",,,,,,,,,,,,,,,,,
,"进 (jìn, 前进)","静 (jìng, 安静)",,,,,,,,,,,,,,,,,
,"民 (mín, 人民)","名 (míng, 名字)",,,,,,,,,,,,,,,,,
,"您 (nín, 您好)","宁 (níng, 安宁)",,,,,,,,,,,,,,,,,
,"信 (xìn, 信件)","幸 (xìng, 幸福)",,,,,,,,,,,,,,,,,
,"今 (jīn, 今天)","京 (jīng, 北京)",,,,,,,,,,,,,,,,,
,"因 (yīn, 因为)","应 (yīng, 应该)",,,,,,,,,,,,,,,,,
,"宾 (bīn, 宾客)","冰 (bīng, 冰块)",,,,,,,,,,,,,,,,,
,"贫 (pín, 贫穷)","平 (píng, 平安)",,,,,,,,,,,,,,,,,
,"敏 (mǐn, 敏捷)","明 (míng, 明亮)",,,,,,,,,,,,,,,,,
,"今 (jīn, 今年)","经 (jīng, 经过)",,,,,,,,,,,,,,,,,
,"引 (yǐn, 引导)","影 (yǐng, 电影)",,,,,,,,,,,,,,,,,
,"拼 (pīn, 拼图)","乒 (pīng, 乒乓球)",,,,,,,,,,,,,,,,,
,"民 (mín, 农民)","名 (míng, 名气)",,,,,,,,,,,,,,,,,
,"近 (jìn, 近处)","镜 (jìng, 镜子)",,,,,,,,,,,,,,,,,
,"阴 (yīn, 阴天)","英 (yīng, 英国)",,,,,,,,,,,,,,,,,
,"彬 (bīn, 彬彬有礼)","兵 (bīng, 士兵)",,,,,,,,,,,,,,,,,
,"品 (pǐn, 用品)","平 (píng, 平地)",,,,,,,,,,,,,,,,,
,"您 (nín, 您早)","凝 (níng, 凝聚)",,,,,,,,,,,,,,,,,
,"进 (jìn, 进入)","惊 (jīng, 惊讶)",,,,,,,,,,,,,,,,,
,"印 (yìn, 印章)","硬 (yìng, 坚硬)",,,,,,,,,,,,,,,,,
,"频 (pín, 频率)","瓶 (píng, 瓶子)",,,,,,,,,,,,,,,,,
,"林 (lín, 丛林)","灵 (líng, 灵活)",,,,,,,,,,,,,,,,,
,"亲 (qīn, 亲切)","轻 (qīng, 轻重)",,,,,,,,,,,,,,,,,
ian vs iang​​,"烟 (yān, 烟雾)","羊 (yáng, 小羊)",,,,,,,,,,,,,,,,,
,"脸 (liǎn, 脸蛋)","两 (liǎng, 两个)",,,,,,,,,,,,,,,,,
,"尖 (jiān, 笔尖)","江 (jiāng, 江河)",,,,,,,,,,,,,,,,,
,"钱 (qián, 钱包)","墙 (qiáng, 墙面)",,,,,,,,,,,,,,,,,
,"先 (xiān, 先后)","香 (xiāng, 香味)",,,,,,,,,,,,,,,,,
​​uan vs uang​​,"玩 (wán, 好玩)","王 (wáng, 王子)",,,,,,,,,,,,,,,,,
,"关 (guān, 关门)","光 (guāng, 阳光)",,,,,,,,,,,,,,,,,
,"欢 (huān, 欢乐)","慌 (huāng, 慌张)",,,,,,,,,,,,,,,,,
,"船 (chuán, 小船)","床 (chuáng, 木床)",,,,,,,,,,,,,,,,,
,"环 (huán, 耳环)","黄 (huáng, 黄色)",,,,,,,,,,,,,,,,,
`;

    try {
        console.log('4. 开始解析硬编码数据');
        const lines = csvData.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
        let lastCategory = '';
        const parsedPairs = [];

        function parseLine(line) {
            const fields = [];
            let field = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (inQuotes) {
                    if (ch === '"') {
                        if (i + 1 < line.length && line[i + 1] === '"') {
                            field += '"';
                            i++;
                        } else {
                            inQuotes = false;
                        }
                    } else {
                        field += ch;
                    }
                } else {
                    if (ch === '"') {
                        inQuotes = true;
                    } else if (ch === ',') {
                        fields.push(field);
                        field = '';
                    } else {
                        field += ch;
                    }
                }
            }
            fields.push(field);
            return fields;
        }

        function parseWordField(raw) {
            if (!raw) return null;
            const s = raw.trim().replace(/^"+|"+$/g, '');
            let m = s.match(/^(.+?)\s*\(([^,]+),/);
            if (!m) m = s.match(/^(.+?)\s*\(([^\)]+)\)/);
            if (!m) return { char: s, pinyin: '' };
            return { char: m[1].trim(), pinyin: (m[2] || '').trim() };
        }

        for (const line of lines) {
            const cols = parseLine(line);
            const col0Raw = (cols[0] || '').trim();
            const col0 = col0Raw.replace(/[\u200b\u200c\u200d]/g, ''); // 去除零宽字符
            const category = col0 || lastCategory || '';
            const col1 = cols[1];
            const col2 = cols[2];
            if (!col1 || !col2) { lastCategory = category; continue; }
            const f = parseWordField(col1);
            const b = parseWordField(col2);
            if (!f || !b) { lastCategory = category; continue; }
            parsedPairs.push({
                category,
                front: f.char,
                frontPinyin: f.pinyin,
                back: b.char,
                backPinyin: b.pinyin,
                learned: false,
                mistakes: 0
            });
            lastCategory = category;
        }

        if (parsedPairs.length > 0) {
            wordPairs = parsedPairs;
            console.log('5. 解析完成，词对数量:', wordPairs.length);
            // 加载完成后初始化UI
            loadProgress();
            updateWordPair();
            // 如果有错题，添加错题复习模块
            if (wordPairs.some(pair => pair.mistakes > 0)) {
                addMistakeReviewModules();
            }
        } else {
            console.error('硬编码数据为空');
        }
    } catch (e) {
        console.error('解析硬编码数据失败', e);
    }
}