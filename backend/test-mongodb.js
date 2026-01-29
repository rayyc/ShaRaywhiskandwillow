require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Testing MongoDB Atlas Connection...\n');

const testConnection = async () => {
    try {
        console.log('Connecting to cluster0raywanjie...');
        
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('✅ SUCCESS! Connected to MongoDB Atlas');
        console.log('✅ Cluster: cluster0raywanjie.xhcnzzp.mongodb.net');
        console.log('✅ Database: sharay-bakery');
        console.log('✅ User: rayw68449_db_user\n');
        
        // Test creating a document
        console.log('Testing database write...');
        const TestSchema = new mongoose.Schema({
            message: String,
            timestamp: Date
        });
        
        const Test = mongoose.model('Test', TestSchema);
        
        const testDoc = new Test({
            message: 'Hello from ShaRay Whisk&Willow!',
            timestamp: new Date()
        });
        
        await testDoc.save();
        console.log('✅ Test document created successfully!\n');
        
        // Clean up
        await Test.deleteMany({});
        console.log('✅ Test document cleaned up');
        
        await mongoose.connection.close();
        console.log('✅ Connection closed\n');
        console.log('🎉 MongoDB is ready to use!');
        
    } catch (error) {
        console.error('❌ CONNECTION FAILED\n');
        console.error('Error:', error.message);
        console.error('\n📝 Troubleshooting:');
        console.error('1. Check your .env file exists in backend folder');
        console.error('2. Verify MONGODB_URI is correct');
        console.error('3. Ensure IP 0.0.0.0/0 is whitelisted in MongoDB Atlas');
        console.error('4. Wait 2-3 minutes if you just created the user');
    }
};

testConnection();