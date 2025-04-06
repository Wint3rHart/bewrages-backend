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
module.exports = mongoose;
