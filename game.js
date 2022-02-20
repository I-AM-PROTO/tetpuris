// IDEA: Tree generator based on your performance
// we can add weather - blizzard, thunderstorm (high gravity, minos moving)
// IDEA: Grid color(gradient) changes as the game progresses

// TODO: requestAnimationFrame
// TODO: Start game after image loading
// TODO: line clear indicators(including t spin)
// TODO: score
// TODO: pause
// TODO: binding
// TODO: sound effects
// TODO: BGM

const GHOST_HEIGHT = 3;
const FALL_INTERVAL = 200;
const INITIAL_DAS = 50;
const RECURRING_DAS = 10;
const DROP_DAS = 5;
const BLOCK_SEQ = "IJLOSTZ";
const BLOCK_COLOR = {
                'L':'#f69552',
                'J':'#799fcb', // #95b4cc
                'O':'#fcdc64',
                'T':'#74648c',
                'I':'#0d88a8',
                'S':'#a7e99c',
                'Z':'#ff9994', // ffb2ae
                'G':'#cececd', // BFBFBF
                'E':'#ffffff00'
                };
const MINO_OFFSET = {
                "I0" : [-2,1,-1,1,0,1,1,1],
                "I1" : [0,2,0,1,0,0,0,-1],
                "I2" : [-2,0,-1,0,0,0,1,0],
                "I3" : [-1,2,-1,1,-1,0,-1,-1],
                "J0" : [-2,2,-2,1,-1,1,0,1],
                "J1" : [-1,0,-1,1,-1,2,0,2],
                "J2" : [-2,1,-1,1,0,1,0,0],
                "J3" : [-2,0,-1,0,-1,1,-1,2],
                "L0" : [-2,1,-1,1,0,1,0,2],
                "L1" : [-1,2,-1,1,-1,0,0,0],
                "L2" : [0,1,-1,1,-2,1,-2,0],
                "L3" : [-2,2,-1,2,-1,1,-1,0],
                "S0" : [-2,1,-1,1,-1,2,0,2],
                "S1" : [-1,2,-1,1,0,1,0,0],
                "S2" : [-2,0,-1,0,-1,1,0,1],
                "S3" : [-2,2,-2,1,-1,1,-1,0],
                "T0" : [-2,1,-1,1,-1,2,0,1],
                "T1" : [-1,2,-1,1,-1,0,0,1],
                "T2" : [-2,1,-1,1,-1,0,0,1],
                "T3" : [-2,1,-1,2,-1,1,-1,0],
                "Z0" : [-2,2,-1,2,-1,1,0,1],
                "Z1" : [-1,0,-1,1,0,1,0,2],
                "Z2" : [-2,1,-1,1,-1,0,0,0],
                "Z3" : [-2,0,-2,1,-1,1,-1,2],
                "O0" : [-1,1,0,1,-1,0,0,0],
                "O1" : [-1,1,0,1,-1,0,0,0],
                "O2" : [-1,1,0,1,-1,0,0,0],
                "O3" : [-1,1,0,1,-1,0,0,0],
                "E0" : [0,1],
                "G0" : [0,1]
};
const SRS_TESTS = {
                "I0CC" : [0,0, -1,0, 2,0, -1,2, 2,-1],
                "I1CC" : [0,0, 2,0, -1,0, 2,1, -1,-2],
                "I2CC" : [0,0, 1,0, -2,0, 1,-2, -2,1],
                "I3CC" : [0,0, -2,0, 1,0, -2,-1, 1,2],  
                "I0C" : [0,0, -2,0, 1,0, -2,-1, 1,2],
                "I1C" : [0,0, -1,0, 2,0, -1,2, 2,-1],
                "I2C" : [0,0, 2,0, -1,0, 2,1, -1,-2],
                "I3C" : [0,0, 1,0, -2,0, 1,-2, -2,1],
                "K0CC" : [0,0, 1,0, 1,1, 0,-2, 1,-2],
                "K1CC" : [0,0, 1,0, 1,-1, 0,2, 1,2],
                "K2CC" : [0,0, -1,0, -1,1, 0,-2, -1,-2],
                "K3CC" : [0,0, -1,0, -1,-1, 0,2, -1,2],
                "K0C" : [0,0, -1,0, -1,1, 0,-2, -1,-2],
                "K1C" : [0,0, 1,0, 1,-1, 0,2, 1,2],
                "K2C" : [0,0, 1,0, 1,1, 0,-2, 1,-2],
                "K3C" : [0,0, -1,0, -1,-1, 0,2, -1,2],
                "O" : [0,0],
                "0F" : [0,0, 0,1, 1,1, -1,1, 1,0, -1,0],
                "1F" : [0,0, 1,0, 1,2, 1,1, 0,2, 0,1],
                "2F" : [0,0, 0,-1, -1,-1, 1,-1, -1,0, 1,0],
                "3F" : [0,0, -1,0, -1,2, -1,1, 0,2, 0,1],
};
const TSPIN_TESTS = [[-2,2],[0,2],[0,0],[-2,0]];

