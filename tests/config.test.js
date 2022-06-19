import { state } from "../src/core/global";
import CookieConsent from "../src/index"
import testConfig from "./config/full-config";
import { defineCryptoRandom, resetCookieConsent, htmlHasClass, setUserAgent } from "./config/mocks-utils";

let api;
const botUserAgent = 'Mozilla/5.0 (Linux; Android 5.0; SM-G920A) AppleWebKit (KHTML, like Gecko) Chrome Mobile Safari (compatible; AdsBot-Google-Mobile; +http://www.google.com/mobile/adsbot.html)';

describe("Check modals' html generation under different settings", () =>{

    beforeAll(()=>{
        defineCryptoRandom();
        api = CookieConsent.init();
        testConfig.autoShow = true;
    })

    beforeEach(()=>{
        resetCookieConsent();
    })

    it('Consent Modal should not appear if consent is valid', async () => {
        await api.run(testConfig);
        api.accept();
        resetCookieConsent();
        await api.run(testConfig);
        expect(api.validConsent()).toBe(true);
        expect(htmlHasClass('show--consent')).toBe(false)
    })

    it('Revision change should cause invalid consent', async () => {
        testConfig.revision = 2;
        await api.run(testConfig);
        expect(api.validConsent()).toBe(false);
    })

    it('Consent modal should not appear if autoShow=false', async () => {
        api.eraseCookies('cc_cookie');
        testConfig.autoShow = false;
        await api.run(testConfig);
        expect(api.validConsent()).toBe(false);
        expect(htmlHasClass('show--consent')).toBe(false);
    })

    it('Plugin should stop if bot is detected', async () => {
        setUserAgent(botUserAgent);
        testConfig.hideFromBots = true;
        await api.run(testConfig);
        expect(state._botAgentDetected).toBe(true);
        expect(document.querySelector('#cc-main')).toBeNull();
    })

    it('Plugin should not detect bot if hideFromBots=false', async () => {
        setUserAgent(botUserAgent);
        testConfig.hideFromBots = false;
        await api.run(testConfig);
        expect(state._botAgentDetected).toBe(false);
        expect(document.querySelector('#cc-main')).toBeInstanceOf(HTMLElement);
    })

    it('Should not manage scripts when manageScriptTags=false', async () => {
        document.body.innerHTML = '<script type="text/plain" data-category="analytics" data-service="my_service"></script>';
        testConfig.manageScriptTags = false;
        await api.run(testConfig);
        api.accept('all');
        expect(state._allScriptTags.length).toBe(0);
        expect(document.body.querySelectorAll('script[data-category]').length).toBe(1);
    })
})