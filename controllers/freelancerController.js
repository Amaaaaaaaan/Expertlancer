const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Freelancer = require('../models/freelancer');
const Job = require('../models/job');
const Project = require('../models/project');

const upload = require('../config/multer-config'); 

module.exports.homepageController = function (req, res) {
  res.render("index"); 
};

module.exports.loginfreelancerpageController = function (req, res) {
  res.render("login-freelancer"); 
};


module.exports.loginFreelancer = async function (req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const freelancer = await Freelancer.findOne({ email }).select('+password');
    if (!freelancer) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, freelancer.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: freelancer._id, username: freelancer.username },
      process.env.JWT_KEY
    );

    res.cookie('token', token, { httpOnly: true });
    res.redirect('/freelancerhome'); // Redirect to a dashboard or home page upon successful login
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
  }
};

module.exports.registerFreelancerPageController = function (req, res) {
  res.render("register-freelancer");
};



module.exports.registerFreelancer = async function (req, res) {
  let { username, name, email, password, description, skills } = req.body;
  try {
    // Check if the freelancer already exists
    let existingFreelancer = await Freelancer.findOne({ email });
    if (existingFreelancer) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash the password
    let salt = await bcrypt.genSalt(10);
    let hashedPassword = await bcrypt.hash(password, salt);

    // Handle image upload
    let imageUrl = "";
    if (req.file) {
      imageUrl = req.file.buffer.toString("base64"); // Convert image to Base64
    }

    // Create new freelancer
    let freelancer = await Freelancer.create({
      username,
      name,
      email,
      password: hashedPassword,
      description,
      skills,
      image: imageUrl, // Store Base64 image
    });

    // Create JWT token
    let token = jwt.sign(
      { id: freelancer._id, username: freelancer.username },
      process.env.JWT_KEY
    );

    // Set token in cookies and redirect
    res.cookie("token", token);
    res.redirect("/freelancerhome");
  } catch (err) {
    if (!res.headersSent) {
      return res.status(500).send(err.message);
    }
  }
};



module.exports.homeafterloginController = async function (req, res, next) {
    res.render('freelancerhome', { freelancer: req.freelancer });
}

module.exports.jobdisplayController = async function (req, res, next) {
  try {
    const jobs = await Job.find({}).select('-user'); // Retrieve jobs from database
    res.render('jobdisplay', { jobs }); // Pass jobs to the view
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
  }
}

module.exports.jobDetailsController = async function (req, res, next) {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.render('jobDetails', { job });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
  }
};





module.exports.applyNowPageController = async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        res.render('apply-now', { job });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
    }
};

module.exports.submitApplication = async (req, res) => {
  try {
      const jobId = req.params.id;
      const { coverLetter } = req.body;
      const resume = req.file; // Access the file from memory storage

      if (!coverLetter || !resume) {
          return res.status(400).json({ message: 'All fields are required' });
      }

      const job = await Job.findById(jobId);
      if (!job) {
          return res.status(404).json({ message: 'Job not found' });
      }

      const application = new Application({
          job: jobId,
          freelancer: req.user._id, // Use req.user._id for the freelancer ID
          coverLetter,
          resume: resume.buffer // Store file buffer securely
      });

      await application.save();

      res.redirect('/freelancerhome'); // Redirect after successful application
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
  }
};


module.exports.projectdisplayController = async function (req, res, next) {
  try {
    const projects = await Project.find({}).populate('user', 'username'); // Populate only username
    res.render('projectdisplay', { projects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
  }
};

module.exports.projectDetailsController = async function (req, res) {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId).populate('user', 'username');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.render('projectDetails', { project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
  }
};



module.exports.viewfreelancerprofileController = function(req, res) {
  const freelancer = req.freelancer;
  const image = freelancer.image ? `data:image/jpeg;base64,${freelancer.image}` : null;

  res.render('freelancer-profile', { 
    freelancer: { 
      ...freelancer,
      image: image, // Ensure this is included correctly
      skills: freelancer.skills, 
      name: freelancer.name,
      username: freelancer.username,
      description: freelancer.description,
      portfolio: freelancer.portfolio,
      location: freelancer.location,
      experience: freelancer.experience,
      projects: freelancer.projects
    }
  });
};



// Existing controller methods...

module.exports.editProfilePageController = async (req, res) => {
    try {
        const freelancer = await Freelancer.findById(req.freelancer._id);
        if (!freelancer) {
            return res.status(404).json({ message: 'Freelancer not found' });
        }
        res.render('edit-profile', { freelancer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
    }
};

module.exports.updateProfileController = async (req, res) => {
    try {
        const { username, name, email, description, skills } = req.body;
        const image = req.file ? req.file.buffer.toString('base64') : null; // Handle image upload

        const freelancer = await Freelancer.findByIdAndUpdate(
            req.freelancer._id,
            {
                username,
                name,
                email,
                description,
                skills, // Convert skills to array
            
                image
            },
            { new: true } // Return the updated freelancer
        );

        if (!freelancer) {
            return res.status(404).json({ message: 'Freelancer not found' });
        }

        res.redirect('/freelancer-profile');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
    }
};

