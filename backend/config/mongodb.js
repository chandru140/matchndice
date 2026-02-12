import mongoose from "mongoose";

const connectDB = async () => {
    try {

        mongoose.connection.on("open" , () => {
            console.log("MongoDB connected mongo atlas server");
        })
        
        await mongoose.connect(process.env.MONGODB_URI);
    } catch (error) {
        console.log(error);
    }
}

export default connectDB;