// IDEA: The background flourishes as you go
// e.g. add house, add characters, add trees ...

// TODO: redraw canvas and board ONLY IF size changes
// TODO: add throttle module on resize
// TODO: infinity should not happen while airborne

const ghostHeight=3;
const fallInterval=200;
const blockSeq = "IJLOSTZ";
const blockColor = {
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
const minoOffset = {
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
                "E" : [0,1],
                "G" : [0,1]
}
const SRStests = {
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
                "O" : [0,0]
};
let pressedKeys = {};
let operatedKeys = {};

var board; // this right?

class Board{
    constructor(id, canvasWidth, canvasHeight, boardWidth, boardHeight){
        this.id = id;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.boardWidth = boardWidth;
        this.boardHeight = boardHeight;
        this.board = new Array(boardWidth);
        for(let i=0; i<boardWidth; i++)
            this.board[i] = new Array(boardHeight+ghostHeight).fill('E');
        
        this.getParams();

        this.gameOn = false;
        this.isPaused = false;
    }

    startGame(){
        this.gameOn = true;
        this.bagIdx = 0;
        this.bag = suffleBag();
        this.onHold = 'E';
        this.getStartingPos();
        this.fallTimer = fallInterval;
        this.interval = setInterval(()=>{
            if (!this.gameOn || this.isPaused) return;

            // Left
            if (pressedKeys["ArrowLeft"]){
                if(this.checkMinoPos(this.bx-1,this.by,this.bag[this.bagIdx],this.br)){
                    this.bx--;
                    this.drawBoard();
                    pressedKeys["ArrowLeft"]=false;
                }
            }

            // Right
            if (pressedKeys["ArrowRight"]){
                if(this.checkMinoPos(this.bx+1,this.by,this.bag[this.bagIdx],this.br)){
                    this.bx++;
                    this.drawBoard();
                    pressedKeys["ArrowRight"]=false;
                }
            }

            // Clockwise rotation
            if (pressedKeys["ArrowUp"] && !operatedKeys["ArrowUp"]){
                let nextBr = this.br==3 ? 0 : this.br+1;
                let code=""
                if(this.bag[this.bagIdx]=='I')
                    code = this.bag[this.bagIdx]+this.br+"C";
                else if(this.bag[this.bagIdx]=='O')
                    code = "O";
                else
                    code = "K"+this.br+"C";
                let tests = SRStests[code];
                let m = tests.length

                let passed=false;
                let dx=0, dy=0;
                for(let i=0; i<m && !passed; i+=2){
                    dx=tests[i];
                    dy=tests[i+1];
                    //console.log(code,i,dx,dy,this.checkMinoPos(this.bx+dx, this.by+dy, this.bag[this.bagIdx], nextBr));
                    if(this.checkMinoPos(this.bx+dx, this.by+dy, this.bag[this.bagIdx], nextBr))
                        passed=true;
                }

                if(passed){
                    this.bx+=dx;
                    this.by+=dy;
                    this.br=nextBr;
                    this.fallTimer=fallInterval; // "Infinity"
                    this.drawBoard();
                }
                operatedKeys["ArrowUp"] = true;
            }

            // Counter clockwise rotation
            if (pressedKeys["KeyZ"] && !operatedKeys["KeyZ"]){
                console.log("HEY!");
                let nextBr = this.br==0 ? 3 : this.br-1;
                let code=""
                if(this.bag[this.bagIdx]=='I')
                    code = this.bag[this.bagIdx]+this.br+"CC";
                else if(this.bag[this.bagIdx]=='O')
                    code = "O";
                else
                    code = "K"+this.br+"CC";
                let tests = SRStests[code];
                let m = tests.length

                let passed=false;
                let dx=0, dy=0;
                for(let i=0; i<m && !passed; i+=2){
                    dx=tests[i];
                    dy=tests[i+1];
                    console.log(code,i,dx,dy,this.checkMinoPos(this.bx+dx, this.by+dy, this.bag[this.bagIdx], nextBr));
                    if(this.checkMinoPos(this.bx+dx, this.by+dy, this.bag[this.bagIdx], nextBr))
                        passed=true;
                }

                if(passed){
                    this.bx+=dx;
                    this.by+=dy;
                    this.br=nextBr;
                    this.fallTimer=fallInterval; // "Infinity"
                    this.drawBoard();
                }
                operatedKeys["KeyZ"] = true;
            }

            // Harddrop
            if (pressedKeys["Space"] && !operatedKeys["Space"]){
                let nextBy = this.by;
                while(this.checkMinoPos(this.bx, nextBy-1, this.bag[this.bagIdx], this.br))
                    nextBy--;
                console.log(nextBy);
                this.by=nextBy;
                this.recordMino(this.bx, this.by, this.bag[this.bagIdx], this.br);
                this.getNextMino();
                this.drawBoard();
                operatedKeys["Space"] = true;
            }
            
            // Softdrop
            if (pressedKeys["ArrowDown"]){
                if(this.checkMinoPos(this.bx,this.by-1,this.bag[this.bagIdx],this.br)){
                    this.by--;
                    this.fallTimer=fallInterval;
                    this.drawBoard();
                }
                else{
                    this.fallTimer--;
                }
            }

            // Gravity
            if(this.fallTimer<0){
                if(this.checkMinoPos(this.bx,this.by-1,this.bag[this.bagIdx],this.br)){
                    this.by--;
                    this.fallTimer=fallInterval;
                    this.drawBoard();
                }
                else{
                    this.recordMino(this.bx, this.by, this.bag[this.bagIdx],this.br);
                    this.getNextMino();
                }
            }
            else{
                this.fallTimer--;
            }
        },1);
    }

    recordMino(cx, cy, type, r){
        var mino = minoOffset[type+r];
        var m = mino.length;
        for(let i=0; i<m; i+=2)
            this.board[cx+mino[i]][cy+mino[i+1]] = type;
        // check line to delete
    }

    // cx,cy : center point of mino
    checkMinoPos(cx, cy, type, r){
        var mino = minoOffset[type+r];
        var m = mino.length;
        for(let i=0; i<m; i+=2)
            if(!this.checkBlock(cx+mino[i], cy+mino[i+1]))
                return false;
        return true;
    }

    checkBlock(x, y){
        return (0<=x) && (x<this.boardWidth) && (0<=y) && this.board[x][y]=='E';
    }

    getNextMino(){
        this.bagIdx++;
        if(this.bagIdx == 2)
            this.bag += suffleBag();
        if(this.bagIdx == 7){
            this.bag = this.bag.substr(7);
            this.bagIdx = 0;
        }
        this.getStartingPos();
    }

    getStartingPos(){
        // currently falling block position, rotation value
        this.bx = Math.floor((this.boardWidth+1)/2);
        this.by = this.boardHeight;
        this.br = 0;
        if(this.bag[this.bagIdx] == 'O') this.by++;
    }

    getParams(){
        this.mainSquareSize = Math.min(this.canvasWidth,this.canvasHeight*0.9);
        this.blk = this.mainSquareSize/(this.boardHeight+ghostHeight);
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
        
            for(let i=0; i<this.boardWidth; i++)
                for(let j=0; j<this.boardHeight+ghostHeight; j++)
                    this.drawBlock(ctx, i,j,blockColor[this.board[i][j]]);
            if(this.gameOn)
                this.drawMino(ctx,this.bag[this.bagIdx],this.bx,this.by,this.br);
        }
    }

    // coordinate starts at left bottom as 0,0
    // assumes ctx exists
    drawBlock(ctx,x,y,c){
        ctx.fillStyle = c;
        ctx.fillRect(this.sx+this.blk*x-0.5, this.sy+this.blk*(this.boardHeight-1-y)-0.5, this.blk+0.5, this.blk+0.5);
    }

    drawMino(ctx,type,cx,cy,r){
        var pos = minoOffset[type+r];
        var m = pos.length;
        for(let i=0; i<m; i+=2){
            this.drawBlock(ctx, cx+pos[i], cy+pos[i+1], blockColor[type]);
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
        seq += blockSeq[j];
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
    operatedKeys[event.code] = false;
});


/*
//debug
var K = 0;
setInterval(()=>{
    var ctx = document.getElementById(board.id).getContext('2d');
    board.clearBoard(ctx);
    board.drawMino(ctx,blockSeq[Math.floor(K/4)],5,20,K%4);
    K++;
    if(K>=28) K=0;
}, 500);
*/