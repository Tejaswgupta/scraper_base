// https://www.barandbench.com/ - barandbench 

// * NO JSON FILE FOR THIS REQUIRES SUBSCRIPTION, TEJAS DENIED FOR WRITING SCRAPPER FOR THIS *

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

        const title = $('.arr--story--headline-h1').text().trim();
        const paragraphs = $('.arr--text-element p').map((index, element) => $(element).text()).get();

        const dataString = paragraphs.join('');

        const newsItem = {
            'headline': title,
            'data': dataString
        };

        return newsItem;
    } catch (error) {
        console.error('Error fetching data from:', url);
        return {};
    }
}

async function main() {
    let i = 1; 

    while (true) {
        const baseUrl = `https://www.barandbench.com/news`;

        try {
            const response = await axios.get(baseUrl);
            const htmlContent = response.data;

            // Save HTML content to a file
            const fileName = `barandbench.html`;  // for sitemap, better for web scrawling
            const filePath = path.join(__dirname, fileName);

            fs.writeFileSync(filePath, htmlContent, 'utf-8');

            const $ = cheerio.load(htmlContent);
            const elements = $('.arr--headline a').map((index, element) => $(element).attr('href')).get();

            // Filter out the URLs that are already in the Set
            const uniqueElements = elements.filter(url => !uniqueUrls.has(url));

            if (uniqueElements.length === 0) {
                break; // No more pages
            }
  
            // Add the unique URLs to the Set 

            const tasks = uniqueElements.map(element => getData(element));
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