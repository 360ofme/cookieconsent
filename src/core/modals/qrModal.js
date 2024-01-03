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
     * @param {string|string[]} [categories]
     */
    const acceptAndHide = (categories) => {
        hide();
        //acceptCategory(categories);
    };

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
        addId(dom._qrm, 'qrcode');

        setAttribute(dom._qrm, 'role', 'dialog');
        setAttribute(dom._qrm, ARIA_HIDDEN, true);
        setAttribute(dom._qrm, 'aria-modal', true);
        //setAttribute(dom._qrm, 'aria-labelledby', 'qrm__title');

        //dom._qrmBody = createNode(DIV_TAG);
        //dom._qrmTexts = createNode(DIV_TAG);
        //dom._qrmBtns = createNode(DIV_TAG);

        //addClassQrm(dom._qrmBody, 'body');
        //addClassQrm(dom._qrmTexts, 'texts');
        //addClassQrm(dom._qrmBtns, 'btns');

        //setAttribute(dom._qrm, 'aria-describedby', 'qrm__desc');


        const
            boxLayout = 'box',
            guiOptions = state._userConfig.guiOptions,
            consentModalOptions = guiOptions && guiOptions.consentModal,
            consentModalLayout = consentModalOptions && consentModalOptions.layout || boxLayout,
            isBoxLayout = consentModalLayout.split(' ')[0] === boxLayout;

        /**
         * Close icon-button (visible only in the 'box' layout)
         */
        /*if (isBoxLayout) {
            if (!dom._qrmCloseIconBtn) {
                dom._qrmCloseIconBtn = createNode(BUTTON_TAG);
                dom._qrmCloseIconBtn.innerHTML = getSvgIcon();
                addClassQrm(dom._qrmCloseIconBtn, 'btn');
                addClassQrm(dom._qrmCloseIconBtn, 'btn--close');
                addEvent(dom._qrmCloseIconBtn, CLICK_EVENT, () => {
                    _log('CookieConsent [ACCEPT]: necessary');
                    acceptAndHide([]);
                });
                appendChild(dom._qrmBody, dom._qrmCloseIconBtn);
            }

            //setAttribute(dom._qrmCloseIconBtn, 'aria-label', closeIconLabelData);
        }*/

        //appendChild(dom._qrmBody, dom._qrmTexts);


        dom._qrmDivTabindex = createNode(DIV_TAG);
        setAttribute(dom._qrmDivTabindex, 'tabIndex', -1);
        appendChild(dom._qrm, dom._qrmDivTabindex);

        //appendChild(dom._qrm, dom._qrmBody);
        appendChild(dom._qrmContainer, dom._qrm);

        //var qrcode = new QRCode(document.getElementById('qrcode'));
        //qrcode.makeCode('ole.com.ar');

    }

    /*if (consentModalTitleValue) {
        if (!dom._qrmTitle) {
            dom._qrmTitle = createNode('h2');
            dom._qrmTitle.className = dom._qrmTitle.id = 'qrm__title';
            appendChild(dom._qrmTexts, dom._qrmTitle);
        }

        dom._qrmTitle.innerHTML = consentModalTitleValue;
    }*/

    /*let description = consentModalData.description;

    if (description) {
        if (state._revisionEnabled) {
            description = description.replace(
                '{{revisionMessage}}',
                state._validRevision
                    ? ''
                    : consentModalData.revisionMessage || ''
            );
        }

        if (!dom._qrmDescription) {
            dom._qrmDescription = createNode('p');
            dom._qrmDescription.className = dom._qrmDescription.id = 'qrm__desc';
            appendChild(dom._qrmTexts, dom._qrmDescription);
        }

        dom._qrmDescription.innerHTML = description;
    }*/

    /*if (acceptAllBtnData) {
        if (!dom._cmAcceptAllBtn) {
            dom._cmAcceptAllBtn = createNode(BUTTON_TAG);
            appendChild(dom._cmAcceptAllBtn, createFocusSpan());
            addClassCm(dom._cmAcceptAllBtn, 'btn');
            setAttribute(dom._cmAcceptAllBtn, DATA_ROLE, 'all');

            /*addEvent(dom._cmAcceptAllBtn, CLICK_EVENT, () => {
                _log('CookieConsent [ACCEPT]: all');
                acceptAndHide('all');
            });
        }

        dom._cmAcceptAllBtn.firstElementChild.innerHTML = acceptAllBtnData;
    }*/

    /*if (acceptNecessaryBtnData) {
        if (!dom._cmAcceptNecessaryBtn) {
            dom._cmAcceptNecessaryBtn = createNode(BUTTON_TAG);
            appendChild(dom._cmAcceptNecessaryBtn, createFocusSpan());
            addClassCm(dom._cmAcceptNecessaryBtn, 'btn');
            setAttribute(dom._cmAcceptNecessaryBtn, DATA_ROLE, 'necessary');

            /*addEvent(dom._cmAcceptNecessaryBtn, CLICK_EVENT, () => {
                _log('CookieConsent [ACCEPT]: necessary');
                acceptAndHide([]);
            });
        }

        dom._cmAcceptNecessaryBtn.firstElementChild.innerHTML = acceptNecessaryBtnData;
    }*/

    /*if (!dom._qrmBtnGroup) {
        dom._qrmBtnGroup = createNode(DIV_TAG);
        addClassQrm(dom._qrmBtnGroup, BTN_GROUP_CLASS);

        acceptAllBtnData && appendChild(dom._qrmBtnGroup, dom._qrmAcceptAllBtn);
        acceptNecessaryBtnData && appendChild(dom._qrmBtnGroup, dom._qrmAcceptNecessaryBtn);

        (acceptAllBtnData || acceptNecessaryBtnData) && appendChild(dom._qrmBody, dom._qrmBtnGroup);
        appendChild(dom._qrmBtns, dom._qrmBtnGroup);
    }

    if (dom._qrmShowPreferencesBtn && !dom._qrmBtnGroup2) {
        dom._qrmBtnGroup2 = createNode(DIV_TAG);

        if ((!dom._qrmAcceptNecessaryBtn || !dom._qrmAcceptAllBtn)) {
            appendChild(dom._qrmBtnGroup, dom._qrmShowPreferencesBtn);
            addClassQrm(dom._qrmBtnGroup, BTN_GROUP_CLASS + '--uneven');
        }else {
            addClassQrm(dom._qrmBtnGroup2, BTN_GROUP_CLASS);
            appendChild(dom._qrmBtnGroup2, dom._qrmShowPreferencesBtn);
            appendChild(dom._qrmBtns, dom._qrmBtnGroup2);
        }
    }*/

    /*if (footerData) {
        if (!dom._qrmFooterLinksGroup) {
            let _consentModalFooter = createNode(DIV_TAG);
            let _consentModalFooterLinks = createNode(DIV_TAG);
            dom._cmFooterLinksGroup = createNode(DIV_TAG);

            addClassQrm(_consentModalFooter, 'footer');
            addClassQrm(_consentModalFooterLinks, 'links');
            //addClassQrm(dom._qrmFooterLinksGroup, 'link-group');

            appendChild(_consentModalFooterLinks, dom._qrmFooterLinksGroup);
            appendChild(_consentModalFooter, _consentModalFooterLinks);
            appendChild(dom._qrm, _consentModalFooter);
        }

        dom._qrmFooterLinksGroup.innerHTML = footerData;
    }*/

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