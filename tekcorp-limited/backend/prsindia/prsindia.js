const axios = require('axios');
const path = require('path');
const cheerio = require('cheerio');
const fs = require('fs');

const fileName = 'prsindia.json';

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

    const combinedData = existingData.concat(validDataList)

    fs.writeFileSync(filePath, JSON.stringify(combinedData, null, 2), 'utf-8');
}

async function getData(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const title = $('.field-item h2').text().trim();
        const paragraphs = $('.field-item p').map((index, element) => $(element).text()).get();

        // Join paragraphs and clean up unwanted characters
        let dataString = paragraphs.join('').replace(/[\n\t]+/g, ' ').replace(/[\s\u200B-\u200D\uFEFF]+/g, ' ');

        const newsItem = {
            'headline': title,
            'data': dataString
        };

        return newsItem;
    } catch (error) {
        console.error('Error fetching data from:', url );
        return null; // Return null for unsuccessful requests
    }
}

async function main() {
    let i = 1;

    while (true) {
        const baseUrl = 'https://prsindia.org/billtrack';
        let targetUrl = `${baseUrl}`;

        try {
            const response = await axios.get(targetUrl);
            const htmlContent = response.data;

            // Save HTML content to a file
            const fileName = `prsindia.html`; // for sitemap, better for web scrawling
            const filePath = path.join(__dirname, fileName);

            fs.writeFileSync(filePath, htmlContent, 'utf-8');

            // Continue with the rest of your processing
            const $ = cheerio.load(htmlContent);

            const elements = $('.cate a').map((index, element) => {
                const href = $(element).attr('href');
                return href.startsWith('/billtrack') ? `https://prsindia.org${href}` : href;
            }).get();

            const tasks = elements.map(element => getData(element));
            const dataList = await Promise.all(tasks);

            // Remove null values before updating the file
            updateFile(dataList.filter(Boolean));

            i++;
        } catch (error) {
            console.error('Error:', error.message);
            break;
        }
    }
}

main();