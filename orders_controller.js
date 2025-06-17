
let { bewrages_model, user_model } = require('./Models');
let { v4: uuidv4 } = require("uuid");
let {redis}=require("./Mongo_Connect")
const order_cache=async (req, res, next) => {
    try {console.log("Orders cache running");
    
        let get = await redis.get(`order-${req.params.id}`);

        if (get) {

            console.log("sending from cache"); res.status(200).send(JSON.parse(get))
        }
        else {
            console.log("not in cache"); next()
        }

    } catch (err) { res.status(400).send(err.message); }
};

const order_db=async (req, res) => {
    // ; console.log(req.params.id);
   console.log("Orders db running");

    ; try {
        let get = await bewrages_model.findOne({ _id: req.params.id });
        await redis.set(`order-${req.params.id}`, JSON.stringify(get));
        res.status(200).send(get);


    } catch (error) {
        console.log(error.message);

        res.status(400).send({ msg: error.message })
    }
}
const order_publish=async (req, res) => {

console.log("Orders publish running");

    // let session=await mongoose.startSession();
    // await session.startTransaction();
    try {
        let id = uuidv4();
        console.log(id);

        let order = { customer_id: req.body.customer_id, bewrage_id: req.body.bewrage_id, flavour: req.body.flavour, quantity: req.body.quantity, delivery: req.body.delivery, order: req.body.order, requests: req.body.requests, size: req.body.size, order_id: id }

        let redis_hash = await redis.hSet("orders", id, JSON.stringify(order));
        console.log(req.body.customer_id, order);

        let user_list = await redis.rPush(req.body.customer_id, JSON.stringify(order));


        let get_user_list = await redis.lRange(req.body.customer_id, 0, -1);


        res.status(200).send({ msg: "Order placed", order_id: id })


    } catch (err) {
        console.log("error", err.message);

        res.status(400).send({ msg: err.message });
    }

};
const order_cancel=async (req, res) => {
    console.log("cancel req reciever", req.body);
    try {
        let user_rem = await redis.lSet(req.body.customer_id, req.body.index, "_Deleted_");
        let part2 = await redis.lRem(req.body.customer_id, 1, "_Deleted_");
        await redis.hDel("orders", req.body.order_id);
       return res.status(200).json("Done")
    }
    catch (err) {
        console.log(err);next(new Error(err.message))
        ;return res.status(400).json(err)
    }

};

module.exports={order_cache,order_db,order_cancel,order_publish}