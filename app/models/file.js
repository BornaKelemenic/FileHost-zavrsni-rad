const mongoose   = require("mongoose");
const Schema     = mongoose.Schema;

// File schema
let fileSchema = new Schema({
    name:         {type: String, required: true},
    username:     {type: String, required: true, default: "Anonymous"},
    fileLocation: {type: String, required: true, unique: true},
    createdAt:    {type: Date, default: Date.now}
});

// Middleware to ensure date is added before saving file to database
fileSchema.pre('save', function(next)
{
    if (!this.createdAt)
    {
        this.createdAt = new Date();
    }
    next();
});

module.exports = mongoose.model("File", fileSchema);