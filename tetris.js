<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>テトリス</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
        #difficulty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            box-sizing: border-box;
            padding-bottom: 100px; /* 操作説明分の余白 */
        }
        #gameContainer {
            display: none;
            position: relative;
            width: 100%;
            height: calc(var(--vh, 1vh) * 100);
        }
        canvas {
            background-color: #fff;
            display: block;
            touch-action: manipulation;
            width: 100%; /* 親要素にフィット */
            height: 100%; /* 親要素にフィット */
        }
        #score, #highScore, #timer {
            font-size: 20px;
            text-align: center;
            position: absolute;
            bottom: 10px;
            left: 0;
            right: 0;
            margin: 0 auto;
        }
        #score {
            bottom: 60px; /* タイマーとの間隔を調整 */
        }
        #highScore {
            bottom: 110px; /* スコアとの間隔を調整 */
        }
        /* スコア強調表示のためのアニメーション */
        @keyframes scoreFlash {
            0% {
                color: #fff700;
                transform: scale(1);
            }
            50% {
                color: #ff0000;
                transform: scale(1.5);
            }
            100% {
                color: #fff700;
                transform: scale(1);
            }
        }
        .flash {
            animation: scoreFlash 0.5s ease;
        }
        /* ライン消去エフェクト用のスタイル */
        .line-clear {
            position: absolute;
            width: 100%;
            height: calc(var(--grid-size) * 1px);
            background-color: rgba(255, 255, 255, 0.5);
            left: 0;
        }
    </style>
</head>
<body>
    <div id="difficulty">
        <p><strong>難易度を選択してください:</strong></p>
        <ul>
            <li><input type="radio" name="level" value="1" id="level1" checked> <label for="level1">レベル1（ゆっくり）</label></li>
            <li><input type="radio" name="level" value="2" id="level2"> <label for="level2">レベル2（徐々に速く）</label></li>
            <li><input type="radio" name="level" value="3" id="level3"> <label for="level3">レベル鬼（最初から速い）</label></li>
        </ul>
        <div id="controls">
            <p><strong>操作方法:</strong></p>
            <ul id="controlsList">
                <!-- 操作方法は後で動的に設定 -->
            </ul>
        </div>
        <button id="startButton">ゲーム開始</button>
    </div>
    <div id="gameContainer">
        <canvas id="tetris"></canvas>
        <div id="score">スコア: 0</div>
        <div id="highScore">ハイスコア: 0</div>
        <div id="timer">タイマー: 00分00秒</div>
    </div>
    <script src="tetris.js"></script>
    <script>
        // 実際のビューポートの高さを取得し、CSS変数に設定
        function setViewportHeight() {
            let vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }
        window.addEventListener('resize', setViewportHeight);
        setViewportHeight();
    </script>
</body>
</html>
