const express = require("express")
const path = require("path")
const bodyParser = require("body-parser")
const { match } = require("assert")
const app = express()
// const port = 8000 //using heroku's enviromental variable

gameRooms = []
class GameRoom {
    constructor(){
        this.roomCode = "code" //randomize
        this.players = []
    }
}

//later need to add the functionality to create a new game room through /new-game page
gameRooms.push(new GameRoom())

app.use(bodyParser.urlencoded({extended: true}))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.get("/",(req,res) => {
    res.render("home")
})

app.post("/play",(req,res) => {
    //need to check if game started
    //and if room code exists
    var playerName = req.body.playerName
    var gameCode = req.body.gameCode
    // var justEntered = true
    gameRooms.forEach((el, index, array) => {
        if (el.roomCode === gameCode){
            el.players.push({name: playerName, match: ""})
            console.log(el.players)
            res.redirect("/play")
        }
    })
})

app.get("/play", (req,res) => {
    var playerName = ""
    var gameCode = ""
    var justEntered = false
    res.render("waiting",{justEntered: justEntered, playerName: playerName, gameCode: gameCode, gameRooms: gameRooms})
})

app.post("/start", (req,res) => {
    var playerName = req.body.playerName
    var playersList = gameRooms[0].players
    var matchIndex = 1 + playersList.findIndex((el,index,array) => {
        return el == {name:playerName,match:""}
    })
    var matchPlayer = playersList[matchIndex % playersList.length]
    res.render("assign",{matchPlayer: matchPlayer})
})

app.post("/assign", (req,res) => {
    var matchPlayer = req.body.matchPlayer
    var matchIdentity = req.body.matchIdentity
    var playersList = gameRooms[0].players
    console.log(matchPlayer)
    var matchIndex = playersList.findIndex((el,index,array) => {
        return el == {name:matchPlayer.name,match:""}
    })
    console.log(matchIndex)
    if (matchIndex != -1){
        playersList[matchIndex].match = matchIdentity
    } else {
        console.log("match not found")
    }
    
    res.redirect("/waiting")
})

app.get("/waiting", (req,res) => {
    res.send("waiting for all players...") //change to new view
    //press button to check if all players finished defining the match identities
    //then start game for real
})

app.listen(process.env.PORT, () => {
    console.log("Listening at port: " + process.env.PORT)
})