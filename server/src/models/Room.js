import mongoose, { Schema } from 'mongoose';

const RoomSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    urlid: {
        type: String,
        required: true,
        unique: true,
        index: true  
    },
    description: {
        type: String, 
        required: true
    },
    images: {
        type: [
            {
                type: Schema.ObjectId,
                ref: 'Image'
            }
        ], 
        required: true
    },
    glb: {
        type: Schema.ObjectId,
        ref: 'Glb'
    }
}, { timestamps: true })

RoomSchema.index({ createdAt: -1 });
const Room = mongoose.model('Room', RoomSchema);
export default Room