// ゲームの状態管理
class Game {
    constructor() {
        this.board = Array(8).fill(null).map(() => Array(8).fill(0));
        this.score = 0;
        this.highScore = localStorage.getItem('highScore') || 0;
        this.combo = 0;
        this.availablePieces = [];
        this.particleSystem = null;
        this.isDragging = false;
        this.draggedPiece = null;
        this.history = []; // 状態履歴（最大1回分）
        this.maxHistorySize = 1;
        
        this.init();
    }

    init() {
        this.setupBoard();
        this.setupParticles();
        this.generateNewPieces();
        this.updateScore();
        this.updateHighScore();
        this.updateUndoButton(); // アンドゥボタンを初期化
        this.setupEventListeners();
    }

    setupBoard() {
        const boardElement = document.getElementById('game-board');
        boardElement.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                boardElement.appendChild(cell);
            }
        }
    }

    setupParticles() {
        const canvas = document.getElementById('particles');
        const container = canvas.parentElement;
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        this.particleSystem = new ParticleSystem(canvas);
    }

    setupEventListeners() {
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('help-btn').addEventListener('click', () => this.showHelp());
        document.getElementById('close-help-btn').addEventListener('click', () => this.closeHelp());
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        
        // モーダルの外側をクリックで閉じる
        document.getElementById('game-over-modal').addEventListener('click', (e) => {
            if (e.target.id === 'game-over-modal') {
                this.closeGameOver();
            }
        });
        
        document.getElementById('help-modal').addEventListener('click', (e) => {
            if (e.target.id === 'help-modal') {
                this.closeHelp();
            }
        });
    }

    generateNewPieces() {
        const piecesContainer = document.getElementById('pieces-container');
        
        // すべてのピースが使用済みの場合のみ新しいピースを生成
        if (this.availablePieces.length === 0) {
            piecesContainer.innerHTML = '';
            this.availablePieces = [
                new Piece(this.getRandomShape()),
                new Piece(this.getRandomShape()),
                new Piece(this.getRandomShape())
            ];
            
            this.availablePieces.forEach((piece, index) => {
                const pieceElement = piece.createElement(index);
                piecesContainer.appendChild(pieceElement);
                this.setupPieceDrag(pieceElement, piece);
            });
        }
    }

    getRandomShape() {
        const shapes = [
            // 1x1
            [[1]],
            // 2x2
            [[1, 1], [1, 1]],
            // 1x2
            [[1, 1]],
            // 2x1
            [[1], [1]],
            // 1x3
            [[1, 1, 1]],
            // 3x1
            [[1], [1], [1]],
            // L字型
            [[1, 0], [1, 0], [1, 1]],
            [[1, 1, 1], [1, 0, 0]],
            [[1, 1], [0, 1], [0, 1]],
            [[0, 0, 1], [1, 1, 1]],
            // T字型
            [[1, 1, 1], [0, 1, 0]],
            [[0, 1], [1, 1], [0, 1]],
            // Z字型
            [[1, 1, 0], [0, 1, 1]],
            [[0, 1], [1, 1], [1, 0]],
            // 3x3
            [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
            // 1x4
            [[1, 1, 1, 1]],
            // 4x1
            [[1], [1], [1], [1]],
            // 1x5
            [[1, 1, 1, 1, 1]],
            // 5x1
            [[1], [1], [1], [1], [1]],
        ];
        
        return shapes[Math.floor(Math.random() * shapes.length)];
    }

    setupPieceDrag(pieceElement, piece) {
        let offsetX, offsetY;
        let isThisPieceDragging = false;
        let moveHandler, endHandler, touchMoveHandler, touchEndHandler;
        let lastHighlightTime = 0;
        const highlightThrottle = 50; // ミリ秒

        const startDrag = (e) => {
            if (piece.used || this.isDragging) return;
            
            e.preventDefault();
            isThisPieceDragging = true;
            this.isDragging = true;
            this.draggedPiece = piece;
            
            pieceElement.classList.add('dragging');
            
            const rect = pieceElement.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            offsetX = clientX - rect.left;
            offsetY = clientY - rect.top;
            
            pieceElement.style.position = 'fixed';
            pieceElement.style.left = '0';
            pieceElement.style.top = '0';
            pieceElement.style.zIndex = '1000';
            pieceElement.style.pointerEvents = 'none';
            pieceElement.style.transition = 'none'; // ドラッグ中は transition を無効化
            
            // 即座に正しい位置に transform を適用してちらつきを防ぐ
            pieceElement.style.transform = `translate(${clientX - offsetX}px, ${clientY - offsetY}px)`;
            
            // イベントリスナーを動的に追加
            if (e.type === 'mousedown') {
                moveHandler = moveDrag;
                endHandler = endDrag;
                document.addEventListener('mousemove', moveHandler);
                document.addEventListener('mouseup', endHandler);
            } else {
                touchMoveHandler = moveDrag;
                touchEndHandler = endDrag;
                document.addEventListener('touchmove', touchMoveHandler, { passive: false });
                document.addEventListener('touchend', touchEndHandler);
            }
        };

        const moveDrag = (e) => {
            if (!isThisPieceDragging || piece.used) return;
            
            e.preventDefault();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            // transform を使用してパフォーマンス向上
            pieceElement.style.transform = `translate(${clientX - offsetX}px, ${clientY - offsetY}px)`;
            
            // ハイライトをスロットル
            const now = Date.now();
            if (now - lastHighlightTime > highlightThrottle) {
                // ブロックの実際の中心位置を計算
                const pieceRect = pieceElement.getBoundingClientRect();
                const pieceCenterX = pieceRect.left + pieceRect.width / 2;
                const pieceCenterY = pieceRect.top + pieceRect.height / 2;
                this.highlightValidPlacement(pieceCenterX, pieceCenterY, piece, pieceElement);
                lastHighlightTime = now;
            }
        };

        const endDrag = (e) => {
            if (!isThisPieceDragging) return;
            
            e.preventDefault();
            isThisPieceDragging = false;
            this.isDragging = false;
            this.draggedPiece = null;
            
            const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
            const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
            
            pieceElement.classList.remove('dragging');
            this.clearHighlights();
            
            // イベントリスナーを削除
            if (moveHandler) {
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', endHandler);
                moveHandler = null;
                endHandler = null;
            }
            if (touchMoveHandler) {
                document.removeEventListener('touchmove', touchMoveHandler);
                document.removeEventListener('touchend', touchEndHandler);
                touchMoveHandler = null;
                touchEndHandler = null;
            }
            
            // ドロップ位置を確認（ブロックの中心位置を使用）
            const pieceRect = pieceElement.getBoundingClientRect();
            const pieceCenterX = pieceRect.left + pieceRect.width / 2;
            const pieceCenterY = pieceRect.top + pieceRect.height / 2;
            
            const dropCell = this.getCellAtPosition(pieceCenterX, pieceCenterY, pieceElement);
            
            if (dropCell) {
                const mouseRow = parseInt(dropCell.dataset.row);
                const mouseCol = parseInt(dropCell.dataset.col);
                
                // ピースの中心オフセットを計算
                const centerOffset = this.getPieceCenterOffset(piece);
                const row = mouseRow - centerOffset.row;
                const col = mouseCol - centerOffset.col;
                
                if (this.canPlacePiece(piece, row, col)) {
                    // 状態を保存（アンドゥ用）
                    this.saveState(piece);
                    
                    this.placePiece(piece, row, col);
                    piece.used = true;
                    pieceElement.classList.add('used');
                    
                    // エフェクト再生
                    this.particleSystem.createExplosion(pieceCenterX, pieceCenterY, '#f093fb', 10);
                    
                    setTimeout(() => {
                        this.availablePieces = this.availablePieces.filter(p => !p.used);
                        this.generateNewPieces();
                        this.checkGameOver();
                    }, 250);
                }
            }
            
            // 必ずスタイルをリセット
            pieceElement.style.position = '';
            pieceElement.style.left = '';
            pieceElement.style.top = '';
            pieceElement.style.transform = '';
            pieceElement.style.zIndex = '';
            pieceElement.style.pointerEvents = '';
            pieceElement.style.transition = '';
        };

        // マウスイベント
        pieceElement.addEventListener('mousedown', startDrag);
        
        // タッチイベント
        pieceElement.addEventListener('touchstart', startDrag, { passive: false });
    }

    getCellAtPosition(x, y, excludeElement = null) {
        // 除外要素がある場合は一時的に非表示
        let originalDisplay = null;
        if (excludeElement) {
            originalDisplay = excludeElement.style.display;
            excludeElement.style.display = 'none';
        }
        
        const element = document.elementFromPoint(x, y);
        
        // 元に戻す
        if (excludeElement) {
            excludeElement.style.display = originalDisplay;
        }
        
        if (element && element.classList.contains('cell')) {
            return element;
        }
        return null;
    }

    highlightValidPlacement(x, y, piece, excludeElement = null) {
        this.clearHighlights();
        
        const cell = this.getCellAtPosition(x, y, excludeElement);
        if (!cell) return;
        
        const mouseRow = parseInt(cell.dataset.row);
        const mouseCol = parseInt(cell.dataset.col);
        
        // ピースの中心オフセットを計算
        const centerOffset = this.getPieceCenterOffset(piece);
        const row = mouseRow - centerOffset.row;
        const col = mouseCol - centerOffset.col;
        
        if (this.canPlacePiece(piece, row, col)) {
            for (let r = 0; r < piece.shape.length; r++) {
                for (let c = 0; c < piece.shape[r].length; c++) {
                    if (piece.shape[r][c] === 1) {
                        const targetCell = this.getCellElement(row + r, col + c);
                        if (targetCell) {
                            targetCell.classList.add('highlight');
                        }
                    }
                }
            }
        }
    }

    getPieceCenterOffset(piece) {
        // ピースの実際の幅と高さを計算（空のセルを除外）
        let minRow = piece.shape.length;
        let maxRow = -1;
        let minCol = piece.shape[0].length;
        let maxCol = -1;
        
        for (let r = 0; r < piece.shape.length; r++) {
            for (let c = 0; c < piece.shape[r].length; c++) {
                if (piece.shape[r][c] === 1) {
                    minRow = Math.min(minRow, r);
                    maxRow = Math.max(maxRow, r);
                    minCol = Math.min(minCol, c);
                    maxCol = Math.max(maxCol, c);
                }
            }
        }
        
        // 中心位置を計算（整数で丸める）
        const centerRow = Math.floor((minRow + maxRow) / 2);
        const centerCol = Math.floor((minCol + maxCol) / 2);
        
        return { row: centerRow, col: centerCol };
    }

    clearHighlights() {
        document.querySelectorAll('.cell.highlight').forEach(cell => {
            cell.classList.remove('highlight');
        });
    }

    canPlacePiece(piece, row, col) {
        for (let r = 0; r < piece.shape.length; r++) {
            for (let c = 0; c < piece.shape[r].length; c++) {
                if (piece.shape[r][c] === 1) {
                    const targetRow = row + r;
                    const targetCol = col + c;
                    
                    if (targetRow >= 8 || targetCol >= 8 || 
                        targetRow < 0 || targetCol < 0 || 
                        this.board[targetRow][targetCol] === 1) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    placePiece(piece, row, col) {
        // ピースを配置
        for (let r = 0; r < piece.shape.length; r++) {
            for (let c = 0; c < piece.shape[r].length; c++) {
                if (piece.shape[r][c] === 1) {
                    this.board[row + r][col + c] = 1;
                    const cell = this.getCellElement(row + r, col + c);
                    cell.classList.add('filled');
                }
            }
        }
        
        // ライン消去をチェック
        setTimeout(() => {
            this.checkAndClearLines();
        }, 150);
    }

    checkAndClearLines() {
        const linesToClear = [];
        
        // 横のラインをチェック
        for (let row = 0; row < 8; row++) {
            if (this.board[row].every(cell => cell === 1)) {
                linesToClear.push({ type: 'row', index: row });
            }
        }
        
        // 縦のラインをチェック
        for (let col = 0; col < 8; col++) {
            if (this.board.every(row => row[col] === 1)) {
                linesToClear.push({ type: 'col', index: col });
            }
        }
        
        if (linesToClear.length > 0) {
            this.clearLines(linesToClear);
        } else {
            this.combo = 0;
            this.updateCombo();
        }
    }

    clearLines(lines) {
        const cellsToClear = new Set();
        
        // 消すセルを収集
        lines.forEach(line => {
            if (line.type === 'row') {
                for (let col = 0; col < 8; col++) {
                    cellsToClear.add(`${line.index}-${col}`);
                }
            } else {
                for (let row = 0; row < 8; row++) {
                    cellsToClear.add(`${row}-${line.index}`);
                }
            }
        });
        
        // コンボを増やす
        this.combo++;
        this.updateCombo();
        
        // スコアを計算（消したセル数 × 10 × コンボ）
        const baseScore = cellsToClear.size * 10;
        const comboBonus = this.combo > 1 ? baseScore * (this.combo - 1) : 0;
        const totalScore = baseScore + comboBonus;
        
        // スコアポップアップを表示
        this.showScorePopup(totalScore);
        
        // アニメーション付きで消去
        cellsToClear.forEach(key => {
            const [row, col] = key.split('-').map(Number);
            const cell = this.getCellElement(row, col);
            
            // パーティクルエフェクト
            const rect = cell.getBoundingClientRect();
            this.particleSystem.createExplosion(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
                '#4ade80',
                8
            );
            
            cell.classList.add('clearing');
            
            setTimeout(() => {
                this.board[row][col] = 0;
                cell.classList.remove('filled', 'clearing');
            }, 300);
        });
        
        // スコアを更新
        this.score += totalScore;
        this.updateScore();
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.updateHighScore();
            localStorage.setItem('highScore', this.highScore);
        }
        
        // 次のライン消去をチェック
        setTimeout(() => {
            this.checkAndClearLines();
        }, 350);
    }

    showScorePopup(score) {
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = `+${score}`;
        
        if (this.combo > 1) {
            popup.textContent += ` x${this.combo} COMBO!`;
        }
        
        const board = document.querySelector('.game-board-container');
        const rect = board.getBoundingClientRect();
        popup.style.left = rect.left + rect.width / 2 + 'px';
        popup.style.top = rect.top + rect.height / 2 + 'px';
        
        document.body.appendChild(popup);
        
        setTimeout(() => {
            popup.remove();
        }, 600);
    }

    getCellElement(row, col) {
        return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
    }

    updateHighScore() {
        document.getElementById('high-score').textContent = this.highScore;
    }

    updateCombo() {
        const comboDisplay = document.getElementById('combo-display');
        const comboValue = document.getElementById('combo');
        
        if (this.combo > 1) {
            comboDisplay.classList.add('active');
            comboValue.textContent = `${this.combo}x`;
        } else {
            comboDisplay.classList.remove('active');
        }
    }

    checkGameOver() {
        // すべての利用可能なピースが配置できるかチェック
        const canPlaceAny = this.availablePieces.some(piece => {
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    if (this.canPlacePiece(piece, row, col)) {
                        return true;
                    }
                }
            }
            return false;
        });
        
        if (!canPlaceAny) {
            setTimeout(() => {
                this.gameOver();
            }, 500);
        }
    }

    gameOver() {
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over-modal').classList.add('show');
        
        // 大きなエフェクト
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                this.particleSystem.createExplosion(
                    Math.random() * window.innerWidth,
                    Math.random() * window.innerHeight,
                    ['#667eea', '#764ba2', '#f093fb', '#f5576c'][Math.floor(Math.random() * 4)],
                    5
                );
            }, i * 30);
        }
    }

    newGame() {
        this.board = Array(8).fill(null).map(() => Array(8).fill(0));
        this.score = 0;
        this.combo = 0;
        this.availablePieces = [];
        this.history = []; // 履歴をクリア
        
        // ボードをリセット
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('filled', 'clearing', 'highlight');
        });
        
        // ピースをクリア
        document.getElementById('pieces-container').innerHTML = '';
        
        this.generateNewPieces();
        this.updateScore();
        this.updateCombo();
        this.updateUndoButton(); // アンドゥボタンを更新
    }

    restartGame() {
        this.closeGameOver();
        this.newGame();
    }

    closeGameOver() {
        document.getElementById('game-over-modal').classList.remove('show');
    }

    showHelp() {
        document.getElementById('help-modal').classList.add('show');
        this.displayBlockTypes();
    }

    displayBlockTypes() {
        const container = document.getElementById('block-types-grid');
        
        // 既に表示されている場合はスキップ
        if (container.children.length > 0) return;
        
        const allShapes = [
            // 1x1
            [[1]],
            // 2x2
            [[1, 1], [1, 1]],
            // 1x2
            [[1, 1]],
            // 2x1
            [[1], [1]],
            // 1x3
            [[1, 1, 1]],
            // 3x1
            [[1], [1], [1]],
            // L字型
            [[1, 0], [1, 0], [1, 1]],
            [[1, 1, 1], [1, 0, 0]],
            [[1, 1], [0, 1], [0, 1]],
            [[0, 0, 1], [1, 1, 1]],
            // T字型
            [[1, 1, 1], [0, 1, 0]],
            [[0, 1], [1, 1], [0, 1]],
            // Z字型
            [[1, 1, 0], [0, 1, 1]],
            [[0, 1], [1, 1], [1, 0]],
            // 3x3
            [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
            // 1x4
            [[1, 1, 1, 1]],
            // 4x1
            [[1], [1], [1], [1]],
            // 1x5
            [[1, 1, 1, 1, 1]],
            // 5x1
            [[1], [1], [1], [1], [1]],
        ];
        
        allShapes.forEach(shape => {
            const item = document.createElement('div');
            item.className = 'block-type-item';
            
            const display = document.createElement('div');
            display.className = 'block-type-display';
            display.style.gridTemplateColumns = `repeat(${shape[0].length}, 1fr)`;
            display.style.gridTemplateRows = `repeat(${shape.length}, 1fr)`;
            
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    const cell = document.createElement('div');
                    cell.className = 'block-type-cell';
                    if (shape[row][col] === 1) {
                        cell.classList.add('filled');
                    }
                    display.appendChild(cell);
                }
            }
            
            item.appendChild(display);
            container.appendChild(item);
        });
    }

    closeHelp() {
        document.getElementById('help-modal').classList.remove('show');
    }

    saveState(placedPiece) {
        // 現在の状態をディープコピーして保存
        const state = {
            board: this.board.map(row => [...row]),
            score: this.score,
            combo: this.combo,
            availablePieces: this.availablePieces.map(p => ({
                shape: p.shape.map(row => [...row]),
                used: p.used
            })),
            placedPiece: {
                shape: placedPiece.shape.map(row => [...row])
            }
        };
        
        this.history.push(state);
        
        // 履歴が上限を超えたら古いものを削除
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
        
        this.updateUndoButton();
    }

    undo() {
        if (this.history.length === 0) return;
        
        // 最後の状態を取得
        const state = this.history.pop();
        
        // ボードを復元
        this.board = state.board.map(row => [...row]);
        this.score = state.score;
        this.combo = state.combo;
        
        // ボードのビジュアルを更新
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = this.getCellElement(row, col);
                if (this.board[row][col] === 1) {
                    cell.classList.add('filled');
                } else {
                    cell.classList.remove('filled', 'clearing');
                }
            }
        }
        
        // ピースを復元
        const piecesContainer = document.getElementById('pieces-container');
        piecesContainer.innerHTML = '';
        
        this.availablePieces = state.availablePieces.map(p => {
            const piece = new Piece(p.shape);
            piece.used = p.used;
            return piece;
        });
        
        this.availablePieces.forEach((piece, index) => {
            const pieceElement = piece.createElement(index);
            piecesContainer.appendChild(pieceElement);
            this.setupPieceDrag(pieceElement, piece);
        });
        
        // スコアとコンボを更新
        this.updateScore();
        this.updateCombo();
        this.updateUndoButton();
        
        // エフェクト
        this.particleSystem.createExplosion(
            window.innerWidth / 2,
            window.innerHeight / 2,
            '#fbbf24',
            15
        );
    }

    updateUndoButton() {
        const undoBtn = document.getElementById('undo-btn');
        const undoCount = document.getElementById('undo-count');
        
        undoCount.textContent = `(${this.history.length})`;
        
        if (this.history.length > 0) {
            undoBtn.disabled = false;
        } else {
            undoBtn.disabled = true;
        }
    }
}

