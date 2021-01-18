import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { constants } from './constants';

@Injectable()
export class AppService {

  constructor(){
  }

  /**
   * create new browser and instances and load website url
   * @returns {Promise<Object>}
   */
  private async loadPage():Promise<{
    browser:puppeteer.Browser,
    page:puppeteer.Page
  }>{
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      'ignoreHTTPSErrors': true   
    });

    const page = await browser.newPage();

    await page.goto(constants.url);

    await page.waitForSelector('aside[class="faqs-wrapper"]')

    return {
      browser,
      page
    }


  }

  async scrap():Promise<Object>{
    try {
      const { page } = await this.loadPage(); 

      const results = await page.evaluate(() => {
        
        let accordion = document.querySelectorAll('div[class="z-accordion-container"]');
        let questionCollector:string[] = [];
        let askCollector:string[] = [];
        accordion.forEach(item => {
          //click to open asks
          item.querySelectorAll('section').forEach(section => {
            
            section.click()
          })
          //get all questions
          item.querySelectorAll('section div div p').forEach(p => {
            questionCollector.push(p.textContent);
          })
          //get all asks
          item.querySelectorAll('div div[class="faq-text"]').forEach(d => {
            askCollector.push(d.innerHTML)
          })

        })
        return {
          questionCollector,
          askCollector
        }
      });

      const data = results.questionCollector.map((e, idx) => {
        return {
          question: e,
          ask: results.askCollector[idx]
        }
      })

      
      return  {
        timestamp: (new Date()).getTime(),
        error: false,
        data: data
      }
      
    } catch (error) {
      console.error(error);
      return {
        timestamp: (new Date()).getTime(),
        error: true,
        data: []
      }
    }
    
  }
}
