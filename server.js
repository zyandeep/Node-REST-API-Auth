require("dotenv").config();

const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();

// MIDDLEWARE TO VERIFY JWT TOKEN
app.use(function (req, res, next) {

  try {
    const token = req.headers.authorization.split(" ")[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
      if (err) {
        console.log(err);
        
        return res.status(403).send({ message: err.message });
      }

      console.log(decoded);
      req.user = decoded.user;
      next();
    });
  } 
  catch (error) {
    res.status(401).send({ message: "Token not found" });  
  }
  
});


app.get("/posts", function (req, res) {
  
  const posts = require("./posts.json");

  res.send(posts.filter(item => item.user === req.user));
});


app.listen(process.env.PORT_1, function () {
  console.log(`Server running at ${process.env.PORT_1}`);

});
