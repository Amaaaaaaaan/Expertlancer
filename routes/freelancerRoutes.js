const express = require('express');
const router = express.Router();
const upload = require('../config/multer-config'); // Adjust path as needed

const {
    homepageController,
    loginfreelancerpageController,
    loginFreelancer,
    registerFreelancerPageController,
    registerFreelancer,
    homeafterloginController,
    jobdisplayController,
    jobDetailsController, 
    applyNowPageController, 
    submitApplication,
    projectdisplayController,
    projectDetailsController,
    viewfreelancerprofileController,
    editProfilePageController, // New route handler
    updateProfileController,
    skillgapController,
    getinsuranceController,
    assignedprojectsController,
    legalsupportController
} = require('../controllers/freelancerController');

const {
    isFreelancerLoggedIn,
    redirectIfFreelancerLoggedIn
} = require('../middlewares/freelancerMiddleware');

// Existing routes...
router.get("/", redirectIfFreelancerLoggedIn, homepageController);
router.get('/login-freelancer', redirectIfFreelancerLoggedIn, loginfreelancerpageController);
router.post('/login-freelancer', redirectIfFreelancerLoggedIn, async (req, res) => {
    try {
        await loginFreelancer(req, res);
    } catch (error) {
        res.redirect(`/login-freelancer?error=${encodeURIComponent(error.message)}`);
    }
});
router.get('/register-freelancer', redirectIfFreelancerLoggedIn, registerFreelancerPageController);
router.post('/register-freelancer', upload.single('image'), async (req, res) => {
    try {
        await registerFreelancer(req, res);
    } catch (error) {
        res.redirect(`/register-freelancer?error=${encodeURIComponent(error.message)}`);
    }
});
router.get('/freelancerhome', isFreelancerLoggedIn, homeafterloginController);
router.get('/freelancer-profile', isFreelancerLoggedIn, viewfreelancerprofileController);

// New routes for editing and updating profiles
router.get('/edit-profile', isFreelancerLoggedIn, editProfilePageController);
router.post('/edit-profile', isFreelancerLoggedIn, upload.single('image'), updateProfileController);

// Job display and details routes
router.get('/jobdisplay', isFreelancerLoggedIn, jobdisplayController);
router.get('/job/:id', isFreelancerLoggedIn, jobDetailsController);
router.get('/apply/:id', isFreelancerLoggedIn, applyNowPageController);
router.post('/apply/:id', isFreelancerLoggedIn, upload.single('resume'), submitApplication);

// Project display routes
router.get('/projectdisplay', isFreelancerLoggedIn, projectdisplayController);
router.get('/project/:id', isFreelancerLoggedIn, projectDetailsController);

router.get('/skillgap', isFreelancerLoggedIn, skillgapController);
router.get('/get-insurance', isFreelancerLoggedIn,getinsuranceController);

router.get('/assigned-projects', isFreelancerLoggedIn,assignedprojectsController)

router.get('/legaladvice',legalsupportController)

module.exports = router;
