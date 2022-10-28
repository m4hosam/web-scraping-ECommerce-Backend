const n11 = require('./n11')
const trendyol = require('./trendyol')
const teknosa = require('./teknosa')
const hepsiburada = require('./hepsiburada')
const { Laptop, Seller, Product } = require("./Database")
const scrapeForLaptops = require('./scrapeLaptop')



function priceDecending(a, b) {
    let price1 = a.price?.replace('TL', '')
    price1 = parseFloat(price1)
    let price2 = b.price?.replace('TL', '')
    price2 = parseFloat(price2)
    if (price1 < price2) {
        return -1;
    }
    if (price2 < price1) {
        return 1;
    }
    return 0;
}

function priceAscending(a, b) {
    let price1 = a.price?.replace('TL', '')
    price1 = parseFloat(price1)
    let price2 = b.price?.replace('TL', '')
    price2 = parseFloat(price2)
    if (price1 < price2) {
        return 1;
    }
    if (price2 < price1) {
        return -1;
    }
    return 0;
}

function sellersPriceLowToHigh(a, b) {
    let price1 = a.sellers[0]?.price?.replace('TL', '')
    price1 = parseFloat(price1)
    let price2 = b.sellers[0]?.price?.replace('TL', '')
    price2 = parseFloat(price2)
    if (price1 < price2) {
        return -1;
    }
    if (price2 < price1) {
        return 1;
    }
    return 0;
}
function sellersPriceHighToLow(a, b) {
    let price1 = a.sellers[0]?.price?.replace('TL', '')
    price1 = parseFloat(price1)
    let price2 = b.sellers[0]?.price?.replace('TL', '')
    price2 = parseFloat(price2)
    if (price1 < price2) {
        return 1;
    }
    if (price2 < price1) {
        return -1;
    }
    return 0;
}

function sellersDynamicSearchArray(arr, word) {
    word = word.toLowerCase().replaceAll(' ', '')
    function data(item) {
        let name = item.name?.toLowerCase().replaceAll(' ', '')
        let model = item.modelNo?.toLowerCase().replaceAll(' ', '')
        if (name?.includes(word)) {
            return true;
        }
        else if (model?.includes(word)) {
            return true;
        }
        else if (item.sellers?.find(o => o.seller.includes(word) === true)) {
            return true;
        }
    }

    const items = arr?.filter(data);
    return items;
}

function dynamicSearchArray(arr, word) {
    word = word.toLowerCase().replaceAll(' ', '')
    function data(item) {
        let name = item.name?.toLowerCase().replaceAll(' ', '')
        let model = item.modelNo?.toLowerCase().replaceAll(' ', '')
        if (name?.includes(word)) {
            return true;
        }
        else if (model?.includes(word)) {
            return true;
        }
    }

    const items = arr?.filter(data);
    return items;
}

function getProductFromLaptop(laptop) {
    const sortedObj = laptop.sellers.sort(priceDecending)
    const price = sortedObj[0].price.replace('TL', '')
    const newProduct = {
        name: laptop.name,
        imgUrl: laptop.imgUrl,
        brand: laptop.brand,
        modelNo: laptop.modelNo,
        ops: laptop.ops,
        cpuType: laptop.cpuType,
        cpuGen: laptop.cpuGen,
        ram: laptop.ram,
        diskSize: laptop.diskSize,
        diskType: laptop.diskType,
        screenSize: laptop.screenSize,
        price: price,
    }
    return newProduct
}



async function getProductByModelNo(req, res) {
    // console.log("-------------------getProductByModelNo---------------")
    const key = req.body.searchKey;
    console.log("THe key: " + key)
    // First search in the DB 
    Product.find({}).exec(async function (err, docs) {
        if (err) {
            console.log(err);
        }
        else {
            docs = dynamicSearchArray(docs, key)
            if (docs.length !== 0) {
                // if in the data base send it to be edited
                console.log(docs)
                res.send(docs[0]);
            }
            else {
                // if not search in the cimri data base 
                await Laptop.find({}).populate('sellers').exec(async function (err, docs2) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        docs2 = dynamicSearchArray(docs2, key)
                        if (docs2.length !== 0) {
                            // laptopResult = docs
                            // console.log("id:")
                            // console.log(docs2._id)
                            // console.log("object1")
                            // console.log(docs2)
                            const obj = getProductFromLaptop(docs2[0])
                            console.log("object2")
                            console.log(obj)
                            res.send(obj);
                        }
                        else {
                            // Else : Scrap the websites for this key
                            // Last option
                            console.log("Scraping")
                            const p = await scrapeForLaptops(key)
                            res.send(p);
                        }
                    }
                })
            }
        }
    })
}







// scraping part
async function scrapSites() {
    // limit n11 to one page scraping
    // await n11(20);
    // await trendyol();
    // await hepsiburada();
    // await teknosa()
}


exports.priceDecending = priceDecending
exports.priceAscending = priceAscending
exports.sellersPriceLowToHigh = sellersPriceLowToHigh
exports.sellersPriceHighToLow = sellersPriceHighToLow
exports.scrapSites = scrapSites
exports.sellersDynamicSearchArray = sellersDynamicSearchArray
exports.dynamicSearchArray = dynamicSearchArray
exports.getProductByModelNo = getProductByModelNo
