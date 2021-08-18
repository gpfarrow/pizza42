const express = require("express");
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const { join } = require("path");
const authConfig = require("./auth_config.json");
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const jwtAuthz = require('express-jwt-authz');

// Serve static assets from the /public folder
app.use(express.static(join(__dirname, "public")));

// Enable CORS
app.use(cors());


// Enable the use of request body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Create timesheets API endpoint
//app.post('/order', function(req, res){
// res.status(201).send({message: "This is the POST /order endpoint"});
//})

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`
  }),

  audience: authConfig.audience,
  issuer: `https://${authConfig.domain}/`,
  algorithms: ["RS256"]
});

app.post('/order', checkJwt, jwtAuthz(['create:orders']), function(req, res){
  var order = req.body;
  res.status(201).send(order);
  
});

app.get("/api/external", checkJwt, jwtAuthz(['create:orders']), (req, res) => {
  //console.log(authConfig);
  res.send({
    msg: "Your access token was successfully validated!"
  });
});


// Endpoint to serve the configuration file
app.get("/auth_config.json", (req, res) => {
  res.sendFile(join(__dirname, "auth_config.json"));
});

// Serve the index page for all other requests
app.get("/*", (_, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

app.use(function(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    return res.status(401).send({ msg: "Invalid token" });
  }

  next(err, req, res);
});

// Listen on port 3000
app.listen(3000, () => console.log(authConfig));
//module.exports = app;