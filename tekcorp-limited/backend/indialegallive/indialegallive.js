// https://www.indialegallive.com/ - indialegallive, Web Scrapping

const axios = require('axios');
const path = require('path');
const cheerio = require('cheerio');
const fs = require('fs');

const fileName = 'indialegallive.json';

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

    // Filter out null values before combining data
    const validDataList = dataList.filter(item => item !== null);

    const combinedData = existingData.concat(validDataList);

    fs.writeFileSync(filePath, JSON.stringify(combinedData, null, 2), 'utf-8');
}

async function getData(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const title = $('.tdb-title-text').text().trim();
        const paragraphs = $('.tdb-block-inner p').map((index, element) => $(element).text()).get();

        // Join paragraphs and clean up unwanted characters
        let dataString = paragraphs.join('').replace(/[\n\t]+/g, ' ').replace(/[\s\u200B-\u200D\uFEFF]+/g, ' ');

        const newsItem = {
            'headline': title,
            'data': dataString
        };

        return newsItem;
    } catch (error) {
        console.error('Error fetching data from:', url);
        return null; // Return null for unsuccessful requests
    }
}

async function scrapePage(url) {
    try {
        const response = await axios.get(url);
        const htmlContent = response.data;

        // Save HTML content to a file
        const fileName = `indialegallive.html`;  // for sitemap, better for web scrawling
        const filePath = path.join(__dirname, fileName);

        fs.writeFileSync(filePath, htmlContent, 'utf-8');

        const $ = cheerio.load(htmlContent);
        const elements = $('h3.entry-title a').map((index, element) => {
            const href = $(element).attr('href');
            return href;
        }).get();

        const filteredElements = elements.filter(element => element !== null);

        // Use Promise.all to fetch data concurrently
        const tasks = filteredElements.map(element => getData(element));
        return Promise.all(tasks);
    } catch (error) {
        console.error('Error Page not working, hence, scrapping failed', url);
        throw error;
    }
}

async function main() {
    let i = 1; 
  
    const promises = []; 

    while (i <= 4000) {
        const baseUrl = 'https://www.indialegallive.com/'; 

        promises.push(scrapePage(baseUrl).then(dataList => updateFile(dataList)));
 
        i++
    }

    try {
        // Wait for all promises to resolve, for parallelizing the scrapping
        await Promise.all(promises); 
        console.log('Scraping completed successfully.');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();