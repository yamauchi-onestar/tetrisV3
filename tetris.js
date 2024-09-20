const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
let grid = 20; // 初期値、後で調整

let score = 0;
let highScore = 0;
let pieceBag = [];
let startTime = null;
let elapsedTime = 0;
let timerInterval = null;
let isGameOver = false;
let dropInterval = 1000;
let lastTime = 0;
let dropCounter = 0;
let level = 1; // デフォルトのレベル

// ハイスコアの読み込み
if (localStorage.getItem('tetrisHighScore')) {
    highScore = parseInt(localStorage.getItem('tetrisHighScore'));
    updateHighScore();
}

// デバイス判別関数
function isMobile() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()) || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
}

// キャンバスサイズとグリッドサイズの調整
function resizeCanvas() {
    if (isMobile()) {
        const viewportWidth = window.innerWidth;

        // CSS変数から実際の高さを取得
        const vh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vh')) * 100;

        canvas.width = viewportWidth;
        canvas.height = vh;

        grid = canvas.width / 12; // 幅を12分割

        // スケーリングのリセットと再設定
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.scale(grid, grid);

        // ライン消去エフェクト用のCSS変数を更新
        document.documentElement.style.setProperty('--grid-size', grid);
    } else {
        canvas.width = 240;
        canvas.height = 400;
        grid = 20;

        // スケーリングのリセットと再設定
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.scale(grid, grid);

        // ライン消去エフェクト用のCSS変数を更新
        document.documentElement.style.setProperty('--grid-size', grid);
    }
}
resizeCanvas();

// ウィンドウリサイズ時にキャンバスを再調整
window.addEventListener('resize', () => {
    resizeCanvas();
    // ゲーム要素の再描画が必要な場合はここで対応
});

// 以下、ゲームのロジックと関数

function arenaSweep() {
    let linesCleared = 0;
    const linesToClear = [];
    outer: for (let y = arena.length -1; y >= 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        linesToClear.push(y);
    }
    if (linesToClear.length > 0) {
        linesCleared = linesToClear.length;

        // ライン消去エフェクトを表示
        linesToClear.forEach(y => {
            showLineClearEffect(y);
        });

        setTimeout(() => {
            // 実際にラインを消去
            linesToClear.forEach(y => {
                const row = arena.splice(y, 1)[0].fill(0);
                arena.unshift(row);
            });

            // スコア計算
            let points = 0;
            switch(linesCleared) {
                case 1:
                    points = 40;
                    break;
                case 2:
                    points = 100;
                    break;
                case 3:
                    points = 300;
                    break;
                case 4:
                    points = 1200;
                    break;
                default:
                    points = linesCleared * 300; // 5ライン以上の場合
            }
            score += points;
            updateScore();

            // レベル2の場合、ラインを消すごとに速度を上げる
            if (level === 2) {
                dropInterval *= 0.9; // 落下速度を速くする
            }
        }, 200); // エフェクト表示のために遅延
    }
}

function showLineClearEffect(row) {
    const effect = document.createElement('div');
    effect.classList.add('line-clear');
    const canvasRect = canvas.getBoundingClientRect();
    effect.style.top = (canvasRect.top + row * (canvasRect.height / arenaHeight)) + 'px';
    effect.style.left = canvasRect.left + 'px';
    effect.style.width = canvasRect.width + 'px';
    effect.style.height = (canvasRect.height / arenaHeight) + 'px';
    document.body.appendChild(effect);
    setTimeout(() => {
        document.body.removeChild(effect);
    }, 200);
}

function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (
                m[y][x] !== 0 &&
                (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0
            ) {
                return true;
            }
        }
    }
    return false;
}

function createMatrix(width, height) {
    const matrix = [];
    while (height--) {
        matrix.push(new Array(width).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    switch (type) {
        case 'T':
            return [
                [0, 0, 0],
                [1, 1, 1],
                [0, 1, 0],
            ];
        case 'O':
            return [
                [2, 2],
                [2, 2],
            ];
        case 'L':
            return [
                [0, 3, 0],
                [0, 3, 0],
                [0, 3, 3],
            ];
        case 'J':
            return [
                [0, 4, 0],
                [0, 4, 0],
                [4, 4, 0],
            ];
        case 'I':
            return [
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0],
            ];
        case 'S':
            return [
                [0, 6, 6],
                [6, 6, 0],
                [0, 0, 0],
            ];
        case 'Z':
            return [
                [7, 7, 0],
                [0, 7, 7],
                [0, 0, 0],
            ];
    }
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width / grid, canvas.height / grid);

    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);
}

function drawMatrix(matrix, offset) {
    const colors = [
        null,
        'red',
        'yellow',
        'orange',
        'blue',
        'cyan',
        'green',
        'purple',
    ];
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(
                    x + offset.x,
                    y + offset.y,
                    1,
                    1
                );
            }
        });
    });
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [ matrix[x][y], matrix[y][x] ] = [ matrix[y][x], matrix[x][y] ];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
    }
    dropCounter = 0;
}

