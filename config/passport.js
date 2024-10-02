const express = require("express");
const app = express();
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');
const User = require('../model/user/userModel');

// app.use(passport.initialize());
// app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: '872090645959-etaqkri741ugi9qphtifi6oiecaanm9a.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: "http://localhost:3001/auth/google/callback",
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



// Serialize user into the session
passport.serializeUser((user, done) => {
done(null, user);
});

// Deserialize user out of the session
passport.deserializeUser((obj, done) => {
done(null, obj);
});


// // Routes
// app.get('/', (req, res) => {
//   res.send('<a href="/auth/google">Authenticate with Google</a>');
// });

// app.get('/auth/google',
//   passport.authenticate('google', { scope: ['profile', 'email'] }));

// app.get('/auth/google/callback',
//   passport.authenticate('google', { failureRedirect: '/' }),
//   (req, res) => {
//     // Successful authentication, redirect home.
//     res.redirect('/');
//   });



module.exports = passport ;
