const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user");
const Freelancer = require("../models/freelancer");

module.exports.homepageController = function (req, res) {
  res.render("index"); 
};

module.exports.homepageafterloginController = async function (req, res, next) {
  try {
    const user = req.user;  // Assuming user is attached to the request object

    // Convert image to base64 format if it exists
    const image = user.image ? `data:image/jpeg;base64,${user.image}` : null;

    res.render('userhome', {
      user: {
        ...user.toObject(),  // Convert Mongoose document to plain object
        image: image,
        name: user.name,
        username: user.username,

      }
    });
  } catch (error) {
    next(error);  // Pass errors to the error handling middleware
  }
};

module.exports.registeruserpageController = function (req, res) {
  res.render("register-user", { loggedin: false });
};

module.exports.loginuserpageController = function (req, res) {
  res.render("login-user", { loggedin: false }); // Render the login page when accessed
};

module.exports.registeruserController = async function (req, res) {
  let { name, username, email, password } = req.body;
  try {
    let user = await userModel.findOne({ email });
    if (user) {
      return res.send("You already have an account, please login");
    }

    let salt = await bcrypt.genSalt(10);
    let hashed = await bcrypt.hash(password, salt);

    let imageUrl = "";
    if (req.file) {
      imageUrl = req.file.buffer.toString("base64");
    }

    user = await userModel.create({
      name,
      username,
      email,
      password: hashed,
      image: imageUrl,
    });

    let token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_KEY
    );
    res.cookie("token", token);
    res.redirect("/userhome");
  } catch (err) {
    if (!res.headersSent) {
      return res.status(500).send(err.message);
    }
  }
};

module.exports.loginuserController = async function (req, res) {
  let { email, password } = req.body;
  try {
    let user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return res.send("User not found");
    }

    let result = await bcrypt.compare(password, user.password);
    if (!result) {
      return res.send("Incorrect password");
    }

    let token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_KEY
    );
    res.cookie("token", token);
    res.redirect("/userhome");
  } catch (err) {
    if (!res.headersSent) {
      return res.status(500).send(err.message);
    }
  }
};




module.exports.userprofileController = async function (req, res) {
  try {
    // Fetch the user data along with populated projects and jobs
    let user = await userModel.findOne({ email: req.user.email })
      .populate('projects')
      .populate('jobs');

    // Fetch all freelancer names
    let freelancers = await Freelancer.find({}).select('name');

    // Render the user profile page with user data and freelancers list
    res.render('user-profile', { user, freelancers });
  } catch (err) {
    if (!res.headersSent) {
      return res.status(500).send(err.message);
    }
  }
};
module.exports.logoutController = function (req, res) {
  res.clearCookie("token");
  res.redirect("/");
};

module.exports.uploadprojectController = function (req, res) {
  res.render("upload");
};






module.exports.showfreelancerprofileController = async function (req, res) {
  try {
      const freelancers = await Freelancer.find(); // Fetch all freelancers

      // Convert image buffer to base64 string
      const formattedFreelancers = freelancers.map(freelancer => {
          return {
              ...freelancer.toObject(),
              image: freelancer.image ? `data:image/png;base64,${freelancer.image.toString('base64')}` : null
          };
      });

      res.render('showfreelancerprofiles', { freelancers: formattedFreelancers }); // Render EJS template with freelancers data
  } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
  }
};