let pressedKeys = {};

var board; // this right?
var hold = new Image();
var next = new Image();
var resizeThrottle = false;

class Effect{
    constructor(type, size, startX, startY, endX, endY, time){
        // text, shape
        this.type = type;
        this.size = size;
        this.sx = startX;
        this.sy = startY;
        if(Math.abs(endX-startX) < 1e-5) this.slope = 1e+5;
        else this.slope = (endY-startY)/(endX-startX);
        this.dx = endX-startX;
        this.dy = endY-startY;
        this.time = time;
        this.state = 'MOVING';
        this.timer = 0;
    }

    move(){
        let d = this.ease(this.timer / this.time);

        if(this.timer == this.time) this,state = 'IDLE';
        else this.timer++;

        return (this.sx+d*this.dx, this.sy+d*this.dy);
    }

    ease(t) {
        return t < 0.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1;
    }
}

class EffectHandler{
    constructor(id, container, mainSquareSize){
        var effectCanvas = createCanvas(id+'E', container.clientWidth, container.clientHeight, 0, 0);
        container.appendChild(effectCanvas);
        this.ctx = effectCanvas.getContext('2d');

        this.id = id;
        this.canvasWidth = container.clientWidth;
        this.canvasHeight = container.clientHeight;
        this.sideSpace = (container.clientWidth-mainSquareSize)/2;

        this.effects = [];
    }

    drawEffects(){
        this.effects.forEach(()=>{
            if(this.type == 'TEXT'){
                let {x,y} = this.move();
                this.ctx.fillText("TEST",x,y);
            }
        })
    }

    addEffect(type, size, startX, startY, endX, endY){
        this.effects.push(new Effect(type, size, startX, startY, endX, endY));
    }

    createEssenceEffect(text, sx, sy){
        let ex = sx + Math.random()*this.sideSpace*2 - this.sideSpace;
        let ey = sy + Math.random()*20 - 10;
        this.addEffect('TEXT', 10, sx, sy, ex, ey);
    }
}

class Board{
    constructor(id, container, boardWidth, boardHeight){

        var boardCanvas = createCanvas(id, container.clientWidth, container.clientHeight, 0, 0);
        var bgCanvas = createCanvas(id+'B', container.clientWidth, container.clientHeight, 0, 0);
        container.appendChild(bgCanvas);
        container.appendChild(boardCanvas);
        this.boardCtx = boardCanvas.getContext('2d');
        this.bgCtx = bgCanvas.getContext('2d');
        this.effectBg = new EffectHandler(id, container);

        this.id = id;
        this.canvasWidth = container.clientWidth;
        this.canvasHeight = container.clientHeight;
        this.boardWidth = boardWidth;
        this.boardHeight = boardHeight;
        this.board = new Array(boardHeight+GHOST_HEIGHT);
        for(let i=0; i<boardHeight+GHOST_HEIGHT; i++)
            this.board[i] = new Array(boardWidth).fill('E');

        // canvas related values
        this.mainSquareSize = -1; // size of center square
        this.blk = -1; // block size
        this.sx = -100; // leftmost top of board
        this.sy = -100;
        this.getParams();
        
        this.interfaceMode = "standard"; // standard, less, minimal

        // game related values
        this.gameOn = false;
        this.isPaused = false;
        this.bag = ""; // 7 bag system
        this.hold = '';
        this.currMino = '';
        this.holdSwitched = false;
        this.bx = -100; // currently falling block
        this.by = -100;
        this.br = -1;
        this.timer = {}; // FALL LR DROP
        this.heldKeys = {};
        this.LR = "Idle"; // -2:LR -1:L 0:Idle 1:R 2:RL
        this.tSpin = -1;
        this.combo = 0;
        this.b2b = 0;
    }

