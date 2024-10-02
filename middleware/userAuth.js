const User = require('../model/user/userModel');

const isLogin = async (req,res,next)=>{
    try {
       if(req.session.user_id) {
        
       }else{
        return res.redirect('/');
       }
       return next();
    } catch (error) {
        console.log(error,'Error while Logging In');
        
    }
};

module.exports = {
    isLogin
}