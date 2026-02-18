import jwt from "jsonwebtoken"

const adminAuth = async (req , res , next) => {
    try{
        const {token} = req.headers
        if(!token){
            return res.json({success:false , message:"Not Authorized login again "})
        }
        const token_decode = jwt.verify(token , process.env.JWT_SECRET);

        // Verify it's an admin token with proper structure
        if(token_decode.role !== 'admin'){
            return res.json({success:false , message:"Not Authorized - Admin access required"})
        }

        next()
    }catch(error){
        // Token expired or invalid
        if(error.name === 'TokenExpiredError'){
            return res.json({success:false ,message: "Session expired. Please login again"})
        }
        res.json({success:false , message : "Not Authorized login again"})
    }
} 

export default adminAuth
