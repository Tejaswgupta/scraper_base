// https://shoneekapoor.com/ - shoneekapoor, Web Scrapping

const axios = require('axios');
const path = require('path');
const cheerio = require('cheerio');
const fs = require('fs');

const fileName = 'shoneekapoor.json';

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

        const title = $('.auto-container h2').text().trim();
        const paragraphs = $('.text p, .text ol li').map((index, element) => $(element).text()).get();

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
        const baseUrl = `https://www.shoneekapoor.com/articles/`;

        try {
            const response = await axios.get(baseUrl);
            const htmlContent = response.data;

            // Save HTML content to a file
            const fileName = `shoneekapoor.html`;  // for sitemap, better for web scrawling
            const filePath = path.join(__dirname, fileName);

            fs.writeFileSync(filePath, htmlContent, 'utf-8');

            const $ = cheerio.load(htmlContent);
            const elements = $('span.eael-entry-title a').map((index, element) => $(element).attr('href')).get();

            if (elements.length === 0) {
                break; // No more pages
            }

            const tasks = elements.map(element => getData(element));
            const dataList = await Promise.all(tasks); // for parallelizing content, concurrent api calls, and fast/efficient way of extracting data

            updateFile(dataList);

            i++;
        } catch (error) {
            console.error('Error:', error.message);
            break;
        }
    }
}

main();