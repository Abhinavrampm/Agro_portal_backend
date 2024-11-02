const mongoose = require('mongoose');

//define the user schema
const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
    },
    phoneNo: {
        type: String,
        required: true,
        match: /^[0-9]{10}$/, //ensures only 10 digits
    },
    password: {
        type: String,
        required: true,
    },
});

const Farmreg = mongoose.model('Farmreg',userSchema);
module.exports = Farmreg;