    startGame(){
        this.gameOn = true;
        this.bag = suffleBag();
        this.hold = 'E';
        this.currMino = 'E';
        this.holdSwitched = false;
        this.timer["FALL"] = FALL_INTERVAL;

        this.getNextMino();
        this.drawBackground();
        this.drawBoard();

        var t = this;
        this.interval = setInterval(function(){t.gameHandler();},1);
    }

    resetGame(){
        // reset board
        for(let i=0; i<this.boardHeight+GHOST_HEIGHT; i++)
            this.board[i].fill('E');
        this.gameOn = true;
        this.bag = suffleBag();
        this.hold = 'E';
        this.currMino = 'E';
        this.holdSwitched = false;
        this.getNextMino();
        this.timer["FALL"] = FALL_INTERVAL;
    }

    gameHandler(){
        if (!this.gameOn || this.isPaused) return;
        
        let redrawBoard = false;
        let minoPlaced = false;
        
        // Left Right
        let Ldown = pressedKeys["ArrowLeft"] && !this.heldKeys["ArrowLeft"];
        let Rdown = pressedKeys["ArrowRight"] && !this.heldKeys["ArrowRight"];
        let Lup = !pressedKeys["ArrowLeft"];
        let Rup = !pressedKeys["ArrowRight"];
        this.LR = this.decideLeftRight(this.LR, Ldown, Rdown, Lup, Rup);

        let move = true;
        if(this.LR === "L" && !this.heldKeys["ArrowLeft"]){
            // If first frame of keypress,
            // move and set initial DAS
            this.heldKeys["ArrowLeft"] = true;
            this.timer["LR"] = INITIAL_DAS;
        }
        else if(this.LR === "R" && !this.heldKeys["ArrowRight"]){
            this.heldKeys["ArrowRight"] = true;
            this.timer["LR"] = INITIAL_DAS;
        }
        else if(this.timer["LR"]<=0){
            this.timer["LR"] = RECURRING_DAS;
        }
        else{
            move = false;
            this.timer["LR"]--;
        }

        if(this.LR === "RL" || this.LR === "L"){
            if(move && this.checkMinoPos(this.bx-1,this.by,this.currMino,this.br)){
                this.bx--;
                redrawBoard = true;
            }
        }

        if(this.LR === "LR" || this.LR === "R"){
            if(move && this.checkMinoPos(this.bx+1,this.by,this.currMino,this.br)){
                this.bx++;
                redrawBoard = true;
            }
        }

        // Clockwise rotation
        if (pressedKeys["ArrowUp"] && !this.heldKeys["ArrowUp"]){
            let nextBr = this.br==3 ? 0 : this.br+1;

            let code=""
            if(this.currMino=='I')
                code = this.currMino+this.br+"C";
            else if(this.currMino=='O')
                code = "O";
            else
                code = "K"+this.br+"C";

            let tests = SRS_TESTS[code];
            let {passed,dx,dy} = this.kick(tests,this.bx,this.by,this.currMino,nextBr);
            
            if(passed){
                this.bx+=dx;
                this.by+=dy;
                this.br=nextBr;
                if(dx!==0 && dy!==0) this.timer["FALL"]=FALL_INTERVAL; // "Infinity"
                redrawBoard = true;
            }
            this.heldKeys["ArrowUp"] = true;
        }

        // Counter clockwise rotation
        if (pressedKeys["KeyZ"] && !this.heldKeys["KeyZ"]){
            let nextBr = this.br==0 ? 3 : this.br-1;

            let code=""
            if(this.currMino=='I')
                code = this.currMino+this.br+"CC";
            else if(this.currMino=='O')
                code = "O";
            else
                code = "K"+this.br+"CC";

            let tests = SRS_TESTS[code];
            let {passed,dx,dy} = this.kick(tests,this.bx,this.by,this.currMino,nextBr);

            if(passed){
                this.bx+=dx;
                this.by+=dy;
                this.br=nextBr;
                if(dx!==0 && dy!==0) this.timer["FALL"]=FALL_INTERVAL; // "Infinity"
                redrawBoard = true;
            }
            this.heldKeys["KeyZ"] = true;
        }
        
        // 180 Flip (Kick table from OSK's tetr.io)
        if (pressedKeys["KeyA"] && !this.heldKeys["KeyA"]){
            let nextBr = this.br>=2 ? this.br-2 : this.br+2;
            let tests = SRS_TESTS[this.br+"F"];
            let {passed,dx,dy} = this.kick(tests,this.bx,this.by,this.currMino,nextBr);

            if(passed){
                this.bx+=dx;
                this.by+=dy;
                this.br=nextBr;
                if(dx!==0 && dy!==0) this.timer["FALL"]=FALL_INTERVAL; // "Infinity"
                redrawBoard = true;
            }

            this.heldKeys["KeyA"] = true;
        }

        // Harddrop
        if (pressedKeys["Space"] && !this.heldKeys["Space"]){
            let nextBy = this.by;
            while(this.checkMinoPos(this.bx, nextBy-1, this.currMino, this.br))
                nextBy--;
            this.by=nextBy;
            minoPlaced = true;
            redrawBoard = true;
            this.heldKeys["Space"] = true;
        }
        
        // Softdrop
        if (pressedKeys["ArrowDown"]){
            let drop = true;
            if(!this.heldKeys["ArrowDown"]){
                this.heldKeys["ArrowDown"] = true;
                this.timer["DROP"] = DROP_DAS;
            }
            else if(this.timer["DROP"]<=0){
                this.timer["DROP"] = DROP_DAS;
            }
            else{
                drop = false;
                this.timer["DROP"]--;
            }

            if(drop && this.checkMinoPos(this.bx,this.by-1,this.currMino,this.br)){
                this.by--;
                this.timer["FALL"] = FALL_INTERVAL;
                redrawBoard = true;
            }
        }

        // Gravity
        if(this.timer["FALL"]<0){
            if(this.checkMinoPos(this.bx,this.by-1,this.currMino, this.br)){
                this.by--;
                this.timer["FALL"]=FALL_INTERVAL;
                redrawBoard = true;
            }
            else{
                minoPlaced = true;
            }
        }
        else{
            this.timer["FALL"]--;
        }

        // Hold
        if(pressedKeys["ShiftLeft"] && !this.heldKeys["ShiftLeft"] && !this.holdSwitched){
            this.switchHold(this.currMino);
            this.holdSwitched = true;
            this.heldKeys["ShiftLeft"] = true;
            redrawBoard = true;
        }
        

        if(minoPlaced) {
            this.placeMino(this.bx, this.by, this.currMino, this.br);
            if(!this.getNextMino()){
                this.resetGame();
            }
        }
        if(redrawBoard) this.drawBoard();
    }

