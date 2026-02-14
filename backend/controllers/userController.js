import userModel from "../models/userModel.js";
import validator from "validator";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const createToken = (id) => {
    return jwt.sign({id} , 
    process.env.JWT_SECRET , 
    {expiresIn : "1d"})
}


//Route for user login 
const loginUser = async (req,res, next) => {
    try{
        const {email , password } = req.body
        
        if(!email || !password){
            res.status(400);
            throw new Error("Please provide both email and password");
        }

        const user = await userModel.findOne({email})
        if(!user){
            res.status(400);
            throw new Error("User does not exist");
        }
        
        const isMatch = await bcrypt.compare(password , user.password)

        if(isMatch){
            const token = createToken(user._id)
            res.json({success:true , message:"User logged in successfully" , user , token})
        }else{
            res.status(401);
            throw new Error("Invalid credentials");
        }

    }catch(error){
        next(error);
    }
}

//Route for user register
const registerUser = async (req,res, next) => {
    try {
       const {name , email , password} = req.body 
       
       if(!name || !email || !password){
            res.status(400);
            throw new Error("Please provide name, email, and password");
       }

       //checking user already exists or not
       const exists = await userModel.findOne({email})
       if(exists){
        res.status(400);
        throw new Error("User already exists");
       }

       //validating email fromat and strong password
       if(!validator.isEmail(email)){
        res.status(400);
        throw new Error("Invalid email format");
       }

       if(password.length < 8 ){
         res.status(400);
         throw new Error("Password must be at least 8 characters long");
       }

       //hashing user password
       const salt = await bcrypt.genSalt(10)
       const hashedPassword = await bcrypt.hash(password , salt)

       //creating user
       const newuser = new userModel({
        name , 
        email , 
        password : hashedPassword
       })

       const user = await newuser.save()
       const token = createToken(user._id)

       res.json({success:true , message:"User registered successfully" , user , token})

    } catch (error) {
      next(error); 
    }   
}

//Route for admin login
const adminLogin = async (req,res, next) => {
    try {
        const {email , password} = req.body
        
       if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){

          const token = jwt.sign(email + password , process.env.JWT_SECRET)
          res.json({success:true , msg:"Admin logged in successfully" , token})

       }else{
        res.status(401);
        throw new Error("Invalid admin credentials");
    }

    } catch (error) {
        next(error);
    }
}

export {loginUser , registerUser , adminLogin}
