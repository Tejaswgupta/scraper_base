// https://lawrato.com/free-legal-advice - free-legal-advice, Web Scrapping

const axios = require('axios');
const path = require('path');
const cheerio = require('cheerio');
const fs = require('fs');

const fileName = 'lawratoLegal.json';

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

        const title = $('.content-left h1').text().trim();
        const elements = $('.question-body div').map((index, element) => $(element).text()).get(); 
         
        const dataString = elements.join('');

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

    while (i <= 11000) {
        const baseUrl = 'https://lawrato.com/free-legal-advice';
        let targetUrl = `${baseUrl}`;

        if( i > 1) {
            targetUrl = `${baseUrl}?&page=${i}`;
        }
        try {
            const response = await axios.get(targetUrl);
            const htmlContent = response.data;

            // Save HTML content to a file
            const fileName = `lawratoLegal.html`;  // for sitemap, better for web scrawline
            const filePath = path.join(__dirname, fileName);

            fs.writeFileSync(filePath, htmlContent, 'utf-8');

            // Continue with the rest of your processing
            const $ = cheerio.load(htmlContent);
            const elements = $('.title a').map((index, element) => $(element).attr('href')).get();

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