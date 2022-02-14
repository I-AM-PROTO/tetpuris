// IDEA: The background flourishes as you go
// e.g. add house, add characters, add trees ...

// TODO: redraw canvas and board ONLY IF size changes
// TODO: add throttle module on resize
// TODO: infinity should not happen while airborne
// TODO: better hold/look ahead display
// TODO: Gameover

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
                } 
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
}
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

let pressedKeys = {};

var board; // this right?

class Board{
    constructor(id, canvasWidth, canvasHeight, boardWidth, boardHeight){
        
        this.id = id;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
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
    }

    startGame(){
        this.gameOn = true;
        this.bag = suffleBag();
        this.hold = 'E';
        this.currMino = 'E';
        this.holdSwitched = false;
        this.getNextMino();
        this.timer["FALL"] = FALL_INTERVAL;
        this.interval = setInterval(()=>{
            if (!this.gameOn || this.isPaused) return;
            
            let redrawBoard = false;
            
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
                    this.timer["FALL"]=FALL_INTERVAL; // "Infinity"
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
                    this.timer["FALL"]=FALL_INTERVAL; // "Infinity"
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
                    this.timer["FALL"]=FALL_INTERVAL; // "Infinity"
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
                this.placeMino(this.bx, this.by, this.currMino, this.br);
                this.getNextMino();
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
                    this.placeMino(this.bx, this.by, this.currMino, this.br);
                    this.getNextMino();
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

            if(redrawBoard) this.drawBoard();
        },1);
    }

    kick(tests, x, y, type, r){
        let m = tests.length;
        let passed=false;
        let dx=0, dy=0;
        for(let i=0; i<m; i+=2){
            dx=tests[i]; dy=tests[i+1];
            //console.log(code,i,dx,dy,this.checkMinoPos(this.bx+dx, this.by+dy, this.currMino, nextBr));
            if(this.checkMinoPos(x+dx, y+dy, type, r)){
                passed=true;
                break;
            }
        }
        return {passed, dx, dy};
    }

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
    
