require("dotenv").config();

const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

// SAVED IN DB
const users = [];
const refreshTokens = [];


async function getToken(payload, secret, options={}) {
 
  return await new Promise(function (resolve, reject) {
    jwt.sign({ user: payload }, secret, options, function (err, token) {

      if (err) {
        return reject(err);
      }

      if (! ("expiresIn" in options)) {
        // A REFRESH TOKEN
        refreshTokens.push(token);
      }

      resolve(token);

    });

  });
}


async function generateTokens(req, res) {
  // GENERATE ACCESS AND REFRESH TOKEN
  try {
    const accessToken = await getToken(req.user, process.env.ACCESS_TOKEN_SECRET, 
      options={ expiresIn: "1m" });
    const refreshToken = await getToken(req.user, process.env.REFRESH_TOKEN_SECRET);

    res.send({ accessToken, refreshToken });
  }
  catch (error) {
    res.status(500).send({ message: error.message });
  }
}


app.post("/register", function (req, res) {
  if (req.body.username && req.body.password) {

    users.push({
      username: req.body.username,
      password: req.body.password
    });

    console.log(users);

    res.status(201).send({ message: "You can login now" });
  }
  else {
    res.status(400).send({ message: "Incomplete data!" });
  }
});

app.post("/login", function (req, res, next) {
  if (req.body.username && req.body.password) {

    const cb = item => {
      return item.username === req.body.username && item.password === req.body.password;
    }

    if (users.find(cb)) {
      // GENERATE ACCESS AND REFRESH TOKEN
      req.user = req.body.username;
      next();
    }
    else {
      // UNAUTHORISED
      res.status(401).send({ message: "Invalid credentials" });
    }
  }
  else {
    res.status(400).send({ message: "Incomplete data!" });
  }
}, generateTokens);


app.post("/token", function (req, res, next) {
  if (req.body.token) {
    // VERIFY REFRESH TOKEN

    jwt.verify(req.body.token, process.env.REFRESH_TOKEN_SECRET, function (err, decoded) {
      if (err) {
        console.log(err);

        return res.status(403).send({ message: err.message });
      }

      req.user = decoded.user;
      next();
    });
  }
  else {
    res.status(400).send({ message: "Refresh token not found!" });
  }
  
}, 
generateTokens);


// 404 HANDLER
app.use(function (req, res, next) {
  res.status(404).send({ message: "Sorry, can't find that!" });
});


app.listen(process.env.PORT_2, function () {
  console.log(`Auth running at ${process.env.PORT_2}`);

});
