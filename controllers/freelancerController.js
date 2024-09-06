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
  let { username, name, email, password,specialization, description, skills } = req.body;
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
      specialization,
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
  const freelancer = req.freelancer;
  const image = freelancer.image ? `data:image/jpeg;base64,${freelancer.image}` : null;

  res.render('freelancerhome', {
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

    // Find the project by ID and populate the 'user' field with both username and _id (user_id)
    const project = await Project.findById(projectId)
      .populate('user', '_id username email'); // Populate both _id (user_id) and username from the User model

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Pass the project and freelancer data to the view
    res.render('projectDetails', { project, freelancer: req.freelancer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
  }
};





module.exports.viewfreelancerprofileController = function (req, res) {
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
    const { username, name, email,specialization, description, skills } = req.body;
    

    const freelancer = await Freelancer.findByIdAndUpdate(
      req.freelancer._id,
      {
        username,
        name,
        email,
        description,
        skills, // Convert skills to array
        specialization
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


module.exports.skillgapController = async function (req, res, next) {
  try {
    const freelancer = req.freelancer;

    // Define skills categories
    const skillCategories = {
      'Frontend Development': [
        'JavaScript', 'HTML', 'CSS', 'React', 'Vue.js', 'Angular', 'Sass', 'Less', 'WebAssembly'
      ],
      'Backend Development': [
        'Python', 'Java', 'C++', 'PHP', 'Ruby', 'Node.js', 'MongoDB', 'MySQL', 'PostgreSQL', 'Redis',
        'Docker', 'Kubernetes', 'AWS', 'Azure', 'CI/CD', 'Jenkins', 'Terraform', 'Ansible', 'Puppet', 'Chef'
      ],
      'Android Development': [
        'Java', 'Kotlin', 'Android Studio', 'Swift', 'Objective-C'
      ],
      'Game Development': [
        'Unity', 'Unreal Engine', '3D Modeling', 'Animation'
      ],
      
      
      'Design': [
        'UI/UX Design', 'Adobe Photoshop', 'Adobe Illustrator', 'Adobe XD', 'Figma', 'Sketch', 'Wireframing',
        'Prototyping', 'User Research', 'A/B Testing'
      ],
      'Data Science': [
        'Machine Learning', 'Data Analysis', 'TensorFlow', 'PyTorch', 'Natural Language Processing', 'Computer Vision'
      ],
      
      'DevOps & Tools': [
        'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Visual Studio Code', 'Eclipse', 'IntelliJ IDEA', 'Xcode', 'Android Studio',
        'Nginx', 'Apache', 'Laravel', 'Symfony', 'WordPress', 'SEO', 'WebSockets', 'Blockchain', 'Big Data', 'Hadoop', 'Spark',
        'Agile', 'Scrum', 'JIRA', 'Confluence'
      ]
    };

    // Ensure freelancer.skills is a string and split into an array if it's not already an array
    const currentSkillsString = Array.isArray(freelancer.skills) ? freelancer.skills.join(', ') : freelancer.skills;
    const currentSkillsArray = currentSkillsString.split(',').map(skill => skill.trim().toLowerCase());

    // Normalize skills to lowercase for case-insensitive comparison
    const normalizedSkillCategories = Object.fromEntries(
      Object.entries(skillCategories).map(([category, skills]) => [
        category,
        skills.map(skill => skill.toLowerCase())
      ])
    );

    // Determine suggested skills by filtering out skills that the freelancer already has
    const suggestedSkills = Object.fromEntries(
      Object.entries(normalizedSkillCategories).map(([category, skills]) => [
        category,
        skills.filter(skill => !currentSkillsArray.includes(skill))
          .map(skill => skill.charAt(0).toUpperCase() + skill.slice(1))
      ])
    );

    // Render the skillgap view with current skills and suggested skills
    res.render('skillgap', {
      freelancer: {
        ...freelancer._doc, // Ensure you pass the raw document if using Mongoose
        skills: currentSkillsArray.map(skill => skill.charAt(0).toUpperCase() + skill.slice(1)), // Capitalize first letter for display
        suggestedSkills: suggestedSkills // Object with suggested skills categorized
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports.getinsuranceController = async function (req, res, next) {
  res.render('get-insurance')
}




module.exports.assignedprojectsController = async function (req, res, next) {
  try {
    if (!req.freelancer) {
      return res.redirect('/');
    }

    const freelancerName = req.freelancer.name;

    // Fetch all projects with populated user data
    const allProjects = await Project.find({})
      .populate('user', 'name') // Populate user field with only the username
      .exec();

    // Filter projects where assignedTo matches the freelancer's name
    const projects = allProjects.filter(project => project.assignedTo === freelancerName);

    

    res.render('assigned-projects', { projects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
  }
}

module.exports.legalsupportController = function (req, res){
  res.render('legaladvice')
}
