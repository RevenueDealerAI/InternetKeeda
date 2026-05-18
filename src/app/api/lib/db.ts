import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-hunt';

mongoose.set('strictQuery', false);

const originalWarn = console.warn;
console.warn = function(...args: any[]) {
  const message = args[0]?.toString() || '';
  if (message.includes('Duplicate schema index')) {
    return;
  }
  originalWarn.apply(console, args);
};

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDB() {
    try {
        if (mongoose.connection.readyState === 1) {
            return;
        }
        
        if (connectionPromise) {
            await connectionPromise;
            return;
        }
        
        const isSrv = MONGODB_URI.includes('mongodb+srv://');
        const isAtlasStandard = MONGODB_URI.includes('mongodb.net') && !isSrv;
        
        const connectionOptions: mongoose.ConnectOptions = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
        };

        if (isSrv) {
            connectionOptions.retryWrites = true;
            connectionOptions.retryReads = true;
        } else if (isAtlasStandard) {
            connectionOptions.tls = true;
            connectionOptions.tlsAllowInvalidCertificates = false;
            connectionOptions.tlsAllowInvalidHostnames = false;
            connectionOptions.retryWrites = true;
            connectionOptions.retryReads = true;
        }

        connectionPromise = mongoose.connect(MONGODB_URI, connectionOptions);
        
        await connectionPromise;
        connectionPromise = null;
        
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
            connectionPromise = null;
        }); 
        
        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
            connectionPromise = null;
        });
        
    } catch (error) {
        connectionPromise = null;
        console.error('MongoDB Connection Error:', error);
        throw error;
    }
}

