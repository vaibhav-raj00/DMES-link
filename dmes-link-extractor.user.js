// ==UserScript==
// @name         DMES Link Extractor
// @namespace    http://tampermonkey.net/
// @version      2.3
// @description  Extract DMES links
// @author       Vaibhav
// @match        https://www.battlexo.com/tournaments*
// @match        https://battlexo.com/tournaments*
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    // Create the button
    function createButton() {
        const button = document.createElement('button');
        button.innerHTML = '📋 DMES LINK';
        button.style.position = 'fixed';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.style.zIndex = '9999';
        button.style.backgroundColor = '#2c3e50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.padding = '12px 20px';  // Increased padding
        button.style.borderRadius = '6px';   // Increased border radius
        button.style.cursor = 'pointer';
        button.style.fontSize = '16px';      // Increased font size
        button.style.fontWeight = 'bold';
        button.style.boxShadow = '0 3px 6px rgba(0,0,0,0.3)'; // Enhanced shadow

        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = '#34495e';
        });
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = '#2c3e50';
        });

        button.addEventListener('click', extractAndShowPopup);
        document.body.appendChild(button);
    }

    // Function to extract and show popup
    function extractAndShowPopup() {
        showNotification('🔍 Searching for DMES tournaments...');

        const results = [];
        const allCards = document.querySelectorAll('.GX_6xt');

        allCards.forEach((card, index) => {
            const title = card.querySelector('.MU8Ur7');
            const host = card.querySelector('.SBv5l6');
            const timeDiv = card.querySelector('._4YevBQ');

            if (
                title && host && timeDiv &&
                title.textContent.toUpperCase().includes('DMES COMPETITIVE SCRIMS') &&
                host.textContent.trim().toUpperCase() === 'DEATHMATE ESPORTS'
            ) {
                let linkTag = card.querySelector('a[href*="/tournaments/"]') ||
                             card.parentElement?.querySelector('a[href*="/tournaments/"]') ||
                             card.closest('a') ||
                             card.parentElement?.closest('a');

                if (!linkTag) {
                    let parent = card.parentElement;
                    while (parent && !linkTag && parent !== document.body) {
                        linkTag = parent.querySelector('a[href*="/tournaments/"]');
                        parent = parent.parentElement;
                    }
                }

                if (linkTag) {
                    let time = 'TIME_NOT_FOUND';

                    const titleTimeMatch = title.textContent.match(/\((\d{1,2}:\d{2}\s*[AP]M)\)/i);
                    if (titleTimeMatch) {
                        time = titleTimeMatch[1];
                    } else {
                        const timeDivMatch = timeDiv.textContent.match(/(\d{1,2}:\d{2}\s*[AP]M)/i);
                        if (timeDivMatch) {
                            time = timeDivMatch[1];
                        } else {
                            const cardTimeMatch = card.textContent.match(/(\d{1,2}:\d{2}\s*[AP]M)/gi);
                            if (cardTimeMatch && cardTimeMatch.length > 0) {
                                time = cardTimeMatch[cardTimeMatch.length - 1];
                            }
                        }
                    }

                    let link = linkTag.getAttribute('href');
                    if (link.startsWith('/')) link = `https://www.battlexo.com${link}`;
                    results.push({time: time, link: link});
                }
            }
        });

        // Sort results by time
        results.sort((a, b) => {
            const parseTime = (timeStr) => {
                const [hour, minute] = timeStr.match(/\d+/g).map(Number);
                const isPM = timeStr.includes('PM');
                return (isPM && hour !== 12 ? hour + 12 : hour === 12 && !isPM ? 0 : hour) * 60 + minute;
            };
            return parseTime(a.time) - parseTime(b.time);
        });

        showPopup(results);
    }

    // Generate formatted content
    function generateContent(results) {
        if (results.length === 0) return {};

        // Calculate time range with proper AM/PM handling
        const firstTime = results[0].time;
        const lastTime = results[results.length - 1].time;

        // Original function for start hour - keep as is
        const getStartHour = (timeStr) => {
            const hour = parseInt(timeStr.match(/\d+/)[0]);
            const isPM = timeStr.includes('PM');

            if (isPM) {
                if (hour === 12) return '12 PM';
                return `${hour} PM`;
            } else {
                if (hour === 12) return '12 AM';
                return `${hour} AM`;
            }
        };

        // New function for end hour - round up when minutes > 0
        const getEndHour = (timeStr) => {
            // Extract hour and minutes
            const matches = timeStr.match(/(\d{1,2}):(\d{2})\s*([AP]M)/i);
            if (!matches) return 'Unknown';

            const hour = parseInt(matches[1]);
            const minutes = parseInt(matches[2]);
            const period = matches[3].toUpperCase();

            // If there are minutes > 0, round up to the next hour
            if (minutes > 0) {
                if (period === 'PM') {
                    if (hour === 12) return '1 PM'; // 12:XX PM rounds to 1 PM
                    if (hour === 11) return '12 PM'; // 11:XX PM rounds to 12 PM
                    return `${hour + 1} PM`;
                } else { // AM
                    if (hour === 12) return '1 AM'; // 12:XX AM rounds to 1 AM
                    if (hour === 11) return '12 PM'; // 11:XX AM rounds to 12 PM
                    return `${hour + 1} ${hour === 11 ? 'PM' : 'AM'}`; // Handle 11:XX AM to 12 PM transition
                }
            } else {
                // No minutes, just return the hour
                if (period === 'PM') {
                    return `${hour} PM`;
                } else {
                    return `${hour} AM`;
                }
            }
        };

        // Get formatted hours
        const startHour = getStartHour(firstTime);
        const endHour = getEndHour(lastTime);

        // Header
        const header = `*🇮🇳 DEATHMATE ESPORTS 🇮🇳*
*🧡 COMPETITIVE SCRIMS 🧡*

*MATCH TIME : ${startHour} - ${endHour}*

*🔰 PRIZEPOOL - 600 XO POINTS*
*🔰 ADVANCE ROOMS 🔥*
*🔰 PP DISTRIBUTION 👇*
*#1 - 300 POINTS*
*#2 - 200 POINTS*
*#3 - 100 POINTS*
*🔰 XO POINTS CAN BE REDEEMED IN XO SHOP FOR BGMI UC & GIFTCARDS*
━━━━━━━━━━━━━━━━━━━━`;

        // Footer
        const footer = `━━━━━━━━━━━━━━━━━━━━
*JOIN FOR QUERIES -* https://chat.whatsapp.com/KdN7Ep25VARGUI8UKhZrar`;

        // Links with spacing
        const first6Links = results.slice(0, 6).map(r => `*${r.time} :* ${r.link}`).join('\n\n');
        const remainingLinks = results.slice(6).map(r => `*${r.time} :* ${r.link}`).join('\n\n');

        // If 6 or fewer links, combine everything
        if (results.length <= 6) {
            const allContent = `${header}\n${first6Links}\n${footer}`;
            return {
                section1: { name: 'All LINKS MENTIONED BELOW', content: allContent },
                section2: null
            };
        } else {
            // More than 6 links, split into two sections
            const headerAndFirst6 = `${header}\n${first6Links}`;
            const remainingAndFooter = `${remainingLinks}\n${footer}`;
            return {
                section1: { name: 'Header & First 6 Links', content: headerAndFirst6 },
                section2: { name: 'Remaining Links & Footer', content: remainingAndFooter }
            };
        }
    }

    // Create and show popup with admin dashboard theme
    function showPopup(results) {
        const existingPopup = document.getElementById('dmes-popup');
        if (existingPopup) existingPopup.remove();

        const content = generateContent(results);

        // Create popup overlay with admin dashboard theme
        const overlay = document.createElement('div');
        overlay.id = 'dmes-popup';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0, 0, 0, 0.85);
            z-index: 10000;
            display: flex; justify-content: center; align-items: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;

        // Create popup content with admin theme - increased size
        const popup = document.createElement('div');
        popup.style.cssText = `
            background-color: #1e293b;
            border-radius: 10px;
            width: 95%;
            max-width: 900px;
            max-height: 95%;
            overflow-y: auto;
            box-shadow: 0 15px 30px rgba(0,0,0,0.5);
            border: 1px solid #475569;
            position: relative;
            display: flex;
            flex-direction: column;
        `;

        // Header bar - increased size
        const headerBar = document.createElement('div');
        headerBar.style.cssText = `
            background-color: #0f172a;
            padding: 20px 25px;
            border-top-left-radius: 10px;
            border-top-right-radius: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #334155;
        `;

        // Title - increased size
        const title = document.createElement('h2');
        title.textContent = 'DMES Tournament Links';
        title.style.cssText = `
            margin: 0;
            color: #fff;
            font-size: 22px;
            font-weight: 600;
        `;

        // Close button - increased size
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            background: transparent;
            border: none;
            font-size: 22px;
            cursor: pointer;
            color: #94a3b8;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            transition: all 0.2s ease;
        `;
        closeBtn.onmouseover = () => {
            closeBtn.style.backgroundColor = '#334155';
            closeBtn.style.color = '#ffffff';
        };
        closeBtn.onmouseout = () => {
            closeBtn.style.backgroundColor = 'transparent';
            closeBtn.style.color = '#94a3b8';
        };
        closeBtn.onclick = () => overlay.remove();

        headerBar.appendChild(title);
        headerBar.appendChild(closeBtn);
        popup.appendChild(headerBar);

        // Content area - increased padding
        const contentArea = document.createElement('div');
        contentArea.style.cssText = `
            padding: 30px;
            color: #e2e8f0;
        `;
        popup.appendChild(contentArea);

        if (results.length > 0) {
            // Create sections
            const sections = [content.section1, content.section2].filter(Boolean);

            sections.forEach((section, index) => {
                const sectionDiv = document.createElement('div');
                sectionDiv.style.cssText = `
                    background-color: #2d3748;
                    border-radius: 8px;
                    margin-bottom: ${index < sections.length - 1 ? '30px' : '0'};
                    overflow: hidden;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                `;

                const sectionHeader = document.createElement('div');
                sectionHeader.style.cssText = `
                    background-color: #1a202c;
                    padding: 16px 20px;
                    border-bottom: 1px solid #4a5568;
                `;

                const sectionTitle = document.createElement('h3');
                sectionTitle.textContent = section.name;
                sectionTitle.style.cssText = `
                    margin: 0;
                    color: #3b82f6;
                    font-size: 18px;
                    font-weight: 500;
                `;

                sectionHeader.appendChild(sectionTitle);
                sectionDiv.appendChild(sectionHeader);

                const sectionContent = document.createElement('div');
                sectionContent.style.cssText = `
                    padding: 20px;
                `;

                const textarea = document.createElement('textarea');
                textarea.value = section.content;
                textarea.style.cssText = `
                    width: 100%;
                    height: 250px;
                    padding: 16px;
                    background-color: #0f172a;
                    color: #e2e8f0;
                    border: 1px solid #475569;
                    border-radius: 6px;
                    font-size: 15px;
                    font-family: 'Consolas', 'Monaco', monospace;
                    resize: vertical;
                    outline: none;
                    margin-bottom: 20px;
                    line-height: 1.6;
                `;
                textarea.onclick = () => textarea.select();

                const buttonRow = document.createElement('div');
                buttonRow.style.cssText = `
                    display: flex;
                    gap: 15px;
                `;

                const copyBtn = document.createElement('button');
                copyBtn.innerHTML = `📋 Copy`;
                copyBtn.style.cssText = `
                    background-color: #3b82f6;
                    color: white;
                    border: none;
                    padding: 14px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                `;

                copyBtn.onmouseover = () => {
                    copyBtn.style.backgroundColor = '#2563eb';
                };
                copyBtn.onmouseout = () => {
                    copyBtn.style.backgroundColor = '#3b82f6';
                };

                copyBtn.onclick = () => {
                    textarea.select();
                    document.execCommand('copy');
                    copyBtn.innerHTML = '✅ Copied!';
                    copyBtn.style.backgroundColor = '#10b981';
                    setTimeout(() => {
                        copyBtn.innerHTML = `📋 Copy`;
                        copyBtn.style.backgroundColor = '#3b82f6';
                    }, 2000);
                };

                buttonRow.appendChild(copyBtn);
                sectionContent.appendChild(textarea);
                sectionContent.appendChild(buttonRow);
                sectionDiv.appendChild(sectionContent);
                contentArea.appendChild(sectionDiv);
            });

        } else {
            const noResults = document.createElement('div');
            noResults.style.cssText = `
                background-color: #2d3748;
                padding: 50px 20px;
                text-align: center;
                border-radius: 8px;
            `;

            const noResultsIcon = document.createElement('div');
            noResultsIcon.innerHTML = '🔎';
            noResultsIcon.style.cssText = `
                font-size: 40px;
                margin-bottom: 20px;
            `;

            const noResultsText = document.createElement('p');
            noResultsText.textContent = 'No DMES Competitive Scrims tournaments found.';
            noResultsText.style.cssText = `
                color: #94a3b8;
                font-size: 18px;
                margin: 0;
            `;

            noResults.appendChild(noResultsIcon);
            noResults.appendChild(noResultsText);
            contentArea.appendChild(noResults);
        }

        // Footer - increased size
        const footer = document.createElement('div');
        footer.style.cssText = `
            padding: 16px 25px;
            background-color: #0f172a;
            border-top: 1px solid #334155;
            text-align: center;
            color: #64748b;
            font-size: 14px;
            border-bottom-left-radius: 10px;
            border-bottom-right-radius: 10px;
        `;
        footer.innerHTML = 'Developed by <strong>Vaibhav</strong>';
        popup.appendChild(footer);

        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        // Close popup when clicking outside
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };

        // Close with Escape key
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        });
    }

    // Show notification - increased size
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 70px;
            right: 20px;
            z-index: 9999;
            background-color: #2d3748;
            color: white;
            padding: 14px 20px;
            border-radius: 6px;
            font-size: 16px;
            box-shadow: 0 6px 12px rgba(0,0,0,0.15);
            border-left: 5px solid #3b82f6;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;

        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 2000);
    }

    // Initialize
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(createButton, 1000);
            });
        } else {
            setTimeout(createButton, 1000);
        }
    }

    init();
})();
