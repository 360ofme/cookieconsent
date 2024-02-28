import { globalObj } from '../global';

import {
    _log,
    createNode,
    addClass,
    addId,
    addClassQrm,
    setAttribute,
    appendChild,
    addEvent,
    getModalFocusableData,
    addDataButtonListeners,
    getSvgIcon,
    handleFocusTrap,
    fireEvent
} from '../../utils/general';

import {
    QR_MODAL_NAME,
    DIV_TAG,
    ARIA_HIDDEN,
    BUTTON_TAG,
    CLICK_EVENT
} from '../../utils/constants';

import { guiManager } from '../../utils/gui-manager';
import { createPreferencesModal } from './preferencesModal';

/**
 * @callback CreateMainContainer
 */

/**
 * @returns {HTMLSpanElement}
 */
/*const createFocusSpan = () => {
    const span = createNode('span');

    if (!globalObj._dom._focusSpan)
        globalObj._dom._focusSpan = span;

    return span;
};*/

/**
 * Create qr modal and append it to "cc-main" el.
 * @param {import("../global").Api} api
 * @param {CreateMainContainer} createMainContainer
 */
export const createQRModal = (api, createMainContainer) => {
    const state = globalObj._state;
    const dom = globalObj._dom;
    const {hide, hideQR} = api;
    const consentModalTitleValue = 'Scan QR';
    /**
     * @type {import("../global").PreferencesModalOptions}
     */
    const modalData = state._currentTranslation && state._currentTranslation.preferencesModal;

    // Create modal if it doesn't exist
    if (!dom._qrmContainer) {
        dom._qrmContainer = createNode(DIV_TAG);
        addClass(dom._qrmContainer, 'qrm-wrapper');

        const qrmOverlay = createNode('div');
        addClass(qrmOverlay, 'qrm-overlay');
        appendChild(dom._qrmContainer, qrmOverlay);

        /**
         * Hide modal when overlay is clicked
         */
        addEvent(qrmOverlay, CLICK_EVENT, hideQR);

        addEvent(dom._htmlDom, 'keydown', (event) => {
            if (event.keyCode === 27)
                hideQR();
        }, true);

        // QR modal
        dom._qrm = createNode(DIV_TAG);
        addClass(dom._qrm, 'qrm');
        setAttribute(dom._qrm, 'role', 'dialog');
        setAttribute(dom._qrm, ARIA_HIDDEN, true);
        setAttribute(dom._qrm, 'aria-modal', true);

        dom._qrmTwo = createNode(DIV_TAG);
        addClass(dom._qrmTwo, 'qrm');
        setAttribute(dom._qrmTwo, 'role', 'dialog');
        setAttribute(dom._qrmTwo, ARIA_HIDDEN, true);
        setAttribute(dom._qrmTwo, 'aria-modal', true);

        

        dom._qrmHeader = createNode(DIV_TAG);
        addClassQrm(dom._qrmHeader, 'header');

        dom._qrmImage = createNode('img');
        addClassQrm(dom._qrmImage, 'img-title');

        dom._qrmCloseBtn = createNode(BUTTON_TAG);
        addClassQrm(dom._qrmCloseBtn, 'close-btn');
        setAttribute(dom._qrmCloseBtn, 'aria-label', modalData.closeIconLabel || '');
        addEvent(dom._qrmCloseBtn, CLICK_EVENT, hideQR);

        dom._qrmFocusSpan = createNode('span');
        dom._qrmFocusSpan.innerHTML = getSvgIcon();
        appendChild(dom._qrmCloseBtn, dom._qrmFocusSpan);

        appendChild(dom._qrmHeader, dom._qrmImage);
        appendChild(dom._qrmHeader, dom._qrmCloseBtn);

        //dom._qrmTitle.innerHTML = titleData;
        const imageData = 'data:image/png;base64,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';
        dom._qrmImage.src = imageData; // Set the source path of the image
        modalData.closeIconLabel && setAttribute(dom._qrmCloseBtn, 'aria-label', modalData.closeIconLabel);

        const
            boxLayout = 'box',
            guiOptions = state._userConfig.guiOptions,
            consentModalOptions = guiOptions && guiOptions.consentModal,
            consentModalLayout = consentModalOptions && consentModalOptions.layout || boxLayout,
            isBoxLayout = consentModalLayout.split(' ')[0] === boxLayout;

        // main body + 2 main divs to split the body
        dom._qrmBody = createNode(DIV_TAG);
        dom._leftSide = createNode(DIV_TAG);
        dom._rightSide = createNode(DIV_TAG);

        addClassQrm(dom._qrmBody, 'body');
        addClassQrm(dom._leftSide, 'left-side');
        addClassQrm(dom._rightSide, 'right-side');


        dom._qrmLeftInfoLeftSide = createNode(DIV_TAG);
        addClassQrm(dom._qrmLeftInfoLeftSide, 'left-info-left-side');
        dom._qrmLeftInfoRightSide = createNode(DIV_TAG);
        addClassQrm(dom._qrmLeftInfoRightSide, 'left-info-right-side');

        dom._qrmLeftBannerTitle = createNode('h2');
        addClassQrm(dom._qrmLeftBannerTitle, 'banner-title');
        dom._qrmLeftBannerTitle.innerHTML = 'This website uses cookies';


        appendChild(dom._qrmLeftInfoRightSide, dom._qrmLeftBannerTitle);

        //////////  

        // title + steps on the left side
        dom._qrmLeftMainTitle = createNode('h2');
        addClassQrm(dom._qrmLeftMainTitle, 'left-main-title');
        dom._qrmLeftMainTitle.innerHTML = ' Manage Your Cookies With 360ofme';

        appendChild(dom._leftSide, dom._qrmLeftMainTitle);

        dom.qrmLeftStepOne =  createNode(DIV_TAG);
        dom.qrmLeftStepTwo =  createNode(DIV_TAG);
        dom.qrmLeftStepThree =  createNode(DIV_TAG);
        addClassQrm(dom.qrmLeftStepOne, 'left-step');
        addClassQrm(dom.qrmLeftStepTwo, 'left-step');
        addClassQrm(dom.qrmLeftStepThree, 'left-step');

        dom._qrmLeftStepOneText = createNode('p');
        addClassQrm(dom._qrmLeftStepOneText, 'step-text');
        dom._qrmLeftStepOneText.innerHTML = 'Verify your identity to secure your data';
        appendChild(dom.qrmLeftStepOne, dom._qrmLeftStepOneText);


        dom._qrmLeftStepTwoText = createNode('p');
        addClassQrm(dom._qrmLeftStepTwoText, 'step-text');
        dom._qrmLeftStepTwoText.innerHTML = 'Granular consent level options; decide what personal data you want to share under what conditions';
        appendChild(dom.qrmLeftStepTwo, dom._qrmLeftStepTwoText);

        dom._qrmLeftStepThreeText = createNode('p');
        addClassQrm(dom._qrmLeftStepThreeText, 'step-text');
        dom._qrmLeftStepThreeText.innerHTML = 'Manage your consent with a historical consent log';
        appendChild(dom.qrmLeftStepThree, dom._qrmLeftStepThreeText);

        appendChild(dom._leftSide, dom.qrmLeftStepOne);
        appendChild(dom._leftSide, dom.qrmLeftStepTwo);
        appendChild(dom._leftSide, dom.qrmLeftStepThree);

        /////

        /// IU for right side
        dom.qrmQRCodeContainer =  createNode(DIV_TAG);
        addClassQrm(dom.qrmQRCodeContainer, 'qr-container');
        addId(dom.qrmQRCodeContainer, 'qrcode');
        appendChild(dom._rightSide, dom.qrmQRCodeContainer);

        dom.qrmRightStepOne =  createNode(DIV_TAG);
        dom.qrmRightStepTwo =  createNode(DIV_TAG);
        addClassQrm(dom.qrmRightStepOne, 'right-step');
        addClassQrm(dom.qrmRightStepTwo, 'right-step');

        dom._qrmRightStepOneText = createNode('p');
        addClassQrm(dom._qrmRightStepOneText, 'step-text');
        dom._qrmRightStepOneText.innerHTML = '1. Open 360ofme Mobile App';
        appendChild(dom.qrmRightStepOne, dom._qrmRightStepOneText);

        dom._qrmRightStepTwoText = createNode('p');
        addClassQrm(dom._qrmRightStepTwoText, 'step-text');
        dom._qrmRightStepTwoText.innerHTML = '2. Open Scanner then scan';
        appendChild(dom.qrmRightStepTwo, dom._qrmRightStepTwoText);

        appendChild(dom._rightSide, dom.qrmRightStepOne);
        appendChild(dom._rightSide, dom.qrmRightStepTwo);


        //////

        dom._qrmDivTabindex = createNode(DIV_TAG);
        setAttribute(dom._qrmDivTabindex, 'tabIndex', -1);
        appendChild(dom._qrm, dom._qrmDivTabindex);
        appendChild(dom._qrm, dom._qrmHeader);
        appendChild(dom._qrm, dom._qrmBody);


        dom._qrmBodyTwo = createNode(DIV_TAG);


        dom._qrmDivTabindexTwo = createNode(DIV_TAG);
        setAttribute(dom._qrmDivTabindexTwo, 'tabIndex', -1);
        appendChild(dom._qrmTwo, dom._qrmDivTabindexTwo);
        appendChild(dom._qrmTwo, dom._qrmBodyTwo);
        
        appendChild(dom._qrmBody, dom._leftSide);
        appendChild(dom._qrmBody, dom._rightSide);
        
        appendChild(dom._qrmContainer, dom._qrm);
        appendChild(dom._qrmContainer, dom._qrmTwo);
    }

    guiManager(2);

    if (!state._qrModalExists) {
        state._qrModalExists = true;

        _log('CookieConsent [HTML] created', QR_MODAL_NAME);

        fireEvent(globalObj._customEvents._onModalReady, QR_MODAL_NAME, dom._qrm);
        createMainContainer(api);
        appendChild(dom._ccMain, dom._qrmContainer);
        handleFocusTrap(dom._qrm);

        /**
         * Enable transition
         */
        setTimeout(() => addClass(dom._qrmContainer, 'cc--anim'), 100);
    }

    getModalFocusableData(3);

    addDataButtonListeners(dom._qrmBody, api, createPreferencesModal, createMainContainer);
};