// ピースクラス
class Piece {
    constructor(shape) {
        this.shape = shape;
        this.used = false;
    }

    createElement(index) {
        const pieceDiv = document.createElement('div');
        pieceDiv.className = 'piece';
        pieceDiv.dataset.pieceIndex = index;
        
        const grid = document.createElement('div');
        grid.className = 'piece-grid';
        grid.style.gridTemplateColumns = `repeat(${this.shape[0].length}, 1fr)`;
        grid.style.gridTemplateRows = `repeat(${this.shape.length}, 1fr)`;
        
        for (let row = 0; row < this.shape.length; row++) {
            for (let col = 0; col < this.shape[row].length; col++) {
                const cell = document.createElement('div');
                cell.className = 'piece-cell';
                if (this.shape[row][col] === 1) {
                    cell.classList.add('filled');
                }
                grid.appendChild(cell);
            }
        }
        
        pieceDiv.appendChild(grid);
        return pieceDiv;
    }
}

// パーティクルシステム
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.animate();
    }

    createExplosion(x, y, color, count) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = x - rect.left;
        const canvasY = y - rect.top;
        
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(canvasX, canvasY, color));
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update();
            particle.draw(this.ctx);
            
            if (particle.isDead()) {
                this.particles.splice(i, 1);
            }
        }
        
        requestAnimationFrame(() => this.animate());
    }
}

// パーティクルクラス
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 6 + 3;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8;
        this.life = 1;
        this.decay = Math.random() * 0.03 + 0.02;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += 0.2; // 重力
        this.life -= this.decay;
        this.size *= 0.96;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

// ゲーム開始
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});

// ウィンドウリサイズ時にキャンバスをリサイズ
window.addEventListener('resize', () => {
    if (game && game.particleSystem) {
        const canvas = document.getElementById('particles');
        const container = canvas.parentElement;
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
    }
});

