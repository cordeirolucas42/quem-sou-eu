const express = require("express")
const path = require("path")
const bodyParser = require("body-parser")
const cookieParser = require('cookie-parser')
const session = require('express-session')
const app = express()
// const port = 8000 //using heroku's enviromental variable

var justStarted = true

//THIS SHOULD BE SUBSTITUTED BY DATABASE
gameRooms = []
class GameRoom {
    constructor(){
        this.roomCode = "code" //randomize
        this.players = []
        this.isStarted = false
        this.isAssigned = false
    }
}

//later need to add the functionality to create a new game room through /new-game page
gameRooms.push(new GameRoom())

app.use(bodyParser.urlencoded({extended: true}))
app.use(cookieParser())
app.use(session({secret: "QUEMSOUEU"}))

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.get("/",(req,res) => {
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
    var playerName = req.body.playerName
    var gameCode = req.body.gameCode
    req.session.playerName = playerName
    gameRooms.forEach((el, index, array) => {
        if (el.roomCode === gameCode && !el.isStarted){
            req.session.playerIndex = el.players.length
            req.session.matchIndex = req.session.playerIndex + 1
            el.players.push({name: playerName, identity: ""})
            req.session.gameRoom = el
            res.redirect("/play")
        } //ELSE TO DEAL WITH WRONG CODES AND GAMES ALREADY STARTED
    })
})

//comes from post /play or from / if already entered a game room
app.get("/play", (req,res) => {
    if (req.session.gameRoom && req.session.playerName){
        //find gameRoom object and update object in session variable
        gameRooms.forEach((el, index, array) => {
            if (el.roomCode === req.session.gameRoom.roomCode){
                req.session.gameRoom = el
            } //NEED TO HANDLE ERRORS
        })
        if (req.session.gameRoom.isStarted){
            res.redirect("/start")
        } else {
            var playerName = req.session.playerName
            //find gameRoom object and update object in session variable
            gameRooms.forEach((el, index, array) => {
                if (el.roomCode === req.session.gameRoom.roomCode){
                    req.session.gameRoom = el
                } //NEED TO HANDLE ERRORS
            })
            var gameRoom = req.session.gameRoom
            res.render("lobby",{playerName: playerName, gameRoom: gameRoom})
        }
    } else {
        res.redirect("/")
    }    
})

//comes from form button in lobby.js, should be in other page
app.post("/start", (req,res) => {
    //find gameRoom object and update object in session variable
    gameRooms.forEach((el, index, array) => {
        if (el.roomCode === req.session.gameRoom.roomCode){
            el.isStarted = true
            req.session.gameRoom = el
        } //NEED TO HANDLE ERRORS
    })
    res.redirect("/start")
})

app.get("/start", (req,res) => {
    if (req.session.gameRoom){
        if (req.session.gameRoom.isStarted){
            if (!req.session.matchPlayer){
                //find gameRoom object and update object in session variable
                gameRooms.forEach((el, index, array) => {
                    if (el.roomCode === req.session.gameRoom.roomCode){
                        el.isStarted = true
                        req.session.gameRoom = el
                    } //NEED TO HANDLE ERRORS
                })
                var gameRoom = req.session.gameRoom
    
                if (req.session.matchIndex >= gameRoom.players.length) req.session.matchIndex = 0
                var matchPlayer = gameRoom.players[req.session.matchIndex]
                req.session.matchPlayer = matchPlayer
            }
            res.render("assign",{matchPlayer: req.session.matchPlayer})
        } else {
            res.redirect("/play")
        }
    } else {
        res.redirect("/")
    }
})

//comes from form in assign.ejs
app.post("/assign", (req,res) => {
    var matchIdentity = req.body.matchIdentity

    //find gameRoom object and update object in session variable
    gameRooms.forEach((el, index, array) => {
        if (el.roomCode === req.session.gameRoom.roomCode){
            el.players[req.session.matchIndex].identity = matchIdentity
            req.session.hasAssigned = true
            req.session.gameRoom = el
        } //NEED TO HANDLE ERRORS
    })
    res.redirect("/assign")
})

//comes from post /assign
app.get("/assign", (req,res) => {
    if (req.session.hasAssigned){
        //find gameRoom object and update object in session variable
        gameRooms.forEach((el, index, array) => {
            if (el.roomCode === req.session.gameRoom.roomCode){  
                req.session.gameRoom = el
            } //NEED TO HANDLE ERRORS
        })
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
    res.send("let's start the game")
})

app.listen(process.env.PORT, () => {
    console.log("Listening at port: " + process.env.PORT)
})

//REGISTER GAMEROOM INDEX IN SESSION TO MAKE EASIER TO UPDATE GAME INFO