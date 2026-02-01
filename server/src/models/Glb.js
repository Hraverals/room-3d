import mongoose, { Schema } from 'mongoose';

const GlbSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        index: true
    }
})

const Glb = mongoose.model('Glb', GlbSchema);
export default Glb