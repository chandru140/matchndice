import userModel from "../models/userModel.js";
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
        
        const user = await userModel.findOne({email})
        if(!user){
            return res.json({success:false, message:"User does not exist"});
        }
        
        const isMatch = await bcrypt.compare(password , user.password)

        if(isMatch){
            const token = createToken(user._id)
            res.json({success:true , message:"User logged in successfully" , user , token})
        }else{
            res.json({success:false, message:"Invalid credentials"});
        }

    }catch(error){
        next(error);
    }
}

//Route for user register
const registerUser = async (req,res, next) => {
    try {
       const {name , email , password} = req.body 
       
       //checking user already exists or not
       const exists = await userModel.findOne({email})
       if(exists){
        return res.json({success:false, message:"User already exists"});
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

          // Create proper JWT with role and expiration  
          const token = jwt.sign(
              { email, role: 'admin' }, 
              process.env.JWT_SECRET,
              { expiresIn: '1d' }
          )
          res.json({success:true , msg:"Admin logged in successfully" , token})

       }else{
        res.json({success:false, message:"Invalid admin credentials"});
    }

    } catch (error) {
        next(error);
    }
}

export {loginUser , registerUser , adminLogin}
