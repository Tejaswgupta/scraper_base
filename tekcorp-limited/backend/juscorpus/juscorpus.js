// https://www.juscorpus.com/category/blogs/ - juscorpus, Web Scrapping

const axios = require('axios');
const path = require('path');
const cheerio = require('cheerio');
const fs = require('fs');

const fileName = 'juscorpus.json';

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

        const title = $('.page-title-title h1').text().trim(); 
        const paragraphs = $('.elementor-text-editor h4, .elementor-text-editor p, .elementor-text-editor ol li').map((index, element) => $(element).text()).get(); 

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

    while (i <= 214) {
        const baseUrl = 'https://www.juscorpus.com/category/blogs/';
        let targetUrl = `${baseUrl}`;
 
        if(targetUrl > 1) {
            targetUrl = `${baseUrl}page/${i}/`
        }
        try {
            const response = await axios.get(targetUrl);
            const htmlContent = response.data;

            // Save HTML content to a file
            const fileName = `juscorpus.html`;  // for sitemap, better for web scrawling
            const filePath = path.join(__dirname, fileName);

            fs.writeFileSync(filePath, htmlContent, 'utf-8');
 
            const $ = cheerio.load(htmlContent);
            const elements = $('.post-read-more a').map((index, element) => $(element).attr('href')).get();
            
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