//`https://www.trendyol.com/sr?q=${G770.1265-bfj0x-b}`
const puppeteer = require('puppeteer');
const mongoose = require('mongoose')
const { Laptop, Seller } = require("./Database")




//gets all model number from database
async function getModelNumbers() {

    var array = [];
    const app = await Laptop.find({}).exec();

    app.forEach((laptop) => {

        if (laptop.modelNo) {
            array.push(laptop.modelNo.toUpperCase()/*.trim().replace(/ /g,'-')*/)
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
    const laptopCardsWeb = await page.evaluate(() => {

        const nodeList = Array.from(document.querySelectorAll(".p-card-chldrn-cntnr.card-border")).map(el => {
            /*if(el.firstChild.getElementsByClassName("prdct-desc-cntnr-name")[0].textContent.toUppercase().includes(modelNo))*/
            const newObj = {
                title: el.firstChild.getElementsByClassName("prdct-desc-cntnr-name")[0].textContent,
                url: el.firstChild.href,
                price: el.firstChild.getElementsByClassName("prc-box-dscntd")[0].textContent
            }
            return newObj

        })

        return nodeList
    })

    const bestLaptop = laptopCardsWeb[0]


    if (bestLaptop?.title?.toUpperCase().includes(modelNo.trim()) && parseInt(bestLaptop?.price) > 2000) {
        const seller = new Seller({
            productUrl: bestLaptop.url,
            price: bestLaptop.price,
            seller: "trendyol"
        })

        // Seller.findOne({productUrl: seller.productUrl})



        await Laptop.findOne({ modelNo: modelNo }).populate('sellers').exec(async function (err, docs) {
            if (docs) {
                // console.log("Docs Before: ")
                // console.log(docs)
                // if i scraped the laptop before don't add it
                // if (docs.sellers[1]?.productUrl != seller.productUrl) {
                let obj = docs.sellers?.find(o => o.productUrl === seller.productUrl);
                if (!obj) {
                    await seller.save();
                    docs.sellers.push(seller);
                    await docs.save();
                    console.log("saved...")
                }
                else {
                    console.log("already saved before")
                }

                // console.log("Docs After: ")
                // console.log(docs)
                // }

            }
        })
    }

    browser.close()

}


async function trendyol() {

    const laptopModelNumbers = await getModelNumbers()

    for (modelNo of laptopModelNumbers) {

        console.log(modelNo)
        const modelNoInLink = modelNo.trim().replace(/ /g, '-')
        //searches for model number in trendyol
        await scrapePage(`https://www.trendyol.com/sr?q=${modelNo}`, modelNo)

    }
    //const modelNo = laptopModelNumbers[0]
    //await scrapePage(`https://www.trendyol.com/sr?q=${modelNo}`, modelNo)

}

// trendyol()

module.exports = trendyol;