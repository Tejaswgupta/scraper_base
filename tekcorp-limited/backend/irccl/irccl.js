// https://www.irccl.in/blog - irccl, Web Scrapping

const axios = require('axios');
const path = require('path');
const cheerio = require('cheerio');
const fs = require('fs');

const fileName = 'irccl.json';

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
 
async function getData(headings, paragraphs) {
    try {
        // Ensure both headings and paragraphs have at least one element
        if (headings.length === 0 || paragraphs.length === 0) {
            console.error('Error: Empty headings or paragraphs arrays');
            return {};
        }

        const newsItems = [];

        // Loop over the arrays and create pairs
        for (let i = 0; i < Math.min(headings.length, paragraphs.length); i++) {
            const headline = headings[i];
            const data = paragraphs[i];

            const newsItem = {
                'headline': headline,
                'paragraph': data
            };

            newsItems.push(newsItem);
        }
  
        return newsItems;
    } catch (error) {
        console.error('Error:', error.message);
        return {};
    }
}

async function main() {
    let i = 1;

    while (true) {
        const baseUrl = 'https://www.irccl.in/blog';
        let targetUrl = `${baseUrl}`;

        try {
            const response = await axios.get(targetUrl);
            const htmlContent = response.data;

            // Save HTML content to a file
            const fileName = `irccl.html`;  // for sitemap, better for web crawling
            const filePath = path.join(__dirname, fileName);

            fs.writeFileSync(filePath, htmlContent, 'utf-8');

            // Continue with the rest of your processing
            const $ = cheerio.load(htmlContent);

            const headings = $('.bD0vt9').map((index, element) => $(element).text()).get();
            const paragraphs = $('.BOlnTh').map((index, element) => $(element).text()).get();
 
            const newsItems = await getData(headings, paragraphs);
 
            updateFile(newsItems)
            i++;
        } catch (error) {
            console.error('Error:', error.message);
            break;
        }
    }
}

main();