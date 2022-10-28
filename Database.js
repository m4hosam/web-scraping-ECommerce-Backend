const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://m4hosam:m4h3429@cluster0.xwjhyxa.mongodb.net/webScraping", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Conneccted to the DB')
    })
    .catch(er => {
        console.log('Connection Error to the DB')
    });

// Mongodb

const sellerSchema = new mongoose.Schema({
    id: Number,
    seller: String,
    price: String,
    productUrl: String,
    rate: String
})

const laptopSchema = new mongoose.Schema({
    name: String,
    imgUrl: String,
    brand: String,
    modelNo: String,
    ops: String,
    cpuType: String,
    cpuGen: String,
    ram: String,
    diskSize: String,
    diskType: String,
    screenSize: String,
    sellers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller'
    }]
})

const productSchema = new mongoose.Schema({
    name: String,
    productUrl: String,
    imgUrl: String,
    brand: String,
    modelNo: String,
    ops: String,
    cpuType: String,
    cpuGen: String,
    ram: String,
    diskSize: String,
    diskType: String,
    screenSize: String,
    price: String
})
const Laptop = mongoose.model("Laptop", laptopSchema);
const Seller = mongoose.model("Seller", sellerSchema);
const Product = mongoose.model("Product", productSchema);




exports.Laptop = Laptop;
exports.Seller = Seller;
exports.Product = Product;