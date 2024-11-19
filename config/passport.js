require('dotenv').config()
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');
const User = require('../model/user/userModel');


passport.use(new GoogleStrategy({
  clientID: '872090645959-etaqkri741ugi9qphtifi6oiecaanm9a.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: "https://www.ashiq.store/auth/google/callback",
  passReqToCallback: true
},
                async function(req, accessToken, refreshToken, profile, done) {
                try {

                  let user = await User.findOne({ email: profile.emails[0].value });

                  if(!user){
                    
                    user = new User ({
                            firstName: profile.displayName,
                            email: profile.emails[0].value,
                            is_valid: true,
                            is_block: false,
                            password: Math.random().toString(36).slice(-8)
                    });
                    await user.save();
                  }
                  
                  
                  
                  return done(null, user);

                } catch (error) {
                  return done(error,null);
         }
                  
         }
   ));




passport.serializeUser((user, done) => {
done(null, user);
});


passport.deserializeUser((obj, done) => {
done(null, obj);
});



module.exports = passport ;