function playerHardDrop() {
    while (!collide(arena, player)) {
        player.pos.y++;
    }
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function playerReset() {
    if (pieceBag.length === 0) {
        pieceBag = shuffle('ILJOTSZ'.split(''));
    }
    const pieceType = pieceBag.pop();
    player.matrix = createPiece(pieceType);
    player.pos.y = 0;
    player.pos.x =
        ((arena[0].length / 2) | 0) -
        ((player.matrix[0].length / 2) | 0);

    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        // ハイスコアの更新
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('tetrisHighScore', highScore);
            updateHighScore();
        }
        score = 0;
        updateScore();
        isGameOver = true;
        clearInterval(timerInterval);
        alert('ゲームオーバー');
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function updateScore() {
    const scoreElement = document.getElementById('score');
    scoreElement.innerText = 'スコア: ' + score;
    // スコア強調表示
    scoreElement.classList.add('flash');
    setTimeout(() => {
        scoreElement.classList.remove('flash');
    }, 500);
}

function updateHighScore() {
    const highScoreElement = document.getElementById('highScore');
    highScoreElement.innerText = 'ハイスコア: ' + highScore;
}

function updateTimer() {
    if (isGameOver) return;
    elapsedTime = (performance.now() - startTime) / 1000;
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = Math.floor(elapsedTime % 60);
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');
    document.getElementById('timer').innerText = 'タイマー: ' + formattedMinutes + '分' + formattedSeconds + '秒';
}

function update(time = 0) {
    if (isGameOver) return;
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

const arenaWidth = 12;
const arenaHeight = 20;
const arena = createMatrix(arenaWidth, arenaHeight);

const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
};

// 操作方法の設定
if (isMobile()) {
    // モバイルデバイス向けのタッチ操作を設定
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    // 操作方法の説明を更新
    document.getElementById('controlsList').innerHTML = `
        <li>タップ：回転</li>
        <li>二本指タップ：急降下</li>
        <li>左スワイプ：左に移動</li>
        <li>右スワイプ：右に移動</li>
        <li>下スワイプ：素早く落下</li>
    `;
} else {
    // PC 向けのキーボード操作を設定
    document.addEventListener('keydown', handleKeyDown);

    // 操作方法の説明を更新
    document.getElementById('controlsList').innerHTML = `
        <li>左矢印キー：左に移動</li>
        <li>右矢印キー：右に移動</li>
        <li>下矢印キー：素早く落下</li>
        <li>スペースキー：急降下</li>
        <li>Qキー：左回転</li>
        <li>Wキー：右回転</li>
    `;
}

// キーボード操作の関数
function handleKeyDown(event) {
    if (isGameOver) return;
    const key = event.key;
    if (key === 'ArrowLeft') {
        playerMove(-1);
    } else if (key === 'ArrowRight') {
        playerMove(1);
    } else if (key === 'ArrowDown') {
        playerDrop();
    } else if (key === ' ') {
        playerHardDrop();
    } else if (key.toLowerCase() === 'q') {
        playerRotate(-1);
    } else if (key.toLowerCase() === 'w') {
        playerRotate(1);
    }
}

// タッチ操作の関数
let touchStartX = null;
let touchStartY = null;
let touchStartTime = null;
let touchCount = 0;

function handleTouchStart(e) {
    if (isGameOver) return;
    touchCount = e.touches.length;
    touchStartTime = e.timeStamp;
    if (touchCount === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }
    e.preventDefault();
}

function handleTouchEnd(e) {
    if (isGameOver) return;
    const touchDuration = e.timeStamp - touchStartTime;
    if (touchCount === 1 && touchDuration < 300) {
        // シングルタップで回転
        playerRotate(1);
    } else if (touchCount === 2) {
        // 二本指タップで急降下
        playerHardDrop();
    }
    touchCount = 0;
    e.preventDefault();
}

function handleTouchMove(e) {
    if (isGameOver) return;
    if (touchCount === 1) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // 左右のスワイプ
            if (deltaX > 30) {
                playerMove(1);
                touchStartX = touch.clientX;
            } else if (deltaX < -30) {
                playerMove(-1);
                touchStartX = touch.clientX;
            }
        } else {
            // 下方向のスワイプ
            if (deltaY > 30) {
                playerDrop();
                touchStartY = touch.clientY;
            }
        }
    }
    e.preventDefault();
}

document.getElementById('startButton').addEventListener('click', () => {
    // 選択された難易度を取得
    const levelRadios = document.getElementsByName('level');
    for (const radio of levelRadios) {
        if (radio.checked) {
            level = parseInt(radio.value);
            break;
        }
    }
    // 難易度に応じて落下速度を設定
    if (level === 1) {
        dropInterval = 1000; // レベル1：ゆっくり
    } else if (level === 2) {
        dropInterval = 1000; // レベル2：ゆっくりから始まり、徐々に速くなる
    } else if (level === 3) {
        dropInterval = 200; // レベル鬼：最初から速い
    }
    // 難易度選択画面を非表示にし、ゲームを表示
    document.getElementById('difficulty').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    document.getElementById('infoContainer').style.display = 'block';
    startGame();
});

function startGame() {
    isGameOver = false;
    startTime = performance.now();
    timerInterval = setInterval(updateTimer, 1000);
    playerReset();
    updateScore();
    updateHighScore();
    updateTimer();
    update();
}
