const puppeteer = require('puppeteer');
const mongoose = require('mongoose')
const { Laptop, Seller } = require("./Database")


//gets all model number from database
async function getModelNumbers() {

    var array = [];
    const app = await Laptop.find({}).exec();

    app.forEach((laptop) => {

        if (laptop.modelNo) {
            array.push(laptop.modelNo.toUpperCase())
        }
    })
    console.log("got model numbers")
    return new Promise((resolve, reject) => {
        resolve(array)
    })
}

//finds best laptop with provided model number
async function scrapePage(url, modelNo) {

    const browser = await puppeteer.launch({
        ignoreHTTPSErrors: true,
        headless: false
    })
    const page = await browser.newPage()
    await page.goto(url, { timeout: 0 })
    // console.log("---------------")
    // console.log(await page.content())
    // console.log("---------------")

    const bestLaptop = await page.evaluate(() => {

        const node = document.querySelector(".moria-ProductCard-joawUM")
        // let productPrice = document.querySelector(".moria-ProductCard-joawUM > a > div:nth-child(2)> div:nth-child(3)").textContent
        // if (productPrice == '') {
        //     productPrice = document.querySelector(".moria-ProductCard-joawUM > a > div:nth-child(2)> div:nth-child(2)").textContent
        // }
        let productPrice = document.querySelectorAll('[data-test-id="price-current-price"]')[0]?.textContent
        //console.log(node)
        const newObj = {
            title: node?.firstChild.title,
            url: node?.firstChild.href,
            price: productPrice
        }
        return newObj
    })
    // console.log(bestLaptop)

    if (bestLaptop?.title?.toUpperCase().includes(modelNo.trim())) {
        // console.log(bestLaptop)
        const seller = new Seller({
            productUrl: bestLaptop.url,
            price: bestLaptop.price,
            seller: "hepsiburada"
        })

        await Laptop.findOne({ modelNo: modelNo }).populate('sellers').exec(async function (err, docs) {

            // docs.sellers.filter((obj) =>
            //     JSON.stringify(obj).toLowerCase().includes(seller.productUrl.toLowerCase())
            // )
            if (docs) {
                let obj = docs.sellers?.find(o => o.productUrl === seller.productUrl);
                // console.log(obj)
                if (!obj) {
                    // already saved before

                    await seller.save();
                    docs.sellers.push(seller);
                    await docs.save();
                    // console.log(docs)
                    console.log("saved...")
                }
                else {
                    console.log("already saved before")
                }
            }
        })
    }

    browser.close()

}


async function hepsiburada() {

    const laptopModelNumbers = await getModelNumbers()

    for (modelNo of laptopModelNumbers) {

        console.log(modelNo)
        const modelNoInLink = modelNo.trim().replace(/ /g, '-')
        //console.log(`https://www.hepsiburada.com/ara?q=${modelNoInLink}`)
        //searches for model number in trendyol
        //console.log(`https://www.hepsiburada.com/ara?q=${modelNo}`)
        await scrapePage(`https://www.hepsiburada.com/ara?q=${modelNoInLink}`, modelNo)

    }
}



module.exports = hepsiburada;