    // check next position after rotating
    // also checks if tspin, used in placeMino()
    kick(tests, x, y, type, r){
        let m = tests.length;
        let passed=false;
        let dx=0, dy=0;
        let kidx = 0;
        for(let i=0; i<m; i+=2){
            kidx++;
            dx=tests[i]; dy=tests[i+1];
            //console.log(code,i,dx,dy,this.checkMinoPos(this.bx+dx, this.by+dy, this.currMino, nextBr));
            if(this.checkMinoPos(x+dx, y+dy, type, r)){
                passed=true;
                break;
            }
        }

        // check if t-spin
        if(type==='T' && passed){
            let idx = r;
            let f = 0; // two blocks T is facing
            let nf = 0;
            for(let i=0; i<4; i++){
                if(!this.checkBlock(x+dx+TSPIN_TESTS[idx][0],y+dy+TSPIN_TESTS[idx][1]))
                    if(i<2) f++;
                    else nf++;    
                idx = (idx+1)%4;
            }
            if(f+nf>=3){
                // t-spin: either 2 blocks facing or last kick
                // t-spin mini: only 1 block facing
                if(f==2 || kidx==5) this.tSpin = 2;
                else this.tSpin = 1;
            }
            else this.tSpin = 0;
        }
        else this.tSpin = 0;

        return {passed, dx, dy};
    }

