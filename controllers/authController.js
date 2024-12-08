const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Farmreg = require('../models/Farmreg');
const Workerreg = require('../models/Workerreg');
// Farmer Signup logic
exports.signup = async (req, res) => {
  try {
    const { name, email, phoneNo, password } = req.body;

    // Check if the user already exists
    const existingUser = await Farmreg.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new Farmreg({ name, email, phoneNo, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
};

// Farmer Login logic
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await Farmreg.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Compare the password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create and return a JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    console.log(token);
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
};

//Worker Signup Logic
exports.Workersignup = async(req,res) => {
  const { name, phoneNo, password } = req.body;

    try {
        // Validate input
        if (!name || !phoneNo || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Check if worker already exists
        const existingWorker = await Workerreg.findOne({ phoneNo });
        if (existingWorker) {
            return res.status(400).json({ message: 'Worker already registered with this phone number.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save the worker
        const newWorker = new Workerreg({
            name,
            phoneNo,
            password: hashedPassword,
        });

        await newWorker.save();

        res.status(201).json({ message: 'Worker registered successfully!' });
    } catch (error) {
        console.error('Error during worker signup:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
}
exports.Workerlogin = async(req,res) => {
  try {
    const { phoneNo, password } = req.body;

    // Check if user exists
    const user = await Workerreg.findOne({ phoneNo });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Compare the password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Password Invalid ' });
    }

    // Create and return a JWT token
    const token = jwt.sign({ id: user._id, phoneNo: user.phoneNo }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    console.log(token);
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
}

