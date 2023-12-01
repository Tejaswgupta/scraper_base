// https://lawbhoomi.com/law-notes/ - Law Bhoomi, Web Scrapping

const axios = require('axios');
const path = require('path');
const cheerio = require('cheerio');
const fs = require('fs');

const fileName = 'lawnotes.json';

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
 
async function getData(lawNotesObject) { 
    const newsItem = {
        'headline': lawNotesObject?.topic, 
        'data': lawNotesObject?.link
    };

    return newsItem
}
 
async function main() {
    let i = 1;

    while (true) { 
        let targetUrl = 'https://lawbhoomi.com/law-notes/';
 
        try {
            const response = await axios.get(targetUrl);
            const htmlContent = response.data;

            // Save HTML content to a file
            const fileName = `lawnotes.html`;  // for sitemap, better for web scrawling
            const filePath = path.join(__dirname, fileName);

            fs.writeFileSync(filePath, htmlContent, 'utf-8');

            // Continue with the rest of your processing
            const $ = cheerio.load(htmlContent);
            const elements = $('figure.wp-block-table tbody tr').map((index, row) => {
                const $tds = $(row).find('td');
                const topic = $tds.eq(0).text().trim();
                const link = $tds.eq(1).find('a').attr('href');
                
                return { topic, link };
            }).get(); 

            const tasks = elements.map(async (element) => { 
                return await getData(element);   
            });
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