    // Left key and Right key decision
    decideLeftRight(LR, Ldown, Rdown, Lup, Rup){
        switch(LR){
            case "Idle":
                if(Ldown) return "L";
                else if(Rdown) return "R";
                else return "Idle";
            case "L":
                if(Lup) return "Idle";
                else if(Rdown) return "LR";
                else return "L";
            case "R":
                if(Rup) return "Idle";
                else if(Ldown) return "RL";
                else return "R";
            default:
                if(Rup) return "L";
                else if(Lup) return "R";
                else return LR;
        }
    }
    
    keyUp(k){
        this.heldKeys[k] = false;
    }

    switchHold(h){
        if(this.hold == 'E'){
            this.hold = h;
            this.getNextMino();
        }
        else{
            let temp = this.currMino;
            this.currMino = this.hold;
            this.hold = temp;
            this.getStartingPos();
        }
    }

    placeMino(cx, cy, type, r){
        // record mino on board
        let mino = MINO_OFFSET[type+r];
        let m = mino.length;
        for(let i=0; i<m; i+=2)
            this.board[cy+mino[i+1]][cx+mino[i]] = type;
        
        // check line clears
        let cleared = 0;
        for(let i=0; i<this.boardHeight+GHOST_HEIGHT; i++){
            let lineComplete = true;
            for(let j=0; j<this.boardWidth; j++){
                if(this.board[i][j]=='E'){
                    lineComplete = false;
                    break;
                }
            }
            if(lineComplete){
                cleared++;
                this.board.splice(i,1);
                this.board.push(new Array(this.boardWidth).fill('E'));
                i--;
            }
        }

        if(cleared>0){
            this.combo++;
            if(cleared>=4 || this.tSpin>0) this.b2b++;
            else this.b2b = 0;
        }
        else this.combo = 0;

        const ts_text = ["", "Mini T-spin", "T-spin"];
        const text = ["", "Single","Double","Triple","Tetris"];
        if(cleared>0 || this.tSpin>0){
            console.log(ts_text[this.tSpin]+" "+text[cleared]);
            console.log("Combo "+this.combo+" "+"Back to back "+this.b2b);
        }
    
        /*
        // Using Lodash
        this.board = _.remove(this.board, function(line){
            let complete=true;
            let m = line.length;
            for(let i=0; i<m; i++)
                if(line[i]=='E'){
                    complete=false;
                    break;
                }
            return complete;
        })
        */
    }

    // check a certain mino position is available on current board
    // cx,cy : center point of mino
    checkMinoPos(cx, cy, type, r){
        var mino = MINO_OFFSET[type+r];
        var m = mino.length;
        for(let i=0; i<m; i+=2)
            if(!this.checkBlock(cx+mino[i], cy+mino[i+1]))
                return false;
        return true;
    }

    checkBlock(x, y){
        return (0<=x) && (x<this.boardWidth) && (0<=y) && this.board[y][x]=='E';
    }

