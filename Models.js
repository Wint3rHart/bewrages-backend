let {mongoose} = require('./Mongo_Connect');
let bcrypt = require('bcrypt');
let {ObjectId}=require("mongodb")

let bewrages_schema = new mongoose.Schema({ category: String, name: String, type: String, price: Number, availability: Boolean, rating: Number, origin: String, serving_size: String, ingredients: [String], reviews: [{ user: String, comment: String, rating: Number, id: { type: mongoose.Schema.Types.ObjectId, ref: "user" } }] });


let user_schema = new mongoose.Schema({ name: String, email: String, password: String, profilePic: String, role: String, refresh_token: {type:String,default:""}, orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "order" ,default:[]}], });

// orders:[{name:String,quantity:Number,id:{type:mongoose.Schema.Types.ObjectId,ref:"bewrages"}}],

let orders_schema = new mongoose.Schema({  bewrage_id: { type: mongoose.Schema.Types.ObjectId, ref: "bewrages" }, customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true }, order: String, flavour: String, delivery: String, quantity: Number, size: String, address: { type: String }, requests: String, status: { type: String, default: () => { return "Pending" } }, price: Number }, { timestamps: true });
user_schema.pre("save",async function(next){
   try{ let check=await this.constructor.findOne({name:this.name,email:this.email,role:this.role});
    if(check)return next( new Error("User already exists"));
    else{return next()}}
    catch(err){return next( err);}

})
user_schema.pre("save", async function (next) {

    if (this.isModified("password")) { this.password = await bcrypt.hash(this.password, 10) };
    
    

    next();
})


let bewrages_model = mongoose.model("bewrages", bewrages_schema, "drinks");
let user_model = mongoose.model("user", user_schema, "users");
let orders_model = mongoose.model("order", orders_schema, "orders");
module.exports = { bewrages_model, user_model, orders_model };