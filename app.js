const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
app.use(express.json());
const main_path = path.join(__dirname, "covid19IndiaPortal.db");

let covid_DB = null;
const connect_covid19_DB = async () => {
  try {
    covid_DB = await open({
      filename: main_path,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at port 3000");
    });
  } catch (e) {
    console.log(`${e.message}`);
    process.exit(1);
  }
};
connect_covid19_DB();

//1 post
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const check_user_query = `SELECT * FROM user WHERE username="${username}";`;
  const find_user = await covid_DB.get(check_user_query);
  //console.log(find_user);
  if (find_user === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const verify_pass = await bcrypt.compare(password, find_user.password);
    //console.log(verify_pass);
    if (verify_pass === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "my_secret_token");
      //console.log({ j_token });
      response.send({ jwtToken });
    }
  }
});

const authenticate_middileware = (request, response, next) => {
  let jwt_token;
  const get_authen_token = request.headers["authorization"];
  //console.log(get_authen_token);
  if (get_authen_token !== undefined) {
    jwt_token = get_authen_token.split(" ")[1];
    console.log(jwt_token);
    if (jwt_token === undefined) {
      response.status(401);
      response.send("Invalid JWT Token");
    } else {
      jwt.verify(jwt_token, "my_secret_token", async (error, payload) => {
        if (error) {
          response.status(401);
          response.send("Invalid JWT Token");
        } else {
          next();
        }
      });
    }
  }
};

app.get("/states/", authenticate_middileware, async (request, response) => {
  const get_states_query = `SELECT * FROM state;`;
  const get_states = await covid_DB.all(get_states_query);
  console.log(get_states);
  response.send(get_states);
});
module.exports = app;
