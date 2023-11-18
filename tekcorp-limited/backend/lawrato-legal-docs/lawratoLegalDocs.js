// https://lawrato.com/legal-documents - legal-documents, Web Scrapping

const axios = require('axios');
const path = require('path');
const cheerio = require('cheerio');
const fs = require('fs');

const fileName = 'lawratoLegalDocs.json';

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

        const title = $('.content-left .block-item .block-card h2').text().trim();
        const elements = $('.content-left .block-item .block-card p').map((index, element) => $(element).text()).get(); 
         
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

    while (true) {
        const baseUrl = 'https://lawrato.com/legal-documents';
        let targetUrl = `${baseUrl}`;
 
        try {
            const response = await axios.get(targetUrl);
            const htmlContent = response.data;

            // Save HTML content to a file
            const fileName = `lawratoLegalDocs.html`;  // for sitemap, better for web scrawline
            const filePath = path.join(__dirname, fileName);

            fs.writeFileSync(filePath, htmlContent, 'utf-8');

            // Continue with the rest of your processing
            const $ = cheerio.load(htmlContent);
            const elements = $('.border-box ul li a').map((index, element) => $(element).attr('href')).get();

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