// https://lawbhoomi.com/ - lawbhoomi, Web Scrapping

const axios = require('axios');
const path = require('path');
const cheerio = require('cheerio');
const fs = require('fs');

const fileName = 'lawbhoomi.json';
const stateFileName = 'lawbhoomiCurrentPage.json';

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
        const paragraphs = $('.entry-content h2, .entry-content h3, .entry-content p, .entry-content ul li').map((index, element) => $(element).text()).get();

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
        const fileName = `lawbhoomi.html`;  // for sitemap, better for web scrawling
        const filePath = path.join(__dirname, fileName);

        fs.writeFileSync(filePath, htmlContent, 'utf-8');

        const $ = cheerio.load(htmlContent);
        const elements = $('h2.entry-title a').map((index, element) => {
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
    let currentPage = 1;
    let i = 1;

    const maxPages = 413;

    // Read the current state from the file
    try {
        const stateFilePath = path.join(__dirname, stateFileName);
        const stateData = fs.readFileSync(stateFilePath, 'utf-8');
        const state = JSON.parse(stateData);

        currentPage = state.currentPage;
        console.log(`Resuming scraping from page ${currentPage}.`);
    } catch (error) {
        console.log('Starting scraping from the beginning.');
    }

    const promises = [];

    while (currentPage <= maxPages) {
        const baseUrl = 'https://lawbhoomi.com/';
        const targetUrl = `${baseUrl}page/${currentPage}/`;

        promises.push(scrapePage(targetUrl).then(dataList => updateFile(dataList)));

        currentPage++;
        i++;
    }

    // Save the current state to the file
    const stateFilePath = path.join(__dirname, stateFileName);
    const state = { currentPage };
    fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf-8');

    try {
        // Wait for all promises to resolve, for parallelizing the scrapping
        await Promise.all(promises);
        console.log('Scraping completed successfully.');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();