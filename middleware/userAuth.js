const User = require('../model/user/userModel');

const isLogin = async (req,res,next)=>{
    try {
        const user = await User.findById(req.session.userSession)
       if(req.session.userSession &&  user.isBlocked == false) {

       }else{
       delete req.session.userSession
        return res.redirect('/');

       }
       return next();
    } catch (error) {
        console.log(error,'Error while Logging In');
        
    }
};


const isLogout = async (req,res,next)=>{
    try {
        const user = await User.findById(req.session.userSession)
       if(req.session.userSession) {
        if( user.isBlocked == false){
            delete req.session.userSession
            return res.redirect('/')
        }
        else{
            return next();
        }
       }else{
        return next();

       }
    } catch (error) {
        console.log(error,'Error while Logging In');
        
    }
};
module.exports = {
    isLogin,
    isLogout
}