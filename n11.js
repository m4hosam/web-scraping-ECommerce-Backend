const puppeteer = require('puppeteer');
const { Laptop, Seller } = require("./Database")


//laptop attributes as written in n11 description
const attributes = ['Marka', 'Model', 'İşletim Sistemi', 'İşlemci', "İşlemci Modeli", 'Bellek Kapasitesi', 'Disk Kapasitesi', 'Disk Türü', 'Ekran Boyutu', 'Price', 'Website', 'img', 'title']

//gets all the laptops' urls that are present in a page and returns
async function scrapePage(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { timeout: 0 });

    const laptopUrls = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".plink")).map(x => x.getAttribute('href'));
    })

    browser.close();
    return new Promise((resolve, reject) => {
        resolve(laptopUrls)
    });
}

async function scrapeLaptop(url) {
    console.log("opening:")
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    console.log("Loading....")
    await page.goto(url, { timeout: 0 });
    const doc = {}


    //gets list of attributes displayed about the laptop (ex. "ram", "disk type")
    const attributeListTitle = await page.evaluate(() => {
        const list = Array.from(document.querySelectorAll(".unf-prop-list-title"), el => (el = el.textContent))
        list.push("Price")
        list.push("Website")
        list.push("img")
        list.push("title")
        return list
    })

    //gets the value of the attributes displayed (ex. "16Gb", "SSD")
    const attributeListProp = await page.evaluate(() => {
        const list = Array.from(document.querySelectorAll(".unf-prop-list-prop"), el => (el = el.textContent))
        list.push(document.querySelector("#unf-p-id > div > div:nth-child(2) > div.unf-p-cvr > div.unf-p-left > div > div.unf-p-detail > div.unf-price-cover > div.price-cover > div.price > div > div > div > ins").textContent)
        list.push("n11")
        list.push(document.querySelector(".imgObj > a").href)
        list.push(document.querySelector(".proName").textContent.trim())
        console.log(list)
        return list
    })

    // console.log("attributeListTitle: ")
    // console.log(attributeListTitle)
    // console.log("attributeListProp: ")
    // console.log(attributeListProp)
    //filters the attributes and only takes the ones needed in listItem
    attributeListTitle.forEach((listItem, i = 0) => {
        if (attributes.indexOf(listItem) >= 0) {
            doc[listItem] = attributeListProp[i]
        }
        i++
    })

    //supposed to check if laptop has model number or not, if no model number, doesnt save laptop to database
    //doesnt work yet
    // if(!doc.hasOwnProperty("Model")){
    //     return
    // }

    const seller = new Seller({
        productUrl: url,
        price: doc["Price"],
        seller: "n11"
    })

    const laptop = new Laptop({
        brand: doc["Marka"],
        name: doc["title"],
        imgUrl: doc["img"],
        modelNo: doc["Model"],
        ops: doc["İşletim Sistemi"],
        cpuType: doc["İşlemci"],
        cpuGen: doc["İşlemci Modeli"],
        ram: doc["Bellek Kapasitesi"],
        diskSize: doc["Disk Kapasitesi"],
        diskType: doc["Disk Türü"],
        screenSize: doc["Ekran Boyutu"],
        sellers: []
    })

    await Laptop.findOne({ name: laptop.name }, async function (err, docs) {
        if (docs) {
            console.log("already saved before")
            // console.log(docs)
        }
        else {
            await laptop.save();
            await Laptop.findOne({ _id: laptop._id }, async function (err, docs) {
                await seller.save();
                docs.sellers.push(seller);
                await docs.save();
                console.log("saved...")
                // console.log(docs)
            }).clone().catch(function (err) { console.log(err) })
        }
    }).clone().catch(function (err) { console.log(err) })



    //saves to database

    console.log("Done.")
    browser.close();
}

//gets every laptop url in n11 in 9 pages

async function n11(limit) {
    for (let j = 1; j < limit; j++) {
        await scrapePage(`https://www.n11.com/bilgisayar/dizustu-bilgisayar?ipg=${j}&pg=${j}`).then(async laptopUrl => {

            //scrapes every laptop and its attributes for the current page
            for (let i = 0; i < laptopUrl.length; i++) {
                await scrapeLaptop(laptopUrl[i]);
            }
        })
    }
}

// n11();

module.exports = n11;
