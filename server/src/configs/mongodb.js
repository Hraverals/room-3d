import mongoose from 'mongoose';

export default () => {
    const MONGO_URL = process.env.MONGO_URL;
    async function connectMongo() {
        try {
            await mongoose.connect(MONGO_URL);
            console.log('mongo connection success!!');
        } catch (error) {
            console.log('mongo connection fail..');
            console.log(error);
        }
    }
    connectMongo();
}