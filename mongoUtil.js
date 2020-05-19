const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017";

let _db;

module.exports = {
    connectToServer: function(database) {
        MongoClient.connect(url,  { useUnifiedTopology: true }, (err, client) => {
            _db = client.db(database);
            console.log('Connected to MongoDB');
        });
    },
    
    getDb: () => {
        return _db;
    }
};