// https://www.pathlegal.in/ - pathlegal, Web Scrapping

const axios = require('axios');
const path = require('path');
const cheerio = require('cheerio');
const fs = require('fs');

const fileName = 'pathlegal.json';

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

    const combinedData = existingData.concat(validDataList)

    fs.writeFileSync(filePath, JSON.stringify(combinedData, null, 2), 'utf-8');
}

async function getData(url) {
    if(!url.startsWith('https://www.pathlegal.in')) return;

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const title = $('.in-head').text().trim();
        const paragraphs = $('.qa_content p').map((index, element) => $(element).text()).get();

        // Join paragraphs and clean up unwanted characters
        let dataString = paragraphs.join('').replace(/[\n\t]+/g, ' ').replace(/[\s\u200B-\u200D\uFEFF]+/g, ' ');

        const newsItem = {
            'headline': title,
            'data': dataString
        };

        return newsItem;
    } catch (error) {
        console.error('Error fetching data from:', url);
        return null;
    }
}

async function main() {
    let i = 1;

    while (i <= 11855) {
        const baseUrl = 'https://www.pathlegal.in/legal_law_help.php?main=any&key=A00000001';
        let targetUrl = `${baseUrl}&offset=${i}`;

        try {
            const response = await axios.get(targetUrl);
            const htmlContent = response.data;

            // Save HTML content to a file
            const fileName = `pathlegal.html`;  // for sitemap, better for web scrawling
            const filePath = path.join(__dirname, fileName);

            fs.writeFileSync(filePath, htmlContent, 'utf-8');

            const $ = cheerio.load(htmlContent);
            const elements = $('span.name a').map((index, element) => {
                let href = $(element).attr('href');
                return `https://www.pathlegal.in/${href}`; 
            }).get();
            
            if (elements.length === 0) {
                break; // No more pages
            }
            
            const tasks = elements.map(element => getData(element));
            const dataList = await Promise.all(tasks); // concurrent API requests for parallelizing
            
            updateFile(dataList);

            i++;
        } catch (error) {
            console.error('Error:', error.message);
            break;
        }
    }
}

main(); 