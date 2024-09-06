// routes/userRoutes.js

const express = require("express");
const router = express.Router();
const upload = require('../config/multer-config');

const {
    homepageController,
    loginuserpageController,
    loginuserController,
    registeruserpageController,
    registeruserController,
    logoutController,
    userprofileController,
    uploadprojectController, 
    homepageafterloginController,
    showfreelancerprofileController
} = require("../controllers/userController");

const { isloggedin, redirectifloggedin } = require("../middlewares/auth-middleware");

// Route for homepage (without login functionality)
router.get("/", homepageController);

// Route for user home after login
router.get("/userhome", isloggedin, homepageafterloginController);

// Route for user registration
router.get("/register-user", registeruserpageController);

// Route for user login page
router.get("/login-user", loginuserpageController);

// Route for logging out
router.get("/logout", logoutController);

// Route for user profile (after login)
router.get("/user-profile", isloggedin, userprofileController);

// Route for showing freelancer profiles
router.get('/showfreelancerprofiles', isloggedin, showfreelancerprofileController);

// Route for handling user registration submission
router.post("/register-user", upload.single('image'), registeruserController);

// Route for handling user login submission
router.post("/login-user", loginuserController);

module.exports = router;
