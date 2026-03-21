import express from "express";
import AuthRoutes from "./routes/AuthRoutes.js";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";

dotenv.config()

const PORT = process.env.PORT || 3000
const app = express()
app.use(express.json())

connectDB();

app.use('/Auth',AuthRoutes)


app.get('/',(req,res)=>{
    res.send("this is a testr ")
    console.log("test")
});


app.listen(PORT,()=>{
    console.log("Server has started and listening on port: ",PORT)
})
