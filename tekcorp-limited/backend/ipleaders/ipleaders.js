// https://blog.ipleaders.in/ - ipleaders, Web Scrapping

const axios = require('axios');
const path = require('path');
const cheerio = require('cheerio');
const fs = require('fs');

const fileName = 'ipleaders.json';

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
        const paragraphs = $('.td-post-content h2, .td-post-content p, .td-post-content ul li, .td-post-content ol li').map((index, element) => $(element).text()).get();

        let dataString = paragraphs.join('');

        const newsItem = {
            'headline': title,
            'data': dataString
        };

        return newsItem;
    } catch (error) {
        console.error('Error fetching data from:', url);
        return {}; // Return {} for unsuccessful requests
    }
}

async function scrapePage(url) {
    try {
        const response = await axios.get(url);
        const htmlContent = response.data;

        // Save HTML content to a file
        const fileName = `ipleaders.html`;  // for sitemap, better for web scrawling
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

    while (i <= 1000) {
        const baseUrl = 'https://blog.ipleaders.in/'; 

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