        // check gameover
        
    }

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
        this.bag = this.bag.substr(1);
        if(this.bag.length < 5)
            this.bag += suffleBag();
        this.getStartingPos();
        this.holdSwitched = false;
    }

    getStartingPos(){
        // currently falling block position, rotation value
        this.bx = Math.floor((this.boardWidth+1)/2);
        this.by = this.boardHeight;
        this.br = 0;
        if(this.currMino == 'O') this.by++;
    }

    getParams(){
        this.mainSquareSize = Math.min(this.canvasWidth,this.canvasHeight*0.9);
        this.blk = this.mainSquareSize/(this.boardHeight+GHOST_HEIGHT);
        // top left position of board
        this.sx = (this.canvasWidth-this.boardWidth*this.blk)/2;
        this.sy = (this.canvasHeight-this.boardHeight*this.blk)/2 + 0.05*this.mainSquareSize;
    }
    
    updateCanvas(width, height, left, top){
        var canvas = document.getElementById(this.id);
        this.canvasWidth = width;
        this.canvasHeight = height;
        canvas.width = width;
        canvas.height = height;
        canvas.style.left = left;
        canvas.style.top = top;
        this.getParams();
        this.drawBoard();
    }

    drawBoard(){
        var canvas = document.getElementById(this.id);
    
        if (canvas.getContext('2d')){
            var ctx = canvas.getContext('2d');
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();

            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = this.blk/20; // arbitrary 20
            for(let i=0; i<11; i++){
                for(let j=0; j<21; j++){
                    //ctx.strokeRect(this.sx+this.blk*i,this.sy+this.blk*(j-1),this.blk,this.blk);
                    ctx.strokeRect(this.sx+this.blk*i, this.sy+this.blk*j, 1,1);
                }
            }
            
            ctx.strokeStyle = 'rgba(150,150,150,1)';
            ctx.lineWidth = this.blk/4;
            ctx.moveTo(this.sx-1, this.sy+this.blk*this.boardHeight+this.blk/8);
            ctx.lineTo(this.sx+this.blk*this.boardWidth+1, this.sy+this.blk*this.boardHeight+this.blk/8);
            ctx.stroke();

            ctx.beginPath();
            var gradient = ctx.createLinearGradient(this.sx,0,Math.max(0,this.sx-this.blk*this.boardWidth),0);
            gradient.addColorStop(0,'rgba(150,150,150,1)');
            gradient.addColorStop(1,'rgba(0,0,0,0)');
            ctx.strokeStyle = gradient;
            ctx.moveTo(this.sx, this.sy+this.blk*this.boardHeight+this.blk/8);
            ctx.lineTo(this.sx-this.blk*this.boardWidth, this.sy+this.blk*this.boardHeight+this.blk/8);
            ctx.stroke();

            ctx.beginPath();
            gradient = ctx.createLinearGradient(this.sx+this.blk*this.boardWidth,0,Math.min(this.canvasWidth,this.sx+2*this.blk*this.boardWidth),0);
            gradient.addColorStop(0,'rgba(150,150,150,1)');
            gradient.addColorStop(1,'rgba(0,0,0,0)');
            ctx.strokeStyle = gradient;
            ctx.moveTo(this.sx+this.blk*this.boardWidth, this.sy+this.blk*this.boardHeight+this.blk/8);
            ctx.lineTo(this.sx+2*this.blk*this.boardWidth, this.sy+this.blk*this.boardHeight+this.blk/8);
            ctx.stroke()
        
            for(let i=0; i<this.boardHeight+GHOST_HEIGHT; i++)
                for(let j=0; j<this.boardWidth; j++)
                    this.drawBlock(ctx, j,i,BLOCK_COLOR[this.board[i][j]], true);
            if(this.gameOn){
                this.drawGhostMino(ctx, this.currMino, this.bx, this.by, this.br);
                this.drawMino(ctx,this.currMino,this.bx,this.by,this.br);
                this.drawMino(ctx,this.hold,-3,this.boardHeight,0);
                for(let i=0; i<5; i++)
                    if(this.bag[i] == 'O')
                        this.drawMino(ctx,this.bag[i],this.boardWidth+3, this.boardHeight-i*3+1, 0);
                    else
                        this.drawMino(ctx,this.bag[i],this.boardWidth+3, this.boardHeight-i*3, 0);
            }
        }
    }

    // coordinate starts at left bottom as 0,0
    // assumes ctx exists
    drawBlock(ctx,x,y,c,fill){
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

    drawMino(ctx,type,cx,cy,r){
        let pos = MINO_OFFSET[type+r];
        let m = pos.length;
        for(let i=0; i<m; i+=2){
            this.drawBlock(ctx, cx+pos[i], cy+pos[i+1], BLOCK_COLOR[type], true);
        }
    }

    drawGhostMino(ctx,type,cx,cy,r){
        let ghostBy = cy;
        while(this.checkMinoPos(cx, ghostBy-1, type, r))
            ghostBy--;
        let pos = MINO_OFFSET[type+r];
        let m = pos.length;
        for(let i=0; i<m; i+=2){
            this.drawBlock(ctx, cx+pos[i], ghostBy+pos[i+1], BLOCK_COLOR[type]+"99", false);
        }
    }

    clearBoard(ctx){
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
    var newCanvas = createCanvas("single0", container.clientWidth, container.clientHeight, 0, 0);
    container.appendChild(newCanvas);
    board = new Board("single0", container.clientWidth, container.clientHeight, boardWidth, boardHeight);
    board.startGame();
    board.drawBoard();
}

function resizeSinglePlayer(){
    var container = document.getElementById("mainContainer");
    board.updateCanvas(container.clientWidth,container.clientHeight, 0, 0);
}

function setup(){
    console.log("Setting...")
    setSinglePlayer(10,20);
}

window.onresize = function(e){
    resizeSinglePlayer();
}

window.addEventListener("keydown", (event) =>{
    pressedKeys[event.code] = true;
});

window.addEventListener("keyup", (event) =>{
    pressedKeys[event.code] = false;
    board.keyUp(event.code);
});


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