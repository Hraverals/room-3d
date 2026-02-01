import mongoose, { Schema } from 'mongoose';

const ImageSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        index: true
    }
})

const Image = mongoose.model('Image', ImageSchema);
export default Image