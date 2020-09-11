const express = require("express")
const path = require("path")
const bodyParser = require("body-parser")
const cookieParser = require('cookie-parser')
const session = require('express-session')
const { strict } = require("assert")
const app = express()
// const port = 8000 //using heroku's enviromental variable

var justStarted = true
var currentTurn = 0

//THIS SHOULD BE SUBSTITUTED BY DATABASE
gameRooms = []
class GameRoom {
    constructor(roomCode){
        this.roomCode = roomCode //randomize
        this.players = []
        this.isStarted = false
        this.isAssigned = false
    }
}

function MakeID(length) {
    var result = ''
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    var charactersLength = characters.length
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result;
}

//later need to add the functionality to create a new game room through /new-game page
gameRooms.push(new GameRoom("code"))

app.use(bodyParser.urlencoded({extended: true}))
app.use(cookieParser())
app.use(session({secret: "QUEMSOUEU"}))

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.get("/new-game", (req,res) =>{
    var newRoom = MakeID(4)
    gameRooms.push(new GameRoom(newRoom))
    res.send("Compartilhe esse código com os amigos: " + newRoom)
})

app.get("/",(req,res) => {
    // console.log(req.session)
    if (justStarted){
        req.session.destroy()
        justStarted = false
    } else if (req.session.gameRoom && req.session.playerName){
        //check game flags to decide where to redirect
        res.redirect("/play")
    } else {
        res.render("home")
    }    
})

//comes from form in home.ejs
app.post("/play",(req,res) => {
    // console.log(req.session)
    var playerName = req.body.playerName
    var gameCode = req.body.gameCode
    req.session.playerName = playerName
    gameRooms.forEach((el, index, array) => {
        if (el.roomCode === gameCode && !el.isStarted){
            req.session.playerIndex = el.players.length
            req.session.matchIndex = req.session.playerIndex + 1
            el.players.push({name: playerName, identity: ""})
            req.session.gameRoom = el
            req.session.roomIndex = index
            res.redirect("/play")
        } //ELSE TO DEAL WITH WRONG CODES AND GAMES ALREADY STARTED
    })
})

//comes from post /play or from / if already entered a game room
app.get("/play", (req,res) => {
    // console.log(req.session)
    if (req.session.gameRoom && req.session.playerName){
        req.session.gameRoom = gameRooms[req.session.roomIndex]
        if (req.session.gameRoom.isStarted){
            res.redirect("/start")
        } else {
            var playerName = req.session.playerName
            var gameRoom = req.session.gameRoom
            res.render("lobby",{playerName: playerName, gameRoom: gameRoom})
            while (!req.session.gameRoom.isStarted){
                req.session.gameRoom = gameRooms[req.session.roomIndex]
            }
            res.redirect("/start")
        }
    } else {
        res.redirect("/")
    }
})

//comes from form button in lobby.js, should be in other page
app.post("/start", (req,res) => {
    // console.log(req.session)
    gameRooms[req.session.roomIndex].isStarted = true
    req.session.gameRoom = gameRooms[req.session.roomIndex]
    res.redirect("/start")
})

app.get("/start", (req,res) => {
    // console.log(req.session)
    if (req.session.gameRoom){
        if (req.session.gameRoom.isStarted){
            if (req.session.hasAssigned){
                res.redirect("/assign")
            } else {
                if (!req.session.matchPlayer){
                    req.session.gameRoom = gameRooms[req.session.roomIndex]
                    var gameRoom = req.session.gameRoom
        
                    if (req.session.matchIndex >= gameRoom.players.length) req.session.matchIndex = 0
                    var matchPlayer = gameRoom.players[req.session.matchIndex]
                    req.session.matchPlayer = matchPlayer
                }
                res.render("assign",{matchPlayer: req.session.matchPlayer})
            }
        } else {
            res.redirect("/play")
        }
    } else {
        res.redirect("/")
    }
})

//comes from form in assign.ejs
app.post("/assign", (req,res) => {
    // console.log(req.session)
    var matchIdentity = req.body.matchIdentity
    gameRooms[req.session.roomIndex].players[req.session.matchIndex].identity = matchIdentity
    req.session.hasAssigned = true
    req.session.gameRoom = gameRooms[req.session.roomIndex]
    res.redirect("/assign")
})

//comes from post /assign
app.get("/assign", (req,res) => {
    // console.log(req.session)
    if (req.session.hasAssigned){
        req.session.gameRoom = gameRooms[req.session.roomIndex]
        gameRoom = req.session.gameRoom
        counter = gameRoom.players.length
        for (var i in gameRoom.players){
            if (gameRoom.players[i].identity !== ""){
                counter -= 1
            }
        }
        if (counter === 0){
            res.redirect("/turn")
        } else {
            res.render("waiting",{gameRoom: gameRoom})
        }
    } else {
        res.redirect("/start")
    }    
})

app.get("/turn", (req,res) => {
    // console.log(req.session)
    req.session.gameRoom = gameRooms[req.session.roomIndex]
    name = ""
    identity = ""
    console.log("currentTurn: "+ currentTurn + "; playerIndex: "+ req.session.playerIndex)
    if(req.session.playerIndex === currentTurn){
        name = req.session.gameRoom.players[currentTurn].name
        res.render("turn",{yourTurn:true,name:name,identity:identity})
    } else {
        name = req.session.gameRoom.players[currentTurn].name
        identity = req.session.gameRoom.players[currentTurn].identity
        res.render("turn",{yourTurn:false,name:name,identity:identity})
    }
})

app.post("/turn", (req,res) => {
    if (currentTurn === req.session.gameRoom.players.length - 1){
        currentTurn = 0
    } else {
        currentTurn += 1
    }
    res.redirect("/turn")
})

app.listen(process.env.PORT, () => {
    console.log("Listening at port: " + process.env.PORT)
})

//REGISTER GAMEROOM INDEX IN SESSION TO MAKE EASIER TO UPDATE GAME INFO