const express = require("express")
const path = require('path');
const app = express()
// const port = 8000 //using heroku's enviromental variable

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get("/",(req,res) => {
    res.render("home")
})

app.listen(process.env.PORT, () => {
    console.log("Listening at port: " + process.env.PORT)
})