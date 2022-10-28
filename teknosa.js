const puppeteer = require('puppeteer');
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

    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto(url, { timeout: 0 })
    //takes all results from search and puts them in array
    //DOESNT WORK returning undefined and not printing console.logs written inside

    const bestLaptop = await page.evaluate(() => {

        const node = document.querySelector(".prd")
        // console.log(node)
        //document.querySelector(".prd").querySelector("h3.prd-title").textConten
        const newObj = {
            title: node?.querySelector("h3.prd-title").textContent.trim(),
            url: node?.querySelector(".prd-link").href,
            price: node?.querySelector(".prc.prc-last").textContent.trim()
        }
        return newObj
    })

    //console.log(bestLaptop)
    if (bestLaptop?.title?.toUpperCase().includes(modelNo.trim())) {
        const seller = new Seller({
            productUrl: bestLaptop.url,
            price: bestLaptop.price,
            seller: "teknosa"
        })

        await Laptop.findOne({ modelNo: modelNo }).populate('sellers').exec(async function (err, docs) {
            if (docs) {
                //checks if laptop already has a sellers from the website

                let obj = docs.sellers?.find(o => o.productUrl === seller.productUrl);
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


async function teknosa() {

    const laptopModelNumbers = await getModelNumbers()

    for (modelNo of laptopModelNumbers) {

        console.log(modelNo)
        const modelNoInLink = modelNo.trim().replace(/ /g, '-')
        //searches for model number in trendyol
        await scrapePage(`https://www.teknosa.com/arama/?s=${modelNo}`, modelNo)

    }
}


module.exports = teknosa;