    getNextMino(){
        this.currMino = this.bag[0];
        this.bag = this.bag.slice(1);
        if(this.bag.length < 5)
            this.bag += suffleBag();
        this.getStartingPos();
        this.holdSwitched = false;

        // check gameover
        return this.checkMinoPos(this.bx, this.by, this.currMino, this.br);        
    }

    getStartingPos(){
        this.bx = Math.floor((this.boardWidth+1)/2);
        this.by = this.boardHeight;
        this.br = 0;
        if(this.currMino == 'O') this.by++;
    }

    getParams(){
        this.mainSquareSize = Math.min(this.canvasWidth*0.9,this.canvasHeight*0.9);
        this.blk = this.mainSquareSize/(this.boardHeight+GHOST_HEIGHT);
        // top left position of board
        this.sx = (this.canvasWidth-this.boardWidth*this.blk)/2;
        this.sy = (this.canvasHeight-this.boardHeight*this.blk)/2 + 0.05*this.mainSquareSize;
    }
    
    updateCanvas(width, height, left, top){
        var boardCanvas = document.getElementById(this.id);
        var bgCanvas = document.getElementById(this.id+'B');
        this.canvasWidth = width;
        this.canvasHeight = height;
        boardCanvas.width = width;
        boardCanvas.height = height;
        boardCanvas.style.left = left;
        boardCanvas.style.top = top;
        bgCanvas.width = width;
        bgCanvas.height = height;
        bgCanvas.style.left = left;
        bgCanvas.style.top = top;
        this.getParams();
        this.drawBackground();
        this.drawBoard();
    }

    drawBackground(){
        let ctx = this.bgCtx;
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        ctx.beginPath();

        // draw main board
        var gradient = ctx.createLinearGradient(0,this.sy,0,this.canvasHeight);
        gradient.addColorStop(0, "#a68bb5");
        gradient.addColorStop(1, "#a8c97d");
        ctx.strokeStyle = gradient;
        //ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = this.blk/20; // arbitrary 20
        for(let i=0; i<=this.boardWidth; i++){
            for(let j=0; j<=this.boardHeight; j++){
                //ctx.strokeRect(this.sx+this.blk*i,this.sy+this.blk*(j-1),this.blk,this.blk);
                ctx.strokeRect(this.sx+this.blk*i, this.sy+this.blk*j, 1,1);
            }
        }

        // draw bottom line
        const LineColor = "#a8c97d";
        ctx.strokeStyle = LineColor
        ctx.lineWidth = this.blk/4;
        ctx.moveTo(this.sx-1, this.sy+this.blk*this.boardHeight+this.blk/8);
        ctx.lineTo(this.sx+this.blk*this.boardWidth+1, this.sy+this.blk*this.boardHeight+this.blk/8);
        ctx.stroke();

        ctx.beginPath();
        var gradient = ctx.createLinearGradient(this.sx,0,Math.max(0,this.sx-this.blk*this.boardWidth),0);
        gradient.addColorStop(0, LineColor);
        gradient.addColorStop(1, LineColor+'00');
        ctx.strokeStyle = gradient;
        ctx.moveTo(this.sx, this.sy+this.blk*this.boardHeight+this.blk/8);
        ctx.lineTo(this.sx-this.blk*this.boardWidth, this.sy+this.blk*this.boardHeight+this.blk/8);
        ctx.stroke();

        ctx.beginPath();
        gradient = ctx.createLinearGradient(this.sx+this.blk*this.boardWidth,0,Math.min(this.canvasWidth,this.sx+2*this.blk*this.boardWidth),0);
        gradient.addColorStop(0,LineColor);
        gradient.addColorStop(1,LineColor+'00');
        ctx.strokeStyle = gradient;
        ctx.moveTo(this.sx+this.blk*this.boardWidth, this.sy+this.blk*this.boardHeight+this.blk/8);
        ctx.lineTo(this.sx+2*this.blk*this.boardWidth, this.sy+this.blk*this.boardHeight+this.blk/8);
        ctx.stroke()

        if(this.interfaceMode === "standard"){
            // draw hold and next bar
            let height = this.blk*3;
            let width = hold.width*height/hold.height;
            ctx.drawImage(hold,this.sx-width-this.blk/3,this.sy,width,height);
            height = this.blk*15;
            width = next.width*height/next.height;
            ctx.drawImage(next,this.sx+this.blk*this.boardWidth+this.blk/3,this.sy,width,height);
        }
    }

