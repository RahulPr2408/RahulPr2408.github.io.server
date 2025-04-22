const mongoose = require('mongoose')

const mongo_url = process.env.MONGO_CONN

mongoose.connect(mongo_url).then(() => {
  console.log('MongoDB is Connected...')
}).catch((err) => {
  console.log('MongoDB Connection Error: ',err)
})

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

