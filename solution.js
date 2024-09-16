import express from 'express';
import bodyParser from "body-parser";
import cors from 'cors';

const app = express();
const port = 5000;

app.use(cors({
  origin: 'http://localhost:3000',  // Allow requests from the front-end server
  credentials: true,
  
}));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/secret", (req, res) => {
  res.render("secrets.ejs");
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