    drawBoard(){
        let ctx = this.boardCtx;
        // reset canvas
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        ctx.beginPath();

        if(!this.gameOn) return;

        // color blocks
        for(let i=0; i<this.boardHeight+GHOST_HEIGHT; i++)
            for(let j=0; j<this.boardWidth; j++)
                this.drawBlock(j,i,BLOCK_COLOR[this.board[i][j]], true);
        // draw current mino and ghost
        this.drawMino(this.currMino,this.bx,this.by,this.br);
        this.drawGhostMino(this.currMino, this.bx, this.by, this.br);

        if(this.interfaceMode === "standard"){
            // draw held mino
            this.drawRightAlignedMino(this.hold,-3.5,this.boardHeight-3,0);
            // draw lookahead
            for(let i=0; i<5; i++)
                this.drawLeftAlignedMino(this.bag[i],this.boardWidth+3.5, this.boardHeight-i*3-3, 0);
        }
        else if(this.interfaceMode === "minimal"){
            this.drawBlock(-1.5,this.boardHeight-1, BLOCK_COLOR[this.hold], true);
            for(let i=0; i<5; i++)
                this.drawBlock(this.boardWidth+.5, this.boardHeight-i-1, BLOCK_COLOR[this.bag[i]], true);
        }
    }

    // coordinate starts at left bottom as 0,0
    // assumes ctx exists
    drawBlock(x,y,c,fill){
        let ctx = this.boardCtx;
        if(fill){
            ctx.fillStyle = c;
            ctx.fillRect(this.sx+this.blk*x-0.5, this.sy+this.blk*(this.boardHeight-1-y)-0.5, this.blk+0.5, this.blk+0.5);
        }
        else{
            ctx.beginPath();
            ctx.strokeStyle = c;
            ctx.lineWidth = this.blk/10;
            ctx.strokeRect(this.sx+this.blk*x-0.5, this.sy+this.blk*(this.boardHeight-1-y)-0.5, this.blk+0.5, this.blk+0.5);
        }
    }

    drawMino(type,cx,cy,r){
        let pos = MINO_OFFSET[type+r];
        let m = pos.length;
        for(let i=0; i<m; i+=2){
            this.drawBlock(cx+pos[i], cy+pos[i+1], BLOCK_COLOR[type], true);
        }
    }

    drawGhostMino(type,cx,cy,r){
        let ghostBy = cy;
        while(this.checkMinoPos(cx, ghostBy-1, type, r))
            ghostBy--;
        let pos = MINO_OFFSET[type+r];
        let m = pos.length;
        for(let i=0; i<m; i+=2){
            this.drawBlock(cx+pos[i], ghostBy+pos[i+1], BLOCK_COLOR[type]+"99", false);
        }
    }   
    
    // center each mino within 3x4 box
    drawCenteredMino(type,cx,cy,r){
        if(type=='I')
            this.drawMino(type,cx,cy,r);
        else if(type=='O')
            this.drawMino(type,cx,cy+0.5,r);
        else
            this.drawMino(type,cx+0.5,cy-0.5,r);
    }

    // left align each mino within 3x4 box
    drawLeftAlignedMino(type,cx,cy,r){
        if(type=='I')
            this.drawMino(type,cx,cy,r);
        else if(type=='O')
            this.drawMino(type,cx-1,cy+0.5,r);
        else
            this.drawMino(type,cx,cy-0.5,r);
    }

    drawRightAlignedMino(type,cx,cy,r){
        if(type=='I')
            this.drawMino(type,cx,cy,r);
        else if(type=='O')
            this.drawMino(type,cx+1,cy+0.5,r);
        else
            this.drawMino(type,cx+1,cy-0.5,r);
    }

