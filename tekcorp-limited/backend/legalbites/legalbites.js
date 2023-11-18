// https://www.legalbites.in/topics/articles - legalbites, Web Scrapping

const axios = require('axios');
const path = require('path');
const cheerio = require('cheerio');
const fs = require('fs');

const fileName = 'legalbites.json';

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

        const title = $('.page-title').text().trim(); 
        const paragraphs = $('.entry-main-content p').map((index, element) => $(element).text()).get();
   
        const dataString = paragraphs.join('');

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

    while (i <= 88) {
        const baseUrl = 'https://www.legalbites.in/topics/articles';
        let targetUrl = `${baseUrl}`;

        if (i > 1) {
            targetUrl = `${baseUrl}/${i}`;
        }

        try {
            const response = await axios.get(targetUrl);
            const htmlContent = response.data;

            // Save HTML content to a file
            const fileName = `legalbites.html`;  // for sitemap, better for web crawling
            const filePath = path.join(__dirname, fileName);

            fs.writeFileSync(filePath, htmlContent, 'utf-8');

            // Continue with the rest of your processing
            const $ = cheerio.load(htmlContent);
            const elements = $('h3.post-title a').map((index, element) => $(element).attr('href')).get();

            // Modify URLs by removing the prefix and adding the base URL
            const modifiedUrls = elements.map(element => {
                const formattedElement = element.startsWith('/') ? element.substring(1) : element;
                return `https://www.legalbites.in/${formattedElement.replace('/topics/articles/', '')}`;
            });

            const tasks = modifiedUrls.map(url => getData(url));
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