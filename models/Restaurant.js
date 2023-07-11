const mongoose = require('mongoose');
const {v4: uuidv4} = require('uuid')

const RestaurantSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4()
    }, 
    name: {
      type: String,
      required: [true, "Please add a name"]
    },
    branch: {
        type: String,
        required: [true, "Please add a branch"]
    },
    address: {
      type: String,
      required: [true, "Please Add an address"],
      maxLength: [100, "Please add atmost 100 characters"]
    },
    phone: {
      type: String,
      required: [true, "Please add a phone number"],
      match: [/^[+]?\d{1,3}-?\d{10}$/, "Please add a valid phone number"]
    },
    pictures: {
      type: [String],
      default: []
    },
    title: {
      type: String,
      required: [true, "Please add a catchy title"],
      minLength: [3, "Please add atleast 3 characters"],
      maxLength: [30, "Please add atmost 30 characters"]
    },
    subtitle: {
      type: String,
      required: [true, "Please add a catchy phrase"],
      minLength: [3, "Please add atleast 3 characters"],
      maxLength: [50, "Please add atmost 50 characters"]
    },
    availability: {
      type: Boolean,
      default: true
    },
    cuisines: [{
      type: String,
      ref: 'Cuisine'
    }],
    user: {
      type: String,
      ref: 'User',
    }
}, {
    timestamps: true   
});

module.exports = mongoose.model('Restaurant', RestaurantSchema)