    clearBoard(){
        this.drawBoard();
    }
}

function suffleBag(){
    var seq = "";
    var taken = new Array(7).fill(0);
    for(let i=0; i<7;){
        let j = Math.floor(Math.random()*7);
        if (taken[j]) continue;
        taken[j] = 1;
        seq += BLOCK_SEQ[j];
        i++;
    }
    return seq;
}

function createCanvas(id, width, height, left, top){
    var canvas = document.createElement("canvas");
    canvas.id = id;
    canvas.width = width;
    canvas.height = height;
    canvas.style.left = left;
    canvas.style.top = top;
    canvas.classList.add("board");
    return canvas;
}

function setSinglePlayer(boardWidth, boardHeight){
    var container = document.getElementById("mainContainer");
    board = new Board("single0", container, boardWidth, boardHeight);
    //board.startGame();
}

function resizeSinglePlayer(){
    var container = document.getElementById("mainContainer");
    board.updateCanvas(container.clientWidth,container.clientHeight, 0, 0);
}

function setup(){
    console.log("Setting...")
    hold.src = "./res/img/hold.png";
    next.src = "./res/img/next.png";
   
    setSinglePlayer(10, 20);
}

window.onresize = function(e){
    if(!resizeThrottle){
        console.log("resized");
        resizeSinglePlayer();
        resizeThrottle = true;
        setTimeout(()=>{resizeThrottle=false;}, 16); // floor(1000/60)
    }
}

window.addEventListener("keydown", (event) =>{
    pressedKeys[event.code] = true;
});

window.addEventListener("keyup", (event) =>{
    pressedKeys[event.code] = false;
    board.keyUp(event.code);
});


var obj = document.createElement("object");
var objDoc = obj.contentDocument;
var 



/*
var canvas = document.createElement("canvas"),
    context = canvas.getContext("2d"),
    width = 1920,
    height = 1000,
    shapes = [randomPolygon(), randomPolygon()],
    interpolator = flubber.interpolate(shapes[0], shapes[1], { string: false }),
    startTime;

canvas.width = width;
canvas.height = height;

var mc = document.getElementById("mainContainer");
mc.appendChild(canvas);

context.fillStyle = "#e3e3e3";
context.strokeStyle = "#666";
context.lineWidth = 4;

requestAnimationFrame(draw);

function draw(time) {
  var points,
      t;

  if (!startTime) {
    startTime = time;
  }

  t = time - startTime;

  context.clearRect(0, 0, width, height);

  // Next iteration
  if (t > 1000) {
    startTime = time - t + 1000;
    t -= 1000;
    shapes.shift();
    shapes.push(randomPolygon());
    interpolator = flubber.interpolate(shapes[0], shapes[1], { string: false });
  }

  points = interpolator(ease(t / 1000));

  context.beginPath();
  points.forEach(function(p, i) {
    context[i ? "lineTo" : "moveTo"](...p);
  });
  context.lineTo(...points[0]);
  context.stroke();
  context.fill();

  requestAnimationFrame(draw);
}

function randomPolygon() {
  var sides = 3 + Math.floor(Math.random() * 10),
      r = 100 + Math.random() * 400,
      offset = Math.random() * 2 * Math.PI,
      x = width * (Math.random() * 2 + 1) / 4;

  return new Array(sides)
    .fill(null)
    .map(function(d, i) {
      return [
        Math.cos(offset + 2 * Math.PI * i / sides) * r + x,
        Math.sin(offset + 2 * Math.PI * i / sides) * r + height / 2
      ]
    });
}

// Cubic in/out easing
function ease(t) {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}
*/




/*
//debug
var K = 0;
setInterval(()=>{
    var ctx = document.getElementById(board.id).getContext('2d');
    board.clearBoard(ctx);
    board.drawMino(ctx,BLOCK_SEQ[Math.floor(K/4)],5,20,K%4);
    K++;
    if(K>=28) K=0;
}, 500);
*/