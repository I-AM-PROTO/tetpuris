// IDEA: The background flourishes as you go
// e.g. add house, add characters, add trees ...

// TODO: redraw canvas and board ONLY IF size changes
// TODO: add throttle module on resize

const ghostHeight=3;
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
const SRStests = 0;
var board;

class Board{
    constructor(id, canvasWidth, canvasHeight, boardWidth, boardHeight){
        this.id = id;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.boardWidth = boardWidth;
        this.boardHeight = boardHeight;
        this.board = new Array(boardWidth);
        for(let i=0; i<boardWidth; i++)
            this.board[i] = new Array(boardHeight).fill('E');
        
        this.getParams();

        this.gameOn = false;
        this.isPaused = false;
        this.startGame();
    }

    startGame(){
        this.gameOn = true;
        this.bagIdx = 0;
        this.currBag = suffleBag();
        this.nextBag = "";
        this.onHold = 'E';
        this.getStartingPos();
        this.fallInterval = 500;
        this.interval = setInterval(()=>{
            if (!this.gameOn || this.isPaused) return;
            if (this.fallInterval<0){
                this.by--;
                this.fallInterval=500;
                this.drawBoard();
            }
            else this.fallInterval--;
        },1);
    }


    getStartingPos(){
        // currently falling block position, rotation value
        this.bx = Math.floor((this.boardWidth+1)/2);
        this.by = this.boardHeight;
        this.br = 0;
        if(this.currBag[this.bagIdx] == 'O') this.by++;
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
                    //ctx.strokeRect(sx+blk*i,sy+blk*j,blk,blk);
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
            ctx.stroke();
            
            for(let i=0; i<this.boardWidth; i++)
                for(let j=0; j<this.boardHeight+ghostHeight; j++)
                    this.drawBlock(ctx, i,j,blockColor[this.board[i][j]]);
            this.drawMino(ctx,this.currBag[this.bagIdx],this.bx,this.by,this.br);
        }
    }

    // coordinate starts at left bottom as 0,0
    // assumes ctx exists
    drawBlock(ctx,x,y,c){
        ctx.fillStyle = c;
        ctx.fillRect(this.sx+this.blk*x-0.5, this.sy+this.blk*(this.boardHeight-1-y)-0.5, this.blk+0.5, this.blk+0.5);
    }

    // All according to SRS (i think)
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


/*
//debug
var K = 0;
setInterval(()=>{
    var ctx = document.getElementById(board.id).getContext('2d');
    board.clearBoard(ctx);
    board.drawMino(ctx,blockSeq[Math.floor(K/4)],5,20,K%4);
    K++;
    if(K>=28) K=0;
}, 1000);
*/