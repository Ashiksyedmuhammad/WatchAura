const Admin  = require('../model/admin/adminModel');

const isLogin = async(req,res,next)=>{
    try {
        if( req.session.admin){
           

        }else{
            return res.redirect('/admin');
        }
        return next();
    } catch (error) {
        console.log(error,"Error While Loging In ");
        
    }

};

const isLogout = async (req,res,next)=>{
    try {
        if(req.session.admin){
            return res.redirect('/admin/dashboard')

         
        }
        return next();

    } catch (error) {
        console.log(error,'Error while Loging Out');
        
    }
};

module.exports = {
    isLogin,
    isLogout
}