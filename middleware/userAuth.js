const User = require('../model/user/userModel');

const isLogin = async (req,res,next)=>{
    try {
       if(req.session.userSession) {
        return next();

       }else{
        return res.redirect('/');

       }
    } catch (error) {
        console.log(error,'Error while Logging In');
        
    }
};


const isLogout = async (req,res,next)=>{
    try {
       if(!req.session.userSession) {
        return next();

       }else{
        return res.redirect('/');

       }
    } catch (error) {
        console.log(error,'Error while Logging In');
        
    }
};
module.exports = {
    isLogin,
    isLogout
}