// https://iprlawindia.org/blog/ - iprlawindia, Web Scrapping

// * URL not working / ALSO MENTIONED TO TEGAS WITH A LIST OF NON-WORKING SITES *

const axios = require('axios');
const path = require('path');
const cheerio = require('cheerio');
const fs = require('fs');

const fileName = 'iprlawindia.json';

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

        const title = $('.title').text().trim();

        // Select and extract text from <p> elements inside the div with id 'content'
        const paragraphs = $('#content p').map((index, element) => $(element).text()).get();

        // Select and extract text from <li> elements inside the div with id 'content'
        const listItems = $('#content li').map((index, element) => $(element).text()).get();
 
        // Join paragraphs and clean up unwanted characters
        let dataString = paragraphs.concat(listItems).join('').replace(/[\n\t]+/g, ' ').replace(/[\s\u200B-\u200D\uFEFF]+/g, ' ');

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

async function main() {
    let i = 1;

    while (i <= 42) {
        const baseUrl = 'https://iprlawindia.org/blog/';
        let targetUrl = `${baseUrl}/`;
 
        try {
            const response = await axios.get(targetUrl);
            const htmlContent = response.data;

            // Save HTML content to a file
            const fileName = `iprlawindia.html`;  // for sitemap, better for web scrawling
            const filePath = path.join(__dirname, fileName);

            fs.writeFileSync(filePath, htmlContent, 'utf-8');

            // Continue with the rest of your processing
            const $ = cheerio.load(htmlContent);
            const elements = $('h2.title a').map((index, element) => $(element).attr('href')).get();
            
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