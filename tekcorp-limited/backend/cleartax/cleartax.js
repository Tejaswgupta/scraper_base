// https://cleartax.in/ - cleartax, Web Scrapping

const axios = require('axios');
const path = require('path');
const cheerio = require('cheerio');
const fs = require('fs');

const fileName = 'cleartax.json';

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

        const title = $('.post-info-wrapper h1.animated').text().trim();
        const paragraphs = $('article p, article h2, article h3').map((index, element) => $(element).text()).get();

        // Join paragraphs and clean up unwanted characters
        let dataString = paragraphs.join('').replace(/[\n\t]+/g, ' ').replace(/[\s\u200B-\u200D\uFEFF]+/g, ' ');

        const newsItem = {
            'headline': title,
            'data': dataString
        };

        return newsItem;
    } catch (error) {
        console.error('Error fetching data from:', url);
        return null;
    }
}

async function main() {
    let i = 1;
    const uniqueUrls = new Set(); // Use a Set to store unique URLs

    while (true) {
        const baseUrl = `https://blog.clear.in/`;

        try {
            const response = await axios.get(baseUrl);
            const htmlContent = response.data;

            // Save HTML content to a file
            const fileName = `cleartax.html`;  // for sitemap, better for web scrawling
            const filePath = path.join(__dirname, fileName);

            fs.writeFileSync(filePath, htmlContent, 'utf-8');

            const $ = cheerio.load(htmlContent);
            const elements = $('.post-info h3 a').map((index, element) => {
                const relativeUrl = $(element).attr('href');
                const prefixedUrl = `https://blog.clear.in${relativeUrl}`;
                return prefixedUrl;
            }).get();

            // Filter out the URLs that are already in the Set
            const uniqueElements = elements.filter(url => !uniqueUrls.has(url));

            if (uniqueElements.length === 0) {
                break; // No more pages
            }
  
            // Add the unique URLs to the Set
            uniqueElements.forEach(url => uniqueUrls.add(url));

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