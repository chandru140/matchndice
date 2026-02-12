import jwt from "jsonwebtoken";

const authUser = async (req,res,next) => {
   const { token } = req.headers;

   if(!token){
    return res.status(401).json({success:false, message:"Not Authorized. Login Again"})
   }

   try{
    const decoded = jwt.verify(token,process.env.JWT_SECRET)
    req.body = req.body || {};  // Initialize req.body if undefined (for GET requests)
    req.body.userId = decoded.id
    next()
   }catch(error){
    console.log(error)
    return res.status(401).json({success:false, message:"Not Authorized. Login Again"})
   }
}

export default authUser
