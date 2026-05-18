
import axios from 'axios';
import * as cheerio from 'cheerio';
import { connectDB } from '@/app/api/lib/db';
import { Tool } from '@/app/api/models/Tool';

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-+/g, '-');
}

export async function scrapeNewTools() {
    try {
        console.log('Starting scraper...');
        await connectDB();

        // Target URL - TopAI.tools is a good source
        const url = 'https://topai.tools/browse';

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            }
        });

        const $ = cheerio.load(response.data);
        const toolsFound: any[] = [];
        let newToolsCount = 0;

        // Using the selectors identified by browser inspection
        $('.col-12.col-md-6.col-lg-3').each((_, element) => {
            try {
                const card = $(element);

                // Extract Name
                const nameElement = card.find('a.text-dark');
                const name = nameElement.text().trim();

                if (!name) return;

                // Extract Description
                // Try .show-description first, fallback to finding text in card body
                let description = card.find('.show-description').text().trim();
                if (!description) {
                    // Fallback: look for text blocks of reasonable length
                    description = card.find('p, .card-text').filter((i, el) => $(el).text().trim().length > 20).first().text().trim();
                }

                // Extract Links
                const relativeDetailLink = card.find('a[href^="/t/"]').attr('href');
                const visitLink = card.find('a[href*="via="]').attr('href');

                // Construct clean Website URL (resolving the actual destination is hard without visiting, 
                // so we will store the 'via' link and let admin fix it or rely on redirects)
                // Or better, clean the ?via= part if possible, but TopAI uses redirects. 
                // We'll store the full link for now.
                const websiteUrl = visitLink ? (visitLink.startsWith('http') ? visitLink : `https://topai.tools${visitLink}`) : '';

                // Extract Logo
                const logoSrc = card.find('img').attr('src');
                const logo = logoSrc ? (logoSrc.startsWith('http') ? logoSrc : `https://topai.tools${logoSrc}`) : '';

                if (name && websiteUrl) {
                    toolsFound.push({
                        name,
                        description: description || `AI tool for ${name}`,
                        websiteUrl,
                        logo,
                        sourceLink: relativeDetailLink ? `https://topai.tools${relativeDetailLink}` : url
                    });
                }
            } catch (err) {
                console.error('Error parsing individual tool card:', err);
            }
        });

        console.log(`Found ${toolsFound.length} tools on the page.`);

        // Process found tools
        for (const toolData of toolsFound) {
            // Check if exists
            const existing = await Tool.findOne({
                $or: [
                    { name: toolData.name },
                    { websiteUrl: toolData.websiteUrl }
                ]
            });

            if (!existing) {
                const slug = generateSlug(toolData.name);

                // Ensure slug uniqueness (basic check)
                const slugExists = await Tool.findOne({ slug });
                const finalSlug = slugExists ? `${slug}-${Math.floor(Math.random() * 1000)}` : slug;

                // Create new pending tool
                await Tool.create({
                    name: toolData.name,
                    slug: finalSlug,
                    description: toolData.description.substring(0, 500), // Enforce limit
                    websiteUrl: toolData.websiteUrl,
                    logo: toolData.logo,
                    status: 'pending', // Default to pending for review
                    category: 'Uncategorized', // Placeholder
                    tags: ['New AI Tool', 'Scraped'], // Default tags
                    features: ['AI Powered', 'Automated Discovery'], // Default feature
                    pricing: { type: 'free' }, // Default pricing
                    isNew: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                console.log(`Added new tool: ${toolData.name}`);
                newToolsCount++;
            }
        }

        return {
            success: true,
            found: toolsFound.length,
            added: newToolsCount,
            message: `Scraping complete. Found ${toolsFound.length} tools, added ${newToolsCount} new ones.`
        };

    } catch (error) {
        console.error('Scraping failed:', error);
        throw error;
    }
}
