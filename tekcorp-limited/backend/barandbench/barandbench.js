// https://barandbench.com - barandbench, Web Scrapping 

// * Ask Tegas, which category to target * 

const axios = require('axios');
const path = require('path');
const cheerio = require('cheerio');
const fs = require('fs');

const fileName = 'barandbench.json';

function updateFile(dataList) { 
    const filePath = path.join(__dirname, fileName);

    let existingData = [];

    try {
        const existingDataString = fs.readFileSync(filePath, 'utf-8');

        if (existingDataString.trim() !== '') {
            existingData = JSON.parse(existingDataString);
        }
    } catch (error) {
        console.log('Error reading existing data:', error);
    }

    const combinedData = existingData.concat(dataList);

    fs.writeFileSync(filePath, JSON.stringify(combinedData, null, 2), 'utf-8');
}
 
async function getData(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const title = $('.arrow-component h1').text().trim(); 
        const paragraphs = $('.arrow-component p').map((index, element) => $(element).text()).get();
   
        const dataString = paragraphs.concat(listItems).join('');

        const newsItem = {
            'headline': title, 
            'data': dataString
        };

        return newsItem;
    } catch (error) {
        console.error('Error fetching data from:', url);
        return {}; // Return null for unsuccessful requests
    }
}

async function main() {
    let i = 1;

    while (true) {
        const baseUrl = 'https://www.barandbench.com';
        let targetUrl = `${baseUrl}`;

        try {
            const response = await axios.get(targetUrl);
            const htmlContent = response.data;

            // Save HTML content to a file
            const fileName = `barandbench.html`;  // for sitemap, better for web scrawling
            const filePath = path.join(__dirname, fileName);

            fs.writeFileSync(filePath, htmlContent, 'utf-8');

            // Continue with the rest of your processing
            const $ = cheerio.load(htmlContent);

            // Updated selector to target the anchor tags directly
            const elements = $('.arrow-component a').map((index, element) => {
                const href = $(element).attr('href');
                // Filter out URLs that don't start with 'https://www.barandbench.com/news'
                return href.startsWith('https://www.barandbench.com/news') ? href : null;
            }).get().filter(Boolean);
   
            const tasks = elements.map(element => getData(element));
            const dataList = await Promise.all(tasks);

            updateFile(dataList);

            i++;
        } catch (error) {
            console.error('Error:', error.message);
            break;
        }
    }
}

main();