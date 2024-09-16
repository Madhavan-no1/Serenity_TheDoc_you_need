import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt, { hash } from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";




const app = express();
const port = 3000;
const saltRounds = 10;
env.config();

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie : {
      maxAge : 1000 * 60 * 60 * 24 * 30
    }
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();


app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/loginpatient", (req, res) => {
  res.render("loginPatient.ejs");
});
app.get("/logindoctor", (req, res) => {
  res.render("loginDoctor.ejs");
});
app.get("/registerdoctor", (req, res) => {
  res.render("registerDoctor.ejs");
});
app.get("/registerpatient", (req, res) => {
  res.render("registerPatient.ejs");
});
app.get("/forgotpassdoctor",(req,res)=>{
  res.render("forgotPassDoctor.ejs");
});
app.get("/forgotpasspatient",(req,res)=>{
  res.render("forgotPassPatient.ejs");
});
app.get("/createpassdoctor",(req,res)=>{
  res.render("createPassDoctor.ejs");
});
app.get("/createpasspatient",(req,res)=>{
  res.render("createPassPatient.ejs");
});


app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});
app.get("/secretsDoc", (req, res) => {
  console.log(req.user);
  if (req.isAuthenticated()) {
    res.render("DoctorHome.ejs");
  } else {
    res.redirect("/");
  }
});
app.get("/secretsPat", (req, res) => {
  console.log(req.user);
  if (req.isAuthenticated()) {
    res.render("PatientHome.ejs");
  } else {
    res.redirect("/");
  }
});

app.get('/getotp', (req, res) => {
  const otp = Math.floor(Math.random() * 10000); 
  const email = req.query.email;  

  console.log('Generated OTP:', otp);

  
  res.json({ otp: otp });
});
app.post("/forgotpassdoctor",async (req,res)=>{
 
  const { username: email, otp } = req.body;  
  console.log(email);
  const checkResult = await db.query("SELECT * FROM docusers WHERE email = $1", [
    email,
  ]);
  if(checkResult.rows.length > 0){
    db.query("INSERT INTO forgotpass (email) VALUES ($1)",
      [email]
    );
    res.redirect("/createpassdoctor");
  }
  else{
    res.send("you are new user so kindly do register");
    
  }
});

app.post("/forgotpasspatient",async (req,res)=>{
 
  const { username: email, otp } = req.body;  
  console.log(email);
  const checkResult = await db.query("SELECT * FROM patusers WHERE email = $1", [
    email,
  ]);
  if(checkResult.rows.length > 0){
    db.query("INSERT INTO forgotpass (email) VALUES ($1)",
      [email]
    );
    res.redirect("/createpasspatient");
  }
  else{
    res.send("you are new user so kindly do register");
  }
});
app.post("/createpassdoctor", async(req,res)=>{
  const newPass = req.body.newpassword;
  console.log(newPass);
  const result = await db.query("SELECT * FROM forgotpass");
  const userRes = result.rows[0];
  const email = userRes.email;
  try{
    const stored = await 
    bcrypt.hash(newPass,saltRounds ,(err,hash)=>{
      if(err){
        console.log(err);
      }else{

        db.query("UPDATE docusers SET password = $1 WHERE email = $2",[
          hash,email
        ]);
        db.query("TRUNCATE TABLE forgotpass");
        res.redirect("/logindoctor");
      }
    });
    
    
  }catch(err){
    console.log(err);
  }
});
app.post("/createpasspatient", async (req,res)=>{
  const newPass = req.body.newpassword;
  console.log(newPass);
  const result = await db.query("SELECT * FROM forgotpass");
  const userRes = result.rows[0];
  const email = userRes.email;
  try{
    bcrypt.hash(newPass,saltRounds ,(err,hash)=>{
      if(err){
        console.log(err);
      }else{
        db.query("UPDATE patusers SET password = $1 WHERE email = $2",[
          hash,email
        ]);
        db.query("TRUNCATE TABLE forgotpass");
        res.redirect("/loginpatient");
      }
    });
    
  }catch(err){
    console.log(err);
  }
})
app.get(
  "/auth/google/doctor",
  passport.authenticate("googleDoc", {
    scope: ["profile", "email"],
  })
);
app.get(
  "/auth/google/patient",
  passport.authenticate("googlePat", {
    scope: ["profile", "email"]
  })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("googleDoc", {
    successRedirect: "/secretsDoc",
    failureRedirect: "/logindoctor",
  })
  
);
app.get(
  "/auth/google/patients",
  passport.authenticate("googlePat", {
    successRedirect: "/secretsPat",
    failureRedirect: "/loginpatient",
  }),
  
);
app.post(
  "/logindoctor",
  passport.authenticate("localDoc", {
    successRedirect : "/secretsDoc",
    failureRedirect: "/logindoctor",  
  }),
  
);
app.post(
  "/loginpatient",
  passport.authenticate("localPat", {
    successRedirect: "/secretsPat",
    failureRedirect: "/loginpatient",
    
  }),
  
);

app.post("/registerdoctor", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;
  const displayName = req.body.name;


  try {
    const checkResult = await db.query("SELECT * FROM docusers WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      res.redirect("/logindoctor");
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          const result = await db.query(
            "INSERT INTO docusers (email, password, name) VALUES ($1, $2, $3) RETURNING *",
            [email, hash, displayName]
          );
          const user = result.rows[0];
          req.login(user, (err) => {
            console.log("success");
            res.render("DoctorHome.ejs",{
              doctorData : user.name
            });
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/registerpatient", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;
  const displayName = req.body.name;

  try {
    const checkResult = await db.query("SELECT * FROM patusers WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      res.redirect("/loginpatient");
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          const result = await db.query(
            "INSERT INTO patusers (email, password, name) VALUES ($1, $2, $3) RETURNING *",
            [email, hash, displayName]
          );
          const user = result.rows[0];
          req.login(user, (err) => {
            console.log("success");
            res.render("PatientHome.ejs",{
              doctorData : user.name
            });
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

passport.use(
  "localDoc",
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM docusers WHERE email = $1 ", [
        username,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              return cb(null, user);
            } else {
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found");
      }
    } catch (err) {
      console.log(err);
    }
  })
);
passport.use(
  "localPat",
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM patusers WHERE email = $1 ", [
        username,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              return cb(null, user);
            } else {
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found");
      }
    } catch (err) {
      console.log(err);
    }
  })
);
// For "googlePat"
passport.use(
  "googleDoc",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        console.log(profile);
        const result = await db.query("SELECT * FROM docusers WHERE email = $1", [
          profile.email,
        ]);
        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO docusers (email, password) VALUES ($1, $2)",
            [profile.email, "google"]
          );
          return cb(null, newUser.rows[0]);
        } else {
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);passport.use(
  "googlePat",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID_PAT,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET_PAT,
      callbackURL: "http://localhost:3000/auth/google/patients",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        console.log(profile);
        const result = await db.query("SELECT * FROM patusers WHERE email = $1", [
          profile.email,
        ]);
        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO patusers (email, password) VALUES ($1, $2)",
            [profile.email, "google"]
          );
          return cb(null, newUser.rows[0]);
        } else {
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);
passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
