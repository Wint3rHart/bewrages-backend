let mongoose = require("mongoose");
try{
mongoose.connect(
  "mongodb+srv://hassan:mrhassan125@cluster0.is3nlcm.mongodb.net/bewragess?retryWrites=true&w=majority&appName=Cluster0"
)
  .then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));
}
catch(err){console.log(err);
}

let { createClient } = require("redis")

const redis = createClient({
    username: 'default',
    password: 'VYuMKiEz46cPbGwZVN8rn5ieTP2asW7y',
    socket: {
        host: 'redis-15607.c1.us-central1-2.gce.redns.redis-cloud.com',
        port: 15607
    }
});

(async () => {
    if (!redis.isOpen) {
        try {
            await redis.connect()
            console.log("redis connect");

        }
        catch (err) {
            console.log(err);
        }
    }
})();

redis.on("error", (err) => {
    console.log("redis error", err);
});
module.exports = {mongoose,redis};
