    const Project = require('../models/Project');
    const User = require('../models/User');
    const upload = require('../config/multer-config');
    const userModel = require("../models/User");
    const projectModel = require("../models/Project");
    
    const Freelancer = require("../models/freelancer");
    const bcrypt = require("bcrypt");
    const multer = require('multer');

    const jwt = require("jsonwebtoken");

    module.exports.uploadpageController = async function (req, res) {
        res.render('uploadproject');
    };

    
    module.exports.uploadProjectController = async function (req, res) {
        try {
            // Ensure file and user are available
            if (!req.file) {
                return res.status(400).send('No file uploaded.');
            }
    
            // Check file size (5 MB limit)
            if (req.file.size > 5 * 1024 * 1024) { // 5 MB
                return res.status(400).send('File size exceeds the 5 MB limit.');
            }
    
            // Validate required fields
            const { title, description, category, assignedTo } = req.body;
            if (!title || !description) {
                return res.status(400).send('Title and description are required.');
            }
    
            // Validate category
            const validCategories = ['Web Development', 'Mobile Development', 'Data Science', 'Machine Learning', 'Others'];
            if (!validCategories.includes(category)) {
                return res.status(400).send('Invalid category.');
            }
    
            const user = req.user; // Ensure user is authenticated and req.user is set
            if (!user) {
                return res.status(401).send('User not authenticated.');
            }
    
            // Create a new project entry
            const newProject = new projectModel({
                title,
                description,
                pdf: req.file.buffer.toString("base64"), // Storing the PDF as a Base64 string
                user: user._id,
                category, // Add the category field
                assignedTo: assignedTo || null // Add the assignedTo field, default to null if not provided
            });
    
            await newProject.save();
    
            // Update the user with the new project ID
            await userModel.findByIdAndUpdate(user._id, {
                $push: { projects: newProject._id }
            });
    
            res.redirect("/user-profile");
    
        } catch (error) {
            console.error('Error uploading project:', error.message);
            res.status(500).send('Error uploading project: ' + error.message);
        }
    };
    
    

    module.exports.viewProjectController = async (req, res) => {
        try {
            const project = await Project.findById(req.params.id);
            if (!project) {
                return res.status(404).send('Project not found');
            }
            res.render('viewproject', { project });
        } catch (err) {
            console.error('Error retrieving project:', err.message);
            res.status(500).send('Server Error');
        }
    };

    module.exports.deleteProjectController = async (req, res) => {
        try {
            const { id } = req.params;
            await Project.findByIdAndDelete(id);
            res.redirect('/user-profile');
        } catch (error) {
            console.error(error);
            res.status(500).send("Server Error");
        }
    };
    exports.editProjectController = async (req, res) => {
        try {
            const { id } = req.params;
            const project = await Project.findById(id);
            if (!project) {
                return res.status(404).send("Project not found");
            }
    
            // Fetch all freelancers
            const freelancers = await Freelancer.find({}).select('name');
    
            // Render the edit project page with project data and freelancers list
            res.render('editProject', { project, freelancers });
        } catch (error) {
            console.error(error);
            res.status(500).send("Server Error");
        }
    };
    
    exports.updateProjectController = async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, category, assignedTo } = req.body;
    
            // Prepare data to update
            const updateData = {
                title,
                description,
                category,
                assignedTo: assignedTo || null, // Store name as string
            };
    
            // Check if a new PDF file is uploaded
            if (req.file) {
                if (req.file.size > 5 * 1024 * 1024) { // 5 MB limit
                    return res.status(400).send('File size exceeds the 5 MB limit.');
                }
                updateData.pdf = req.file.buffer.toString("base64");
            }
    
            // Update the project
            const project = await Project.findByIdAndUpdate(id, updateData, { new: true });
            if (!project) {
                return res.status(404).send("Project not found");
            }
    
            res.redirect('/user-profile');
        } catch (error) {
            console.error(error);
            res.status(500).send("Server Error");
        }
    };
    
    
    
