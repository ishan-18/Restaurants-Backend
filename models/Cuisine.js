const mongoose = require('mongoose')
const {v4: uuidv4} = require('uuid')

const CuisineSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4()
    }, 
    name: {
        type: String,
        required: [true, "Please add a name"]
    },
    description: {
        type: String,
        required: [true, "Please add a description"],
        maxLength: 100
    },
    type: {
        type: String,
        enum: ['Vegetarian', 'Non-Vegetarian'],
        required: [true, "Please a food type"]
    },
    pictures: {
        type: [String],
        default: []
    },
    ingredients: {
        type: [String],
        default: []
    },
    spiceLevel: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },
    preparationTime: {
        type: Number,
        required: [true, "Please add a preparation time"]
    },
    isPopular: {
        type: Boolean,
        default: false,
        required: [true, "Please add a popular opinion"]
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Cuisine', CuisineSchema)
  