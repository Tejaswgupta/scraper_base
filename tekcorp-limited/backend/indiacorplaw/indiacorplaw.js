// https://indiacorplaw.in - indiacorplaw, Web Scrapping

const axios = require('axios');
const path = require('path');
const cheerio = require('cheerio');
const fs = require('fs');

const fileName = 'indiacorplaw.json';

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

        const title = $('.entry-title').text().trim();
 
        const paragraphs = $('.entry-content p').map((index, element) => $(element).text()).get();
   
        const dataString = paragraphs.join('');

        const newsItem = {
            'headline': title, 
            'paragraph': dataString
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
        const baseUrl = 'https://indiacorplaw.in';
        let targetUrl = `${baseUrl}/`;
 
        try {
            const response = await axios.get(targetUrl);
            const htmlContent = response.data;

            // Save HTML content to a file
            const fileName = `indiacorplaw.html`;  // for sitemap, better for web scrawling
            const filePath = path.join(__dirname, fileName);

            fs.writeFileSync(filePath, htmlContent, 'utf-8');

            // Continue with the rest of your processing
            const $ = cheerio.load(htmlContent);
            const elements = $('h2.entry-title a').map((index, element) => $(element).attr('href')).get();
            
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