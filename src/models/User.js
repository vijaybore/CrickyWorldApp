import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        unique: true,
        sparse: true, // allows null for old users
    }
});

const User = mongoose.model('User', userSchema);
export default User;