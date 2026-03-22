import mongoose from "mongoose";

export const connectDB = async () =>{
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("MongoDB connected")
    }catch (error){
        console.error("Not able to connect to the server because :",error);
        process.exit(1) // 1 - exit with failure , 0 exit